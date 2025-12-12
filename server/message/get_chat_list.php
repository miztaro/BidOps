<?php
// server/message/get_chat_list.php

// 1. MUST BE FIRST: Start session and buffering, using @ to silence warnings
@session_start();
ob_start(); 

// 2. AGGRESSIVE ERROR SUPPRESSION (stricter handling)
error_reporting(E_ALL); 
ini_set('display_errors', 0); // Hide display, but log errors silently

// 3. Set Header, using @ to silence "headers already sent" warning
@header('Content-Type: application/json');

// --- Check Login ---
$current_user_id = $_SESSION['user_id'] ?? null;

if (empty($current_user_id)) {
ob_end_clean(); 
http_response_code(401);
echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.', 'chats' => []]);
exit;
}

include_once '../config/database.php'; 
$database = new Database();
$db = $database->getConnection();

try {
    // SIMPLIFIED QUERY (using the confirmed 'i.title' column)
    $sql = "
SELECT 
    c.chat_id,
    c.item_id,
    i.title AS item_name, /* FIXED: Using i.title and aliasing it */
    
    CASE WHEN c.seller_id = ? THEN c.buyer_id ELSE c.seller_id END AS recipient_id,
    u.username AS recipient_name
    
FROM chat c
JOIN user u ON u.user_id = CASE WHEN c.seller_id = ? THEN c.buyer_id ELSE c.seller_id END
LEFT JOIN item i ON c.item_id = i.item_id
WHERE c.seller_id = ? OR c.buyer_id = ?
ORDER BY c.chat_id DESC";

$stmt = $db->prepare($sql);
$stmt->bind_param("ssss", $current_user_id, $current_user_id, $current_user_id, $current_user_id); 
$stmt->execute();
$result = $stmt->get_result();

$chats = [];
while ($row = $result->fetch_assoc()) {
$row['last_message_text'] = $row['item_name'] ? "Regarding: " . $row['item_name'] : 'Start of conversation...'; 
$row['last_message_time'] = null; // Placeholder for time
$chats[] = $row;
}
ob_end_clean(); // CLEAN BUFFER before output
echo json_encode(['success' => true, 'chats' => $chats, 'message' => 'Chat list loaded.']);

} catch (Exception $e) {
ob_end_clean(); // CLEAN BUFFER on error
http_response_code(500);
echo json_encode(['success' => false, 'message' => 'Server error loading chats: ' . $e->getMessage(), 'chats' => []]);
}

$db->close();

