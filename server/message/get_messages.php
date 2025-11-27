<?php
session_start();
include 'database.php';

$my_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'u1';
$chat_id = $_GET['chat_id'];


$sql = "SELECT * FROM message 
        WHERE chat_id = ? 
        ORDER BY created_at ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $chat_id); /
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    // Check if the message was sent by 'me'
    $row['is_me'] = ($row['user_id'] == $my_id);
    $messages[] = $row;
}

echo json_encode($messages);
?>