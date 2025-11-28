<?php
session_start();
include '../config/database.php';

// TEMPORARY: Assuming you are logged in as 'u1'. 
// In production, change this to: $my_id = $_SESSION['user_id'];
$my_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'u1'; 

// Logic: Get all chats where I am the seller OR the buyer.
// Join with 'user' table to get the OTHER person's name/pic.
// Join with 'item' table to get the item name (optional, but good for context).

$sql = "SELECT 
            c.chat_id,
            c.item_id,
            i.item_name,
            u.user_id as other_user_id,
            u.username,
            u.profile_pic
        FROM chat c
        JOIN user u ON u.user_id = CASE 
            WHEN c.seller_id = ? THEN c.buyer_id 
            ELSE c.seller_id 
        END
        LEFT JOIN item i ON c.item_id = i.item_id
        WHERE c.seller_id = ? OR c.buyer_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $my_id, $my_id, $my_id);
$stmt->execute();
$result = $stmt->get_result();

$chats = [];
while ($row = $result->fetch_assoc()) {
    // Optional: Fetch last message for this chat_id if you have a message table
    // For now, we will just return the chat info
    $row['last_msg'] = "Click to view chat about " . ($row['item_name'] ?? "Item #" . $row['item_id']);
    $chats[] = $row;
}

echo json_encode($chats);
?>