<?php
session_start();
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

    /* -----------------------------
        FETCH ITEM DETAILS
    ------------------------------*/

    $query = "
        SELECT 
            i.*,
            u.user_id as seller_id,
            u.username as seller_name,
            u.email as seller_email,
            bi.starting_price,
            bi.start_date,
            bi.end_date,
            bi.bid_increment_percent,  
            (SELECT COUNT(*) FROM bidoffer WHERE item_id = i.item_id AND bid_status = 'active') as total_bids,
            (SELECT MAX(bid_amount) FROM bidoffer WHERE item_id = i.item_id AND bid_status = 'active') as current_highest_bid
        FROM item i
        LEFT JOIN user u ON i.seller_id = u.user_id
        LEFT JOIN biditem bi ON i.item_id = bi.item_id
        WHERE i.item_id = ?
    ";

    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $item = $result->fetch_assoc();

    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit;
    }

    /* -----------------------------
        FETCH IMAGES - *** FIXED COLUMN SELECTION ***
    ------------------------------*/

    // CHANGE: Explicitly select 'image_path' to ensure consistency with client-side JavaScript
    $stmt = $db->prepare("SELECT image_path FROM itemimage WHERE item_id = ? ORDER BY image_id");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    /* -----------------------------
        FETCH BIDDING HISTORY
        (WITH BIDDER NAMES - For Seller View)
    ------------------------------*/

    $bidding_history = [];

    if ($item['item_type'] === 'bid') {
        $stmt = $db->prepare("
             SELECT 
             bo.bid_id,
             bo.bid_amount,
             bo.bid_status,
             bo.created_at,
             u.user_id,
             u.username,
             u.email
           FROM bidoffer bo
           INNER JOIN user u ON bo.bidder_id = u.user_id
           WHERE bo.item_id = ?
           ORDER BY bo.bid_amount DESC, bo.created_at DESC
    ");


        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $bidding_history = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Add time_ago for each bid
        foreach ($bidding_history as &$bid) {
            $bid['time_ago'] = getTimeAgo($bid['created_at']);
        }
    }

    /* -----------------------------
        CALCULATE TIME REMAINING
    ------------------------------*/

    $time_remaining = null;
    if ($item['item_type'] === 'bid' && $item['end_date']) {
        $now = new DateTime();
        $end = new DateTime($item['end_date']);
        
        if ($end > $now) {
            $diff = $now->diff($end);
            $time_remaining = [
                'days' => $diff->d,
                'hours' => $diff->h,
                'minutes' => $diff->i,
                'seconds' => $diff->s,
                'total_seconds' => ($diff->days * 86400) + ($diff->h * 3600) + ($diff->i * 60) + $diff->s,
                'is_active' => true
            ];
        } else {
            $time_remaining = [
                'days' => 0,
                'hours' => 0,
                'minutes' => 0,
                'seconds' => 0,
                'total_seconds' => 0,
                'is_active' => false
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'item' => $item,
        'images' => $images,
        'bidding_history' => $bidding_history,
        'time_remaining' => $time_remaining
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

/* -----------------------------
    TIME AGO FUNCTION
------------------------------*/

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