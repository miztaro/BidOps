<?php
session_start();
require __DIR__ . '/../config/db_connect.php'; // your database connection

// Check if Google registration session exists
if (!isset($_SESSION['google_register'])) {
    die("No registration in progress.");
}

// Get form data
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm-password'] ?? '';

if (!$username || !$password || !$confirm_password) {
    die("Please fill all fields.");
}

if ($password !== $confirm_password) {
    die("Passwords do not match.");
}

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Get Google info from session
$name = $_SESSION['google_register']['name'];
$email = $_SESSION['google_register']['email'];

// Insert into database
$stmt = $conn->prepare("INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $name, $email, $username, $hashed_password);

if ($stmt->execute()) {
    // Registration complete
    unset($_SESSION['google_register']); // clean up session
    header("Location: /client/homepage.html");
    exit();
} else {
    die("Database error: " . $stmt->error);
}
