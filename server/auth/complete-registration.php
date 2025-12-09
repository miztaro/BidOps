<?php
session_start();
require __DIR__ . '/../config/db_connect.php'; 

if (!isset($_SESSION['google_register'])) {
    header("Location: /BidOps/client/register.html");
    exit();
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm-password'] ?? '';
$email = $_SESSION['google_register']['email'];

if (empty($username) || empty($password)) {
    die("Please fill all fields.");
}
if ($password !== $confirm_password) {
    die("Passwords do not match.");
}

$db = new Database();
$conn = $db->getConnection();

// 1. GENERATE NEW USER ID (Format: u1, u2... u15, u16)
// We get the highest number from user_id, cast it to int, and add 1
$id_sql = "SELECT user_id FROM user 
           WHERE user_id LIKE 'u%' 
           ORDER BY CAST(SUBSTR(user_id, 2) AS UNSIGNED) DESC LIMIT 1";
$id_res = $conn->query($id_sql);

$new_id = 'u1'; // Default if table is empty
if ($id_res->num_rows > 0) {
    $row = $id_res->fetch_assoc();
    $last_id = $row['user_id']; // e.g., "u15"
    $num = (int)substr($last_id, 1); // remove 'u', get 15
    $new_id = 'u' . ($num + 1); // make "u16"
}

// 2. Hash Password
$hashed_password = password_hash($password, PASSWORD_DEFAULT); 

// 3. Insert into 'user' table
// Columns: user_id, email, password, username, warning_count, is_banned, is_deleted
$stmt = $conn->prepare("INSERT INTO user (user_id, email, password, username, warning_count, is_banned, is_deleted) VALUES (?, ?, ?, ?, 0, 0, 0)");
$stmt->bind_param("ssss", $new_id, $email, $hashed_password, $username);

if ($stmt->execute()) {
    unset($_SESSION['google_register']);
    
    // Optional: Log them in automatically
    $_SESSION['user_id'] = $new_id;
    
    echo "<script>
        alert('Account created successfully!');
        window.location.href = '/BidOps/client/login.html'; // Or homepage
      </script>";
    exit();
} else {
    die("Database Error: " . $stmt->error);
}
?>