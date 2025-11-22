<?php
// server/item/place_bid.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include '../config/db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login to place a bid']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

$item_id = $data['item_id'] ?? null;
$bid_amount = $data['bid_amount'] ?? null;
$user_id = $_SESSION['user_id'];

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
    // Check if item exists and is active
    $stmt = $pdo->prepare("
        SELECT i.*, bi.starting_price, bi.end_date 
        FROM item i
        LEFT JOIN biditem bi ON i.item_id = bi.item_id
        WHERE i.item_id = :item_id AND i.status = 'active'
    ");
    $stmt->execute(['item_id' => $item_id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found or not active']);
        exit;
    }
    
    // Check if auction has ended
    if (strtotime($item['end_date']) < time()) {
        echo json_encode(['success' => false, 'message' => 'Auction has ended']);
        exit;
    }
    
    // Check if user is trying to bid on their own item
    if ($item['seller_id'] == $user_id) {
        echo json_encode(['success' => false, 'message' => 'You cannot bid on your own item']);
        exit;
    }
    
    // Get current highest bid
    $stmt = $pdo->prepare("
        SELECT MAX(bid_amount) as highest_bid 
        FROM bidoffer 
        WHERE item_id = :item_id AND bid_status = 'active'
    ");
    $stmt->execute(['item_id' => $item_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $current_highest = $result['highest_bid'] ?? $item['starting_price'];
    
    // Calculate minimum required bid
    $increment_percent = $item['bid_increment_percent'];
    $increment_amount = $current_highest * ($increment_percent / 100);
    $minimum_bid = $current_highest + $increment_amount;

    // Validate bid amount (must be higher than current highest)
    if ($bid_amount < $minimum_bid) {
        echo json_encode([
            'success' => false, 
            'message' => "Bid must be at least ₱" . number_format($minimum_bid, 2)
        ]);
        exit;
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Mark previous highest bids as 'outbid'
    $stmt = $pdo->prepare("
        UPDATE bidoffer 
        SET bid_status = 'outbid' 
        WHERE item_id = :item_id AND bid_status = 'active'
    ");
    $stmt->execute(['item_id' => $item_id]);
    
    // Insert new bid
    $bid_id = 'BID_' . uniqid();
    $stmt = $pdo->prepare("
        INSERT INTO bidoffer (bid_id, item_id, bidder_id, bid_amount, bid_status, created_at)
        VALUES (:bid_id, :item_id, :bidder_id, :bid_amount, 'active', NOW())
    ");
    
    $stmt->execute([
        'bid_id' => $bid_id,
        'item_id' => $item_id,
        'bidder_id' => $user_id,
        'bid_amount' => $bid_amount
    ]);
    
    // Create notification for previous highest bidder
    $stmt = $pdo->prepare("
        SELECT DISTINCT bidder_id 
        FROM bidoffer 
        WHERE item_id = :item_id AND bid_status = 'outbid' AND bidder_id != :user_id
        ORDER BY created_at DESC LIMIT 1
    ");
    $stmt->execute(['item_id' => $item_id, 'user_id' => $user_id]);
    $previous_bidder = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($previous_bidder) {
        $notif_id = 'NOTIF_' . uniqid();
        $stmt = $pdo->prepare("
            INSERT INTO notification (notif_id, user_id, type, message, created_at)
            VALUES (:notif_id, :user_id, 'outbid', :message, NOW())
        ");
        $stmt->execute([
            'notif_id' => $notif_id,
            'user_id' => $previous_bidder['bidder_id'],
            'message' => "You've been outbid on {$item['title']}"
        ]);
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Bid placed successfully!',
        'bid_amount' => $bid_amount
    ]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>