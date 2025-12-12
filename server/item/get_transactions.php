<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

include_once '../config/database.php';

/*
  Show all transactions for now. Complete this when user login is implemented!!!
  
  Join:
  - transactionreceipt (main transaction data)
  - item (item details)
  - biditem (starting price for bids)
  - user (buyer/seller names)
*/

try {
    $database = new Database();
    $conn = $database->getConnection();

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Fetch only transactions where logged-in user is buyer or seller
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
        i.item_type,
        i.category_type,
        i.description,
        bi.starting_price,
        CASE 
            WHEN tr.bid_id IS NOT NULL THEN bo.bid_amount
            ELSE bi.starting_price 
        END AS amount,
        buyer.username AS buyer_username,
        seller.username AS seller_username,
        img.image_path
    FROM transactionreceipt tr
    LEFT JOIN item i ON tr.item_id = i.item_id
    LEFT JOIN biditem bi ON i.item_id = bi.item_id
    LEFT JOIN bidoffer bo ON tr.bid_id = bo.bid_id
    LEFT JOIN user buyer ON tr.buyer_id = buyer.user_id
    LEFT JOIN user seller ON tr.seller_id = seller.user_id
    LEFT JOIN itemimage img ON img.item_id = i.item_id
    WHERE tr.buyer_id = ? OR tr.seller_id = ?
    ORDER BY tr.transaction_id DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $transactions = [];
    $bids = [];
    $swaps = [];
    $images = [];

    while ($row = $result->fetch_assoc()) {
        if (!empty($row['image_path'])) {
            $images[$row['item_id']][] = basename($row['image_path']);
        }

        $row['images'] = $images[$row['item_id']] ?? [];
        $row['main_image'] = $images[$row['item_id']][0] ?? null;

        $transactions[] = $row;

        if (!empty($row['bid_id']) && $row['status'] === 'successful') {
            $row['bidItem'] = [
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
            $bids[] = $row;
        }

        if (!empty($row['swap_id']) && $row['status'] === 'successful') {
            $row['swappedItem'] = [
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
            $swaps[] = $row;
        }
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'bids' => $bids,
        'swaps' => $swaps,
        'transactions' => $transactions
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
