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

try {
    $database = new Database();
    $conn = $database->getConnection();

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

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
        buyer.username AS buyer_username,
        tr.seller_id,
        seller.username AS seller_username,
        CASE
            WHEN tr.buyer_id = ? THEN 'buyer'
            WHEN tr.seller_id = ? THEN 'seller'
        END AS user_role
    FROM userrating ur
    INNER JOIN transactionreceipt tr 
        ON ur.transaction_id = tr.transaction_id
    LEFT JOIN item i 
        ON tr.item_id = i.item_id
    LEFT JOIN user rater 
        ON ur.rater_id = rater.user_id
    LEFT JOIN user buyer
        ON tr.buyer_id = buyer.user_id
    LEFT JOIN user seller
        ON tr.seller_id = seller.user_id
    WHERE 
        (tr.buyer_id = ? AND ur.rater_id = tr.seller_id)
        OR
        (tr.seller_id = ? AND ur.rater_id = tr.buyer_id)
    ORDER BY tr.completed_at DESC, ur.rating_id DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $user_id, $user_id, $user_id, $user_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $ratings = [];

    while ($row = $result->fetch_assoc()) {
        $ratings[] = $row;
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'ratings' => $ratings
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching ratings: ' . $e->getMessage()
    ]);
    exit;
}