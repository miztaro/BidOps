<?php

error_reporting(E_ALL & ~E_NOTICE); 
ini_set('display_errors', 0);

if (session_status() == PHP_SESSION_NONE) {
    if (!headers_sent()) {
        session_start();
    }
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$database_path = __DIR__ . '/../config/database.php';
if (!file_exists($database_path)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database configuration file not found: ' . $database_path]);
    exit;
}
require_once $database_path; 


// Use the globally available current_user_id variable for comparison
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
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM itemimage WHERE item_id = ? ORDER BY image_id");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $bidding_history = [];

    if ($item['item_type'] === 'bid') {
        $stmt = $db->prepare("
            SELECT 
                bo.bid_amount,
                bo.created_at,
                bo.bidder_id
            FROM bidoffer bo
            WHERE bo.item_id = ? AND bo.bid_status = 'active'
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

        // --- START OF ANONYMITY LOGIC ---
        
        if (!empty($raw_history)) {
            $counter = 1;
            foreach ($raw_history as $bid) {
                
                // Get the real name (or fallback)
                $bidder_name = $user_names[$bid['bidder_id']] ?? "Bidder #" . $counter;
                
                // ANONYMITY CHECK: Compare the bidder's ID to the current user's ID
                // Note: The comparison uses the $current_user_id defined at the top of the script
                if ($bid['bidder_id'] !== $current_user_id) {
                    $bidder_name = "Anonymous Bidder"; 
                }

                $bidding_history[] = [
                    "bidder_name" => $bidder_name,
                    "bid_amount" => $bid["bid_amount"],
                    "created_at" => $bid["created_at"],
                    "time_ago" => getTimeAgo($bid["created_at"])
                ];
                $counter++;
            }
        }
        // --- END OF ANONYMITY LOGIC ---
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