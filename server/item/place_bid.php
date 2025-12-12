<?php
// server/item/place_bid.php

error_reporting(0); // Suppression of errors (already discussed, keep this)
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include '../config/database.php';

// Check if user is logged in AND ensure the ID is a valid string (not '0' or empty)
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id']) || $_SESSION['user_id'] === '0') {
    echo json_encode(['success' => false, 'message' => 'Please login to place a bid with a valid account.']);
    exit;
}

// Ensure the user ID is treated as a string, matching your database column type (e.g., 'u11')
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

    // ... (rest of the validation and logic) ...

    // Start transaction
    $db->begin_transaction();

    // Mark previous highest bids as 'outbid'
    $stmt = $db->prepare("
        UPDATE bidoffer 
        SET bid_status = 'outbid' 
        WHERE item_id = ? AND bid_status = 'active'
    ");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();

    // Insert new bid
    $bid_id = 'BID_' . uniqid();
    $stmt = $db->prepare("
        INSERT INTO bidoffer (bid_id, item_id, bidder_id, bid_amount, bid_status, created_at)
        VALUES (?, ?, ?, ?, 'active', NOW())
    ");
    // CRITICAL: Ensure the bind parameter for bidder_id uses 's' for string (VARCHAR/user_id format)
    // Assuming bidder_id (like 'u11') is a string, and item_id is an integer 'i'
    $stmt->bind_param("sisd", $bid_id, $item_id, $user_id, $bid_amount); 
    //            Parameters:   s    i    s     d

    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    // ... (rest of the commit and notification logic) ...

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Bid placed successfully!',
        'bid_amount' => $bid_amount
    ]);

} catch (Exception $e) {
    $db->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>