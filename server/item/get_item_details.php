<?php

if (session_status() == PHP_SESSION_NONE) {
    if (!headers_sent()) {
        session_start();
    }
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function getTimeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    
    if ($diff->y > 0) {
        return $diff->y . ' year' . ($diff->y > 1 ? 's' : '') . ' ago';
    } elseif ($diff->m > 0) {
        return $diff->m . ' month' . ($diff->m > 1 ? 's' : '') . ' ago';
    } elseif ($diff->d > 0) {
        return $diff->d . ' day' . ($diff->d > 1 ? 's' : '') . ' ago';
    } elseif ($diff->h > 0) {
        return $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
    } elseif ($diff->i > 0) {
        return $diff->i . ' minute' . ($diff->i > 1 ? 's' : '') . ' ago';
    } else {
        return 'Just now';
    }
}

$database_path = __DIR__ . '/../config/database.php';
if (!file_exists($database_path)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database configuration file not found: ' . $database_path]);
    exit;
}
require_once $database_path; 

$current_user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : '0';

if (!isset($_GET['item_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Item ID is required']);
    exit;
}

$item_id = $_GET['item_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

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
            (SELECT MAX(bid_amount) FROM bidoffer WHERE item_id = i.item_id) as current_highest_bid
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
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit;
    }

    // Get images
    $stmt = $db->prepare("SELECT image_path FROM itemimage WHERE item_id = ? ORDER BY image_id");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $raw_images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    $base_path = '../server/item/uploads/'; 
    $images = array_map(function($img) use ($base_path) {
        $filename = basename($img['image_path']);
        return [
            'image_path' => $base_path . $filename
        ];
    }, $raw_images);

    $bidding_history = [];

    if ($item['item_type'] === 'bid') {
        $stmt = $db->prepare("
            SELECT 
                bo.bid_amount,
                bo.created_at,
                bo.bidder_id,
                bo.bid_status,
                bo.bid_id
            FROM bidoffer bo
            WHERE bo.item_id = ?
            ORDER BY bo.bid_amount DESC, bo.created_at DESC
        ");
        
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $raw_history = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Fetch bidder names 
        $bidder_ids = array_column($raw_history, 'bidder_id');
        $user_names = [];

        if (!empty($bidder_ids)) {
            $in = str_repeat('?,', count($bidder_ids) - 1) . '?';
            
            $stmt_users = $db->prepare("SELECT user_id, username FROM user WHERE user_id IN ($in)");
            $stmt_users->bind_param(str_repeat('s', count($bidder_ids)), ...$bidder_ids);
            $stmt_users->execute();
            $user_results = $stmt_users->get_result()->fetch_all(MYSQLI_ASSOC);
            $user_names = array_column($user_results, 'username', 'user_id');
        }

        if (!empty($raw_history)) {
            $counter = 1;
            foreach ($raw_history as $bid) {
                
                $bidder_name = $user_names[$bid['bidder_id']] ?? "Bidder #" . $counter;
                
                if (strval($bid['bidder_id']) !== $current_user_id) { 
                    $bidder_name = "Anonymous Bidder"; 
                }

                $bidding_history[] = [
                    "bidder_name" => $bidder_name,
                    "bid_amount" => $bid["bid_amount"],
                    "created_at" => $bid["created_at"],
                    "time_ago" => getTimeAgo($bid["created_at"]),
                    "bid_status" => $bid["bid_status"],
                    "bid_id" => $bid["bid_id"]
                ];
                $counter++;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'current_user_id' => $current_user_id,
        'item' => $item,
        'images' => $images,
        'bidding_history' => $bidding_history
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection/query error: ' . $e->getMessage()
    ]);
}

?>