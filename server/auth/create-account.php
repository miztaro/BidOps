<?php
session_start();

// Correct path to database config
require __DIR__ . '/../config/database.php'; 

// 1. Security Check: Ensure they came from Google Auth
if (!isset($_SESSION['google_register'])) {
    header("Location: /BidOps/client/register.html");
    exit();
}

// 2. Get Form Data
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm-password'] ?? '';
$email = $_SESSION['google_register']['email'];

// Basic Validation
if (empty($username) || empty($password)) {
    die("Please fill all fields.");
}
if ($password !== $confirm_password) {
    echo "<script>alert('Passwords do not match.'); window.history.back();</script>";
    exit();
}

$db = new Database();
$conn = $db->getConnection();

// 3. GENERATE NEW USER ID (Format: u1, u2... u15, u16)
// We cast the substring to UNSIGNED to ensure u10 comes after u9
$id_sql = "SELECT user_id FROM user 
           WHERE user_id LIKE 'u%' 
           ORDER BY CAST(SUBSTR(user_id, 2) AS UNSIGNED) DESC LIMIT 1";
$id_res = $conn->query($id_sql);

$new_id = 'u1'; // Default if table is empty
if ($id_res && $id_res->num_rows > 0) {
    $row = $id_res->fetch_assoc();
    $last_id = $row['user_id']; // e.g., "u15"
    // Remove 'u', convert to int, add 1
    $num = (int)substr($last_id, 1); 
    $new_id = 'u' . ($num + 1); 
}

// 4. Hash Password
$hashed_password = password_hash($password, PASSWORD_DEFAULT); 

// 5. Insert into 'user' table
// Columns based on your DB: user_id, email, password, username, warning_count, is_banned, is_deleted
$sql = "INSERT INTO user (user_id, email, password, username, warning_count, is_banned, is_deleted) VALUES (?, ?, ?, ?, 0, 0, 0)";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("ssss", $new_id, $email, $hashed_password, $username);
    
    if ($stmt->execute()) {
        // SUCCESS: clear session and redirect
        unset($_SESSION['google_register']);
        
        echo "<script>
            alert('Account created successfully! Your ID is $new_id. Please log in.');
            window.location.href = '/BidOps/client/login.html'; 
          </script>";
        exit();
    } else {
        die("Database Execution Error: " . $stmt->error);
    }
} else {
    die("Database Preparation Error: " . $conn->error);
}
?>