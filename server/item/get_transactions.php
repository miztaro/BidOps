<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

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
        CASE 
            WHEN tr.buyer_id = 'u1' THEN seller.username
            ELSE buyer.username 
        END AS partner_name,
        partner.user_id AS partner_id,
        ur.rating_id,
        ur.rating AS existing_rating,
        ur.comment AS existing_comment,
        CASE 
            WHEN ur.rating_id IS NOT NULL THEN 'edit'
            ELSE 'new'
        END AS rating_action
    FROM transactionreceipt tr
    LEFT JOIN item i ON tr.item_id = i.item_id
    LEFT JOIN biditem bi ON i.item_id = bi.item_id
    LEFT JOIN bidoffer bo ON tr.bid_id = bo.bid_id
    LEFT JOIN user buyer ON tr.buyer_id = buyer.user_id
    LEFT JOIN user seller ON tr.seller_id = seller.user_id
    LEFT JOIN user partner ON (
        (tr.buyer_id = 'u1' AND tr.seller_id = partner.user_id) OR 
        (tr.seller_id = 'u1' AND tr.buyer_id = partner.user_id)
    )
    LEFT JOIN userrating ur ON tr.transaction_id = ur.transaction_id AND ur.rater_id = 'u1'
    ORDER BY tr.transaction_id DESC
    ";

    $result = $conn->query($sql);

    $transactions = [];
    $bids = [];
    $swaps = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
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
                    'vendor' => $row['seller_username']
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
                    'completion_date' => $row['completed_at']
                ];
                $swaps[] = $row;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'bids' => $bids,
        'swaps' => $swaps,
        'transactions' => $transactions
    ]);

    $conn->close();
}catch(Exception $e){
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}
?>
