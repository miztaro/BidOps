<?php
session_start();

// Correct paths based on your structure: BidOps/server/auth/register-callback.php
require __DIR__ . '/../../vendor/autoload.php'; 
require __DIR__ . '/../config/database.php'; 

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

$id_token = $_GET['credential'] ?? '';
if (!$id_token) {
    header("Location: /BidOps/client/register.html?error=no_token");
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
    $name = $decoded->name ?? ''; // Capture name if available

    // 2. STRICT SLU EMAIL CHECK
    if (!str_ends_with($email, '@slu.edu.ph')) {
        echo "<script>
            alert('Access Denied: Only @slu.edu.ph emails are allowed.');
            window.location.href = '/BidOps/client/register.html';
          </script>";
        exit();
    }

    // 3. Check if User Already Exists
    $db = new Database();
    $conn = $db->getConnection();
    
    // Check 'user' table (not users)
    $stmt = $conn->prepare("SELECT user_id FROM user WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo "<script>
            alert('This email is already registered. Please Log In.');
            window.location.href = '/BidOps/client/login.html';
          </script>";
        exit();
    }

    // 4. Store email in session and move to account creation
    $_SESSION['google_register'] = [
        'email' => $email,
        'name'  => $name
    ];

    header("Location: /BidOps/client/create-account.html");
    exit();

} catch (Exception $e) {
    die("Error validating token: " . $e->getMessage());
}
?>