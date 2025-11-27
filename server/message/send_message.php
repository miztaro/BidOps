<?php
session_start();
include 'database.php';

$sender_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'u1';
$chat_id = $_POST['chat_id'];
$message = $_POST['message'];
$image_path = null;

// Handle Image Upload
if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
    $target_dir = "../uploads/";
    if (!is_dir($target_dir)) mkdir($target_dir, 0777, true);
    
    $filename = time() . "_" . basename($_FILES["image"]["name"]);
    $target_file = $target_dir . $filename;
    
    if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
        $image_path = "uploads/" . $filename;
    }
}

if (!empty($message) || $image_path) {
   
    $stmt = $conn->prepare("INSERT INTO message (chat_id, sender_id, content, image_path) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $chat_id, $sender_id, $message, $image_path);
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "error" => $stmt->error]);
    }
}
?>