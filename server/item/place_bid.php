<?php
// server/item/place_bid.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include '../config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login to place a bid']);
    exit;
}

$user_id = $_SESSION['user_id'];

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

    // Check if item exists and is active
    $stmt = $db->prepare("
        SELECT i.*, bi.starting_price, bi.end_date 
        FROM item i
        LEFT JOIN biditem bi ON i.item_id = bi.item_id
        WHERE i.item_id = ? AND i.status = 'active'
    ");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $item = $result->fetch_assoc();
    
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
    $stmt = $db->prepare("
        SELECT MAX(bid_amount) as highest_bid 
        FROM bidoffer 
        WHERE item_id = ? AND bid_status = 'active'
    ");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $current_highest = $row['highest_bid'] ?? $item['starting_price'];

    // Validate bid amount
    $minimum_bid = $current_highest + 5.00; // Minimum increment
    if ($bid_amount < $minimum_bid) {
        echo json_encode([
            'success' => false, 
            'message' => "Bid must be at least ₱" . number_format($minimum_bid, 2)
        ]);
        exit;
    }

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
    $stmt->bind_param("siid", $bid_id, $item_id, $user_id, $bid_amount);
    $stmt->execute();

    // Create notification for previous highest bidder
    $stmt = $db->prepare("
        SELECT DISTINCT bidder_id 
        FROM bidoffer 
        WHERE item_id = ? AND bid_status = 'outbid' AND bidder_id != ?
        ORDER BY created_at DESC LIMIT 1
    ");
    $stmt->bind_param("ii", $item_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $previous_bidder = $result->fetch_assoc();

    if ($previous_bidder) {
        $notif_id = 'NOTIF_' . uniqid();
        $message = "You've been outbid on {$item['title']}";
        $stmt = $db->prepare("
            INSERT INTO notification (notif_id, user_id, type, message, created_at)
            VALUES (?, ?, 'outbid', ?, NOW())
        ");
        $stmt->bind_param("sis", $notif_id, $previous_bidder['bidder_id'], $message);
        $stmt->execute();
    }

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
