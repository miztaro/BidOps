<?php
session_start();
header('Content-Type: application/json');

// 1. Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}

$current_user_id = $_SESSION['user_id'];

// 2. Get POST data (JSON)
$data = json_decode(file_get_contents("php://input"));

if (empty($data->item_id) || empty($data->seller_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing item_id or seller_id.']);
    exit;
}

$item_id = $data->item_id;
$seller_id = $data->seller_id;
$buyer_id = $current_user_id;

// Prevent seller from chatting with themselves
if ($buyer_id == $seller_id) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Cannot start a chat with yourself.']);
    exit;
}

// Include database connection
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

try {

    $query = "
        SELECT chat_id 
        FROM chat 
        WHERE item_id = ? 
          AND ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
        LIMIT 1";

    $stmt = $db->prepare($query);
    // Bind parameters: item_id, buyer_id, seller_id, seller_id, buyer_id
    // This allows for flexible roles in the chat table without bugs.
    $stmt->bind_param("iiiii", $item_id, $buyer_id, $seller_id, $seller_id, $buyer_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Chat found: return existing chat ID
        $chat = $result->fetch_assoc();
        echo json_encode(['success' => true, 'chat_id' => $chat['chat_id'], 'message' => 'Existing chat found.']);
    } else {
        // 4. Chat not found: create a new one
        $insert_query = "
            INSERT INTO chat (item_id, buyer_id, seller_id, created_at) 
            VALUES (?, ?, ?, NOW())";
        
        $insert_stmt = $db->prepare($insert_query);
        // We set buyer_id to the person clicking the button (the current user) and seller_id to the item owner
        $insert_stmt->bind_param("iii", $item_id, $buyer_id, $seller_id);
        
        if ($insert_stmt->execute()) {
            $new_chat_id = $db->insert_id;
            echo json_encode(['success' => true, 'chat_id' => $new_chat_id, 'message' => 'New chat created successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create new chat.']);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$db->close();
?>