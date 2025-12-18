<?php
// server/item/place_bid.php

error_reporting(0);
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include '../config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id']) || $_SESSION['user_id'] === '0') {
    echo json_encode(['success' => false, 'message' => 'Please login to place a bid with a valid account.']);
    exit;
}

$user_id = (string)$_SESSION['user_id']; 

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$item_id = $data['item_id'] ?? null;
$bid_amount = $data['bid_amount'] ?? null;

// Validation
if (!$item_id || !$bid_amount) {
    echo json_encode(['success' => false, 'message' => 'Item ID and bid amount are required']);
    exit;
}
if (!is_numeric($bid_amount) || $bid_amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid bid amount']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $db->begin_transaction();

    // 1. Get item details
    $stmt = $db->prepare("
        SELECT i.title, i.seller_id, bi.starting_price, bi.bid_increment_percent 
        FROM item i 
        LEFT JOIN biditem bi ON i.item_id = bi.item_id 
        WHERE i.item_id = ?
    ");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $item_result = $stmt->get_result();
    $item_data = $item_result->fetch_assoc();
    $stmt->close();

    if (!$item_data) {
        throw new Exception("Item not found");
    }

    $starting_price = $item_data['starting_price'] ?? 0;
    $bid_increment_percent = $item_data['bid_increment_percent'] ?? 0;

    // 2. Calculate minimum required bid based on the absolute highest bid found
    $stmt = $db->prepare("
        SELECT MAX(bid_amount) as absolute_highest_bid 
        FROM bidoffer 
        WHERE item_id = ?
    ");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $bid_row = $result->fetch_assoc();
    $stmt->close();

    $absolute_highest_bid = $bid_row['absolute_highest_bid'] ?: $starting_price;
    $increment_amount = $absolute_highest_bid * ($bid_increment_percent / 100);
    $minimum_required_bid = $absolute_highest_bid + $increment_amount;

    if ($bid_amount < ($minimum_required_bid - 0.001)) {
        echo json_encode([
            'success' => false, 
            'message' => "Bid must be at least ₱" . number_format($minimum_required_bid, 2)
        ]);
        exit;
    }

    if ($item_data['seller_id'] === $user_id) {
        echo json_encode(['success' => false, 'message' => 'You cannot bid on your own item']);
        exit;
    }

    // 3. Insert the new bid
    // We set status to 'active' because it is a valid live offer.
    // We DO NOT change the status of previous bids (they remain 'active' history until seller decides).
    $stmt = $db->prepare("
        INSERT INTO bidoffer (item_id, bidder_id, bid_amount, bid_status, created_at)
        VALUES (?, ?, ?, 'active', NOW())
    ");
    
    $stmt->bind_param("isd", $item_id, $user_id, $bid_amount);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $stmt->close();

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Bid placed successfully!',
        'bid_amount' => $bid_amount,
        'absolute_highest_bid' => $absolute_highest_bid
    ]);

} catch (Exception $e) {
    if (isset($db)) {
        $db->rollback();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>