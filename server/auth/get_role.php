<?php
error_reporting(0);
session_start();
header('Content-Type: application/json');

if(isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];
    
    include '../config/db_connect.php';
    
    $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    echo json_encode(['role' => $user ? $user['role'] : 'user']);
} else {
    echo json_encode(['role' => 'guest']);
}
?>