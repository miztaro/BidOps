<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include_once '../config/database.php';

if (!isset($_GET['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Item ID is required']);
    exit;
}

$item_id = $_GET['item_id'];

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get item details with seller information
    $stmt = $db->prepare("
        SELECT 
            i.*,
            u.user_id as seller_id,
            u.username as seller_name,
            u.email as seller_email,
            bi.starting_price,
            bi.start_date,
            bi.end_date,
            (SELECT COUNT(*) FROM BIDOFFER WHERE item_id = i.item_id AND bid_status IN ('active', 'pending')) as total_bids,
            (SELECT MAX(bid_amount) FROM BIDOFFER WHERE item_id = i.item_id AND bid_status = 'active') as current_highest_bid
        FROM ITEM i
        LEFT JOIN USER u ON i.seller_id = u.user_id
        LEFT JOIN BIDITEM bi ON i.item_id = bi.item_id
        WHERE i.item_id = :item_id
    ");
    
    $stmt->execute(['item_id' => $item_id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit;
    }
    
    // Get all images for this item
    $stmt = $db->prepare("SELECT * FROM ITEMIMAGE WHERE item_id = :item_id ORDER BY image_id");
    $stmt->execute(['item_id' => $item_id]);
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get bidding history if it's a bid item
    $bidding_history = [];
    if ($item['item_type'] === 'bid') {
        $stmt = $db->prepare("
            SELECT 
                bo.*,
                u.username as bidder_name,
                u.email as bidder_email
            FROM BIDOFFER bo
            LEFT JOIN USER u ON bo.bidder_id = u.user_id
            WHERE bo.item_id = :item_id
            ORDER BY bo.bid_amount DESC, bo.created_at DESC
        ");
        $stmt->execute(['item_id' => $item_id]);
        $bidding_history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate time difference for bidding history
        foreach ($bidding_history as &$bid) {
            $bid['time_ago'] = getTimeAgo($bid['created_at']);
        }
    }
    
    echo json_encode([
        'success' => true,
        'item' => $item,
        'images' => $images,
        'bidding_history' => $bidding_history
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

function getTimeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    
    if ($diff->d > 0) {
        return $diff->d . ' day' . ($diff->d > 1 ? 's' : '') . ' ago';
    } elseif ($diff->h > 0) {
        return $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
    } elseif ($diff->i > 0) {
        return $diff->i . ' minute' . ($diff->i > 1 ? 's' : '') . ' ago';
    } else {
        return 'Just now';
    }
}
?>