<?php
// server/message/send_message.php
error_reporting(0);
session_start();
header('Content-Type: application/json');

// Check login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$sender_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"), true);

// Changed 'content' to 'message' to reflect the correct column in the database
$chat_id = $data['chat_id'] ?? null;
$message_content = $data['content'] ?? null; // Use a different variable name here

if (!$chat_id || !$message_content) {
    echo json_encode(['success' => false, 'message' => 'Missing chat ID or content']);
    exit;
}

include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    // FINAL FIX: Updated column names to match the database:
    // sender_id -> user_id
    // content -> message
    // created_at -> sent_at
    $query = "INSERT INTO message (chat_id, user_id, message, sent_at) VALUES (?, ?, ?, NOW())";
    $stmt = $db->prepare($query);
    
    // Assuming chat_id is INT (i), user_id is STRING (s), message is STRING (s)
    $stmt->bind_param("iss", $chat_id, $sender_id, $message_content);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Message sent.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to insert message.']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$db->close();
?>