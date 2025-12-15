<?php
// server/auth/get_role.php

session_start();
header('Content-Type: application/json');

// 1. Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    // Return minimum data indicating not logged in
    echo json_encode([
        'is_logged_in' => false,
        'username' => null,
        'user_id' => null
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

include_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // 2. Fetch required details (user_id and username are sufficient for the header)
    // NOTE: If you have a separate 'role' column (e.g., 'admin', 'user'), you should fetch it here.
    $sql = "SELECT user_id, username FROM user WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $user_id); 
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Success: User is logged in, return details
        echo json_encode([
            'is_logged_in' => true,
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'role' => 'user' // Placeholder role, adjust if your DB has a role column
        ]);
    } else {
        // User ID in session but not found in DB (session invalidated)
        session_unset();
        session_destroy();
        echo json_encode([
            'is_logged_in' => false,
            'message' => 'Session invalid.'
        ]); 
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    error_log('Database error in get_role.php: ' . $e->getMessage());
    echo json_encode([
        'is_logged_in' => false,
        'message' => 'Internal server error.'
    ]);
}
?>