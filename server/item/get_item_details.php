<?php
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

    $stmt = $db->prepare("
        SELECT 
            i.*,
            u.user_id as seller_id,
            u.username as seller_name,  -- FIXED: username instead of name
            u.email as seller_email,
            bi.starting_price,
            bi.start_date,
            bi.end_date,
            (SELECT COUNT(*) FROM bidoffer WHERE item_id = i.item_id AND bid_status = 'active') as total_bids,
            (SELECT MAX(bid_amount) FROM bidoffer WHERE item_id = i.item_id AND bid_status = 'active') as current_highest_bid
        FROM item i
        LEFT JOIN user u ON i.seller_id = u.user_id  -- FIXED: user table (lowercase)
        LEFT JOIN biditem bi ON i.item_id = bi.item_id
        WHERE i.item_id = :item_id
    ");
    
    $stmt->execute(['item_id' => $item_id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit;
    }
    
    $stmt = $db->prepare("SELECT * FROM itemimage WHERE item_id = :item_id ORDER BY image_id");
    $stmt->execute(['item_id' => $item_id]);
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $bidding_history = [];
    if ($item['item_type'] === 'bid') {
        $stmt = $db->prepare("
            SELECT 
                bo.*,
                u.username as bidder_name,  -- FIXED: username instead of name
                u.email as bidder_email
            FROM bidoffer bo
            LEFT JOIN user u ON bo.bidder_id = u.user_id  -- FIXED: user table (lowercase)
            WHERE bo.item_id = :item_id
            ORDER BY bo.bid_amount DESC, bo.created_at DESC
        ");
        $stmt->execute(['item_id' => $item_id]);
        $bidding_history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    foreach ($bidding_history as &$bid) {
        $bid['time_ago'] = getTimeAgo($bid['created_at']);
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