<?php
// server/auth/google-register.php

error_reporting(E_ALL);
ini_set('display_errors', 0); 
session_start();

header("Content-Type: application/json");
require __DIR__ . '/../../vendor/autoload.php'; 
require __DIR__ . '/../config/database.php'; 

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

try {
    $json_input = file_get_contents("php://input");
    $data = json_decode($json_input, true);
    $id_token = $data['credential'] ?? '';

    if (empty($id_token)) throw new Exception("No credential received.");

    // 1. Verify Google Token
    $client_id = '904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com';
    $certs = json_decode(file_get_contents("https://www.googleapis.com/oauth2/v3/certs"), true);
    $jwk_keys = JWK::parseKeySet($certs);
    $decoded = JWT::decode($id_token, $jwk_keys);
    
    if ($decoded->aud !== $client_id) throw new Exception("Invalid audience.");

    $email = $decoded->email;

    // 2. Check Database
    $db = new Database();
    $conn = $db->getConnection();
    
    $stmt = $conn->prepare("SELECT user_id, username, email FROM user WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // CASE A: USER EXISTS -> LOG THEM IN
        $user = $result->fetch_assoc();
        $_SESSION['role'] = 'user';
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];

        echo json_encode([
            "success" => true, 
            "message" => "Account already exists. Logging you in...",
            "redirect" => "homepage.html", // Go to home
            "user" => $user
        ]);
        exit();
    } else {
        // CASE B: NEW USER -> SEND TO CREATE ACCOUNT FORM
        // We save the email in session so the next page knows who they are
        $_SESSION['google_register'] = [
            'email' => $email,
            'google_name' => $decoded->name // Optional: pre-fill name if you want
        ];

        echo json_encode([
            "success" => false, // False means "Registration not done yet"
            "message" => "Please complete your profile.",
            "redirect" => "create-account.html" // JS will see this and redirect
        ]);
        exit();
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>