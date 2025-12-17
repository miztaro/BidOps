<?php
// server/auth/logout.php

// 1. CORS Headers (Matches your login.php security)
$allowed_origins = ['http://localhost', 'http://localhost:8000', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default fallback (optional, or you can leave it out to block others)
    header("Access-Control-Allow-Origin: http://localhost:8000"); 
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle Preflight Request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Start Session to access it
session_start();

// 3. Unset all session variables
$_SESSION = array();

// 4. Kill the Session Cookie in the Browser ***
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 5. Destroy the session
session_destroy();

// 6. Return JSON
header("Content-Type: application/json");
echo json_encode(["success" => true, "message" => "Logged out successfully"]);
?>