<?php
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    $allowed_origins = ['http://localhost', 'http://localhost:8000', 'http://127.0.0.1:5500'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: http://localhost");
    }
    
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    http_response_code(200);
    exit();
}

$allowed_origins = ['http://localhost', 'http://localhost:8000', 'http://127.0.0.1:5500'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost");
}

header('Content-Type: application/json');
header("Access-Control-Allow-Credentials: true");

include_once '../config/database.php';

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
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if item exists and is active
    $stmt = $db->prepare("
        SELECT i.*, bi.starting_price, bi.end_date 
        FROM ITEM i
        LEFT JOIN BIDITEM bi ON i.item_id = bi.item_id
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
    $stmt = $db->prepare("
        SELECT MAX(bid_amount) as highest_bid 
        FROM BIDOFFER 
        WHERE item_id = :item_id AND bid_status IN ('active', 'pending')
    ");
    $stmt->execute(['item_id' => $item_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $current_highest = $result['highest_bid'] ?? $item['starting_price'];
    
    // Validate bid amount (must be higher than current highest)
    $minimum_bid = $current_highest + 5.00; // Minimum increment of ₱5.00
    
    if ($bid_amount < $minimum_bid) {
        echo json_encode([
            'success' => false, 
            'message' => "Bid must be at least ₱" . number_format($minimum_bid, 2)
        ]);
        exit;
    }
    
    // Start transaction
    $db->beginTransaction();
    
    // Mark previous highest bids as 'lost'
    $stmt = $db->prepare("
        UPDATE BIDOFFER 
        SET bid_status = 'lost' 
        WHERE item_id = :item_id AND bid_status = 'active'
    ");
    $stmt->execute(['item_id' => $item_id]);
    
    // Insert new bid
    $stmt = $db->prepare("
        INSERT INTO BIDOFFER (item_id, bidder_id, bid_amount, bid_status, created_at)
        VALUES (:item_id, :bidder_id, :bid_amount, 'active', NOW())
    ");
    
    $stmt->execute([
        'item_id' => $item_id,
        'bidder_id' => $user_id,
        'bid_amount' => $bid_amount
    ]);
    
    // Get previous highest bidder for notification
    $stmt = $db->prepare("
        SELECT DISTINCT bidder_id 
        FROM BIDOFFER 
        WHERE item_id = :item_id AND bid_status = 'lost' AND bidder_id != :user_id
        ORDER BY created_at DESC LIMIT 1
    ");
    $stmt->execute(['item_id' => $item_id, 'user_id' => $user_id]);
    $previous_bidder = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($previous_bidder) {
        $stmt = $db->prepare("
            INSERT INTO NOTIFICATION (user_id, type, message, created_at)
            VALUES (:user_id, 'bid_won', :message, NOW())
        ");
        $stmt->execute([
            'user_id' => $previous_bidder['bidder_id'],
            'message' => "You've been outbid on {$item['title']}"
        ]);
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Bid placed successfully!',
        'bid_amount' => $bid_amount
    ]);
    
} catch (PDOException $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>