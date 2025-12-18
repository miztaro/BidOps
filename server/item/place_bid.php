<?php
// server/item/place_bid.php

error_reporting(0);
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include '../config/database.php';

// Check if user is logged in AND ensure the ID is a valid string
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id']) || $_SESSION['user_id'] === '0') {
    echo json_encode(['success' => false, 'message' => 'Please login to place a bid with a valid account.']);
    exit;
}

// Ensure the user ID is treated as a string
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

    // Start transaction
    $db->begin_transaction();

    // Get item details including starting price
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

    // Get the absolute highest bid (including declined bids)
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

    // Calculate minimum required bid
    $increment_amount = $absolute_highest_bid * ($bid_increment_percent / 100);
    $minimum_required_bid = $absolute_highest_bid + $increment_amount;

    // Check if bid is higher than absolute highest bid + increment
    // Note: We use a small epsilon for float comparison to avoid precision errors
    if ($bid_amount < ($minimum_required_bid - 0.001)) {
        echo json_encode([
            'success' => false, 
            'message' => "Bid must be at least ₱" . number_format($minimum_required_bid, 2) . 
                        " (Current highest: ₱" . number_format($absolute_highest_bid, 2) . 
                        " + ₱" . number_format($increment_amount, 2) . " increment)"
        ]);
        exit;
    }

    // Check if user is the seller
    if ($item_data['seller_id'] === $user_id) {
        echo json_encode(['success' => false, 'message' => 'You cannot bid on your own item']);
        exit;
    }

    // Mark previous highest active bids as 'outbid'
    $stmt = $db->prepare("
        UPDATE bidoffer 
        SET bid_status = 'outbid' 
        WHERE item_id = ? AND bid_status = 'active' AND bidder_id != ?
    ");
    $stmt->bind_param("is", $item_id, $user_id);
    $stmt->execute();
    $stmt->close();

    // Insert new bid
    // We do NOT generate a 'bid_id' here. The database handles AUTO_INCREMENT.
    $stmt = $db->prepare("
        INSERT INTO bidoffer (item_id, bidder_id, bid_amount, bid_status, created_at)
        VALUES (?, ?, ?, 'active', NOW())
    ");
    
    // Bind parameters: 
    // i = integer (item_id)
    // s = string  (bidder_id/user_id)
    // d = double  (bid_amount)
    $stmt->bind_param("isd", $item_id, $user_id, $bid_amount);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    // If you need the new ID, you can get it here: $new_bid_id = $stmt->insert_id;
    $stmt->close();

    // --- Notification Logic (Commented out as per request) ---
    // $notification_id = 'NOTIF_' . uniqid();
    // $notification_message = "New bid placed on your item '{$item_data['title']}': ₱" . number_format($bid_amount, 2);
    // $stmt = $db->prepare("INSERT INTO notification (notification_id, user_id, message, created_at, is_read) VALUES (?, ?, ?, NOW(), 0)");
    // $stmt->bind_param("sss", $notification_id, $item_data['seller_id'], $notification_message);
    // $stmt->execute();
    // $stmt->close();

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