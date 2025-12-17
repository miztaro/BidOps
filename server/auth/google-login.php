<?php
// server/auth/google-login.php
// 1. Allow ANY computer to connect (Dynamic Origin)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // Cache for 1 day
}

// 2. Handle Browser "Pre-check" (OPTIONS request)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    
    exit(0);
}
// 1. SILENCE HTML ERRORS
error_reporting(E_ALL);
ini_set('display_errors', 0); 

session_start();

// 2. HEADERS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

// 3. LOAD DEPENDENCIES
require __DIR__ . '/../../vendor/autoload.php'; 
require __DIR__ . '/../config/database.php'; 

// 4. USE STATEMENTS
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

        // *** CHANGE: Updated Deleted Check to return flags ***
        if ($user['is_deleted'] == 1) {
            echo json_encode([
                "success" => false, 
                "message" => "Account is deleted.",
                "is_deleted" => true,        // Logic Trigger
                "user_id" => $user['user_id'] // ID for Reactivation
            ]);
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