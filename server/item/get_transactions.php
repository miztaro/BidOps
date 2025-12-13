<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Added for safety

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

include_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $sql = "
    SELECT 
        tr.transaction_id,
        tr.status,
        tr.completed_at,
        tr.item_id,
        tr.buyer_id,
        tr.seller_id,
        tr.bid_id,
        tr.swap_id,
        i.title AS item_title,
        i.category_type,
        i.description,
        bi.starting_price,
        CASE 
            WHEN tr.bid_id IS NOT NULL THEN bo.bid_amount
            ELSE bi.starting_price 
        END AS amount,
        buyer.username AS buyer_username,
        seller.username AS seller_username,
        GROUP_CONCAT(img.image_path) AS image_paths 
    FROM transactionreceipt tr
    LEFT JOIN item i ON tr.item_id = i.item_id
    LEFT JOIN biditem bi ON i.item_id = bi.item_id
    LEFT JOIN bidoffer bo ON tr.bid_id = bo.bid_id
    LEFT JOIN user buyer ON tr.buyer_id = buyer.user_id
    LEFT JOIN user seller ON tr.seller_id = seller.user_id
    LEFT JOIN itemimage img ON img.item_id = i.item_id
    WHERE 
        -- Winning Bids: User is the buyer AND bid_id IS NOT NULL 
        (tr.buyer_id = ? AND tr.bid_id IS NOT NULL AND tr.status = 'successful') 
        OR 
        -- Successful Swaps: User is buyer or seller AND swap_id IS NOT NULL
        ((tr.buyer_id = ? OR tr.seller_id = ?) AND tr.swap_id IS NOT NULL AND tr.status = 'successful')
        
    GROUP BY tr.transaction_id
    ORDER BY tr.transaction_id DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $user_id, $user_id, $user_id); 
    
    if (!$stmt) {
        throw new Exception("SQL Prepare Error: " . $conn->error);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    $bids = [];
    $swaps = [];

    while ($row = $result->fetch_assoc()) {
        
        $row_item_type = !empty($row['bid_id']) ? 'bid' : (!empty($row['swap_id']) ? 'swap' : 'unknown');

        $image_paths = !empty($row['image_paths']) ? explode(',', $row['image_paths']) : [];
        $row['images'] = $image_paths; 
        $row['main_image'] = $row['images'][0] ?? null;

        if ($row_item_type === 'bid' && $row['status'] === 'successful') {
            $bids[] = [
                'bid_id' => $row['bid_id'],
                'item_id' => $row['item_id'],
                'item_name' => $row['item_title'],
                'category' => $row['category_type'],
                'description' => $row['description'],
                'winning_bid' => $row['amount'],
                'date_won' => $row['completed_at'],
                'vendor' => $row['seller_username'],
                'images' => $row['images'],
                'main_image' => $row['main_image']
            ];
        }
        
        if ($row_item_type === 'swap' && $row['status'] === 'successful') {
             $swaps[] = [
                'swap_id' => $row['swap_id'],
                'item_id' => $row['item_id'],
                'item_name' => $row['item_title'],
                'category' => $row['category_type'],
                'description' => $row['description'],
                'vendor' => $row['seller_username'],
                'completion_date' => $row['completed_at'],
                'images' => $row['images'],
                'main_image' => $row['main_image']
            ];
        }
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'bids' => $bids,
        'swaps' => $swaps
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching transactions: ' . $e->getMessage()
    ]);
    exit;
}
?>