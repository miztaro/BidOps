<?php
// 1. Dynamic CORS (Allow requests from localhost:3000 or any network IP)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

// Handle Preflight Request (Browser checking permissions)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Destroy Session
session_start();
session_unset();
session_destroy();

// 3. Return JSON
header("Content-Type: application/json");
echo json_encode(["success" => true]);
?>