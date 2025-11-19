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
            u.username as seller_name,
            u.email as seller_email,
            bi.starting_price,
            bi.start_date,
            bi.end_date,
            (SELECT COUNT(*) FROM bidoffer WHERE item_id = i.item_id AND bid_status = 'active') as total_bids,
            (SELECT MAX(bid_amount) FROM bidoffer WHERE item_id = i.item_id AND bid_status = 'active') as current_highest_bid
        FROM item i
        LEFT JOIN user u ON i.seller_id = u.user_id
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

    
    // ANONYMOUS BIDDING HISTORY
    
    $bidding_history = [];
    if ($item['item_type'] === 'bid') {
        $stmt = $db->prepare("
            SELECT 
                bo.bid_amount,
                bo.created_at
            FROM bidoffer bo
            WHERE bo.item_id = :item_id
            ORDER BY bo.bid_amount DESC, bo.created_at DESC
        ");
        $stmt->execute(['item_id' => $item_id]);
        $raw_history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        
        $counter = 1;
        foreach ($raw_history as $bid) {
            $bidding_history[] = [
                "bidder" => "Bidder #" . $counter,   
                "bid_amount" => $bid["bid_amount"],
                "created_at" => $bid["created_at"],
                "time_ago" => getTimeAgo($bid["created_at"])
            ];
            $counter++;
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
