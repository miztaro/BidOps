<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

if(!isset($_SESSION['user_id'])){
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

include_once '../config/database.php';
try{
    $database = new Database();
    $conn = $database->getConnection();

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $sql = "SELECT user_id, username, email FROM user WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if($result-> num_rows > 0){
        $user =$result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'user' => [
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'email' => $user['email']
            ]
        ]);
    }else{
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]); 
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching user info: ' . $e->getMessage()
        ]);
        exit;
    }
?>