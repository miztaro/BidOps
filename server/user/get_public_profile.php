<?php
// server/user/get_public_profile.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

if (!isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID required"]);
    exit();
}

$user_id = $_GET['user_id'];

$database = new Database();
$db = $database->getConnection();

try {
    // Select public info only (no password)
    $query = "SELECT user_id, username, email, is_banned FROM user WHERE user_id = ?";
    $stmt = $db->prepare($query);
    $stmt->bind_param("s", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Helper: Check if they have a profile pic (if you add that feature later)
        // $user['profile_pic'] = 'uploads/users/' . $user_id . '.jpg'; 
        
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>