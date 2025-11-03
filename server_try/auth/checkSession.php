<?php
session_start();
header('Content-Type: application/json');

// Check if someone is already logged in
if (isset($_SESSION['admin_id'])) {
    echo json_encode(['role' => 'admin']);
} elseif (isset($_SESSION['user_id'])) {
    echo json_encode(['role' => 'user']);
} else {
    echo json_encode(['role' => 'guest']); // no one logged in
}
