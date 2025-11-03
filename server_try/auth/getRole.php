<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['admin_id'])) {
    echo json_encode(['role' => 'admin']);
} elseif (isset($_SESSION['user_id'])) {
    echo json_encode(['role' => 'user']);
} else {
    echo json_encode(['role' => 'user']);
}
?>
