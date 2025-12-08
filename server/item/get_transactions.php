<?php
header('Content-Type: application/json');

$host = 'localhost';
$user = 'root';
$pass = '';        
$db   = 'bidops';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

/*
  Show all transactions for now. Complete this when user login is implemented!!!
  
  Join:
  - transactionreceipt (main transaction data)
  - item (item details)
  - biditem (starting price for bids)
  - user (buyer/seller names)
*/

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
    END AS partner_name
FROM transactionreceipt tr
LEFT JOIN item i ON tr.item_id = i.item_id
LEFT JOIN biditem bi ON i.item_id = bi.item_id
LEFT JOIN bidoffer bo ON tr.bid_id = bo.bid_id
LEFT JOIN user buyer ON tr.buyer_id = buyer.user_id
LEFT JOIN user seller ON tr.seller_id = seller.user_id
ORDER BY tr.transaction_id DESC
";

$result = $conn->query($sql);

$transactions = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'transactions' => $transactions
]);

$conn->close();
?>
