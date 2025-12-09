<?php
session_start();

// Adjust paths to match your folder structure
require __DIR__ . '/../../vendor/autoload.php'; 
require __DIR__ . '/../config/database.php'; 

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

$id_token = $_GET['credential'] ?? '';
if (!$id_token) {
    header("Location: /BidOps/client/login.html");
    exit();
}

$client_id = '904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com';

try {
    // 1. Verify Google Token
    $certs = json_decode(file_get_contents("https://www.googleapis.com/oauth2/v3/certs"), true);
    $jwk_keys = JWK::parseKeySet($certs);
    $decoded = JWT::decode($id_token, $jwk_keys);
    
    if ($decoded->aud !== $client_id) {
        die("Invalid audience.");
    }

    $email = $decoded->email;

    // 2. Connect to Database
    $db = new Database();
    $conn = $db->getConnection();
    
    // 3. Check if this email exists in 'user' table
    // Also check if they are banned or deleted
    $stmt = $conn->prepare("SELECT user_id, username, email, is_banned, is_deleted FROM user WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        // Check Ban Status
        if ($user['is_banned'] == 1) {
            echo "<script>
                alert('Account is banned. Contact support.');
                window.location.href = '/BidOps/client/login.html';
            </script>";
            exit();
        }

        // Check Deleted Status
        if ($user['is_deleted'] == 1) {
            echo "<script>
                alert('Account no longer exists.');
                window.location.href = '/BidOps/client/login.html';
            </script>";
            exit();
        }

        // 4. LOGIN SUCCESS: Set Session
        $_SESSION['role'] = 'user';
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['timeout'] = time();

        // Redirect to Homepage
        header("Location: /BidOps/client/homepage.html");
        exit();

    } else {
        // Email not found -> Redirect to Register
        echo "<script>
            alert('No account found for this email. Please Sign Up first.');
            window.location.href = '/BidOps/client/register.html';
        </script>";
        exit();
    }

} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}
?>