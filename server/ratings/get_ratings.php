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
  Show all ratings for now. Complete this when user login in implemented!!!

  Join:
  - userrating (who rated, rating, comment, transaction_id)
  - transactionreceipt (to know item and buyer/seller)
  - item (item title)
  - user (rater username)
*/

$sql = "
SELECT 
    ur.rating_id,
    ur.rating,
    ur.comment,
    ur.rater_id,
    rater.username AS rater_username,
    ur.transaction_id,
    tr.status AS transaction_status,
    tr.completed_at,
    tr.item_id,
    i.title AS item_title,
    tr.buyer_id,
    tr.seller_id
FROM userrating ur
LEFT JOIN transactionreceipt tr ON ur.transaction_id = tr.transaction_id
LEFT JOIN item i ON tr.item_id = i.item_id
LEFT JOIN user rater ON ur.rater_id = rater.user_id
ORDER BY ur.rating_id DESC
";

$result = $conn->query($sql);

$ratings = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $ratings[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'ratings' => $ratings
]);

$conn->close();
