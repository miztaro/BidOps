<?php
// server/auth/create-account.php
session_start();
require __DIR__ . '/../config/database.php'; 

// 1. Security: Make sure they came from Google Registration
if (!isset($_SESSION['google_register'])) {
    header("Location: ../../client/register.html");
    exit();
}

// 2. Get Form Data
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirm = $_POST['confirm-password'] ?? ''; 
$email = $_SESSION['google_register']['email'];

if (empty($username) || empty($password)) { die("Please fill all fields."); }
if ($password !== $confirm) { die("Passwords do not match."); }

$db = new Database();
$conn = $db->getConnection();

// ======================================================
// 3. SET USER ID FROM EMAIL
// Example: "2244768@slu.email.com" -> ID becomes "2244768"
// ======================================================

// Split the email at the "@" symbol
$email_parts = explode("@", $email);

// Take the first part (index 0) as the ID
$new_id = $email_parts[0]; 

// ======================================================

// 4. Insert User into Database
$hashed_password = password_hash($password, PASSWORD_DEFAULT); 

$stmt = $conn->prepare("INSERT INTO user (user_id, email, password, username, warning_count, is_banned, is_deleted) VALUES (?, ?, ?, ?, 0, 0, 0)");
$stmt->bind_param("ssss", $new_id, $email, $hashed_password, $username);

if ($stmt->execute()) {
    // 5. Success! Clear temp session
    unset($_SESSION['google_register']);
    
    // Auto-save session so they don't have to login again
    $_SESSION['role'] = 'user';
    $_SESSION['user_id'] = $new_id;
    $_SESSION['username'] = $username;
    $_SESSION['email'] = $email;

    // Redirect to Login (or Homepage)
    echo "<script>
        alert('Account created successfully! Your User ID is: $new_id');
        window.location.href = '../../client/login.html'; 
    </script>";
} else {
    // Handle error if that ID already exists (Duplicate entry)
    if ($conn->errno === 1062) { // 1062 is the SQL error code for Duplicate Key
        echo "<script>
            alert('An account with this ID ($new_id) already exists.');
            window.history.back();
        </script>";
    } else {
        echo "Database Error: " . $stmt->error;
    }
}
?>