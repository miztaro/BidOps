<?php
// server/message/get_messages.php

error_reporting(0); // FIX: Prevent HTML/JSON corruption
session_start();
header('Content-Type: application/json');

$current_user_id = $_SESSION['user_id'] ?? null;

if (empty($current_user_id)) {
http_response_code(401);
echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.', 'messages' => []]);
exit;
}

$chat_id = $_GET['chat_id'] ?? null;

if (empty($chat_id) || !is_numeric($chat_id)) {
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid or missing chat ID.', 'messages' => []]);
exit;
}

include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
// SECURITY CHECK: Ensure the current user is part of this chat
$check_query = "SELECT chat_id FROM chat WHERE chat_id = ? AND (seller_id = ? OR buyer_id = ?)";
$check_stmt = $db->prepare($check_query);
// Bind parameters: i (chat_id), s (seller_id), s (buyer_id)
$check_stmt->bind_param("iss", $chat_id, $current_user_id, $current_user_id);
$check_stmt->execute();

if ($check_stmt->get_result()->num_rows === 0) {
http_response_code(403);
echo json_encode(['success' => false, 'message' => 'Access denied to this chat.', 'messages' => []]);
exit;
}

// Fetch all messages for the validated chat - **FINAL COLUMN FIX: sent_at**
$message_query = "SELECT message_id, chat_id, user_id, message, sent_at FROM message WHERE chat_id = ? ORDER BY sent_at ASC";
$stmt = $db->prepare($message_query);
$stmt->bind_param("i", $chat_id);
$stmt->execute();
$messages = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode([
'success' => true, 
'messages' => $messages,
'current_user_id' => $current_user_id // Used by JS to determine sent/received
]);

} catch (Exception $e) {
http_response_code(500);
echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage(), 'messages' => []]);
}

$db->close();
