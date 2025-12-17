<?php
// server/auth/reactivate-account.php

session_start();

// 2. INCLUDE DATABASE (This imports the CORS Headers we added)
include_once '../config/database.php'; 

// 3. SET TYPE
header("Content-Type: application/json");

try {
    // 4. GET INPUT
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $userId = $data['user_id'] ?? null;

    if (!$userId) {
        throw new Exception('User ID is missing.');
    }

    // 5. CONNECT TO DB 
    $database = new Database();
    $db = $database->getConnection();

    // 6. UPDATE QUERY
    $query = "UPDATE user SET is_deleted = 0 WHERE user_id = ?";
    
    $stmt = $db->prepare($query);
    if (!$stmt) {
        throw new Exception("Database prepare error: " . $db->error);
    }

    $stmt->bind_param("i", $userId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Account reactivated.']);
    } else {
        throw new Exception("Database execution error: " . $stmt->error);
    }

} catch (Exception $e) {
    // Return error as JSON so the JS 'alert' can show it
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
}
?>