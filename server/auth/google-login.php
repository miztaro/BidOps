<?php
// server/auth/google-login.php

// 1. SILENCE HTML ERRORS
error_reporting(E_ALL);
ini_set('display_errors', 0); 

session_start();

// 2. HEADERS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

// 3. LOAD DEPENDENCIES (MUST BE OUTSIDE TRY BLOCK)
require __DIR__ . '/../../vendor/autoload.php'; 
require __DIR__ . '/../config/database.php'; 

// 4. USE STATEMENTS (MUST BE HERE, NOT INSIDE TRY)
use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

try {
    // 5. GET INPUT
    $json_input = file_get_contents("php://input");
    $data = json_decode($json_input, true);
    $id_token = $data['credential'] ?? '';

    if (empty($id_token)) {
        throw new Exception("No credential received.");
    }

    $client_id = '904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com';

    // 6. VERIFY GOOGLE TOKEN
    $certs = json_decode(file_get_contents("https://www.googleapis.com/oauth2/v3/certs"), true);
    $jwk_keys = JWK::parseKeySet($certs);
    $decoded = JWT::decode($id_token, $jwk_keys);
    
    if ($decoded->aud !== $client_id) {
        throw new Exception("Invalid audience.");
    }

    $email = $decoded->email;

    // 7. DATABASE CHECK
    $db = new Database();
    $conn = $db->getConnection();
    
    $stmt = $conn->prepare("SELECT user_id, username, email, is_banned, is_deleted FROM user WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if ($user['is_banned'] == 1) {
            echo json_encode(["success" => false, "message" => "Account is banned."]);
            exit();
        }

        if ($user['is_deleted'] == 1) {
            echo json_encode(["success" => false, "message" => "Account deleted."]);
            exit();
        }

        // LOGIN SUCCESS
        $_SESSION['role'] = 'user';
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];

        echo json_encode([
            "success" => true,
            "user" => [
                "user_id" => $user['user_id'],
                "username" => $user['username'],
                "email" => $user['email']
            ]
        ]);
        exit();

    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Account not found. Please Sign Up.",
            "redirect" => "register.html"
        ]);
        exit();
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    exit();
}
?>