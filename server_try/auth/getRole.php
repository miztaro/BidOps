<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    $allowed_origins = ['http://localhost:8000', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: http://localhost:8000");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 3600");
    http_response_code(200);
    exit();
}

$allowed_origins = ['http://localhost:8000', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:8000");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

session_start();

try {
    $inactive = 600;
    $session_valid = false;

    if (isset($_SESSION['timeout'])) {
        if ((time() - $_SESSION['timeout']) <= $inactive) {
            $_SESSION['timeout'] = time();
            $session_valid = true;
        } else {
            session_destroy();
            echo json_encode(['role' => 'guest', 'message' => 'Session expired']);
            exit();
        }
    } else {
        if (isset($_SESSION['admin_id']) || isset($_SESSION['user_id'])) {
            $_SESSION['timeout'] = time();
            $session_valid = true;
        } else {
            $session_valid = false;
        }
    }

    if ($session_valid) {
        if (isset($_SESSION['admin_id'])) {
            echo json_encode([
                'role' => 'admin',
                'username' => $_SESSION['username'] ?? '',
                'admin_id' => $_SESSION['admin_id'],
                'timeout' => $_SESSION['timeout']
            ]);
        } elseif (isset($_SESSION['user_id'])) {
            echo json_encode([
                'role' => 'user', 
                'username' => $_SESSION['username'] ?? '',
                'user_id' => $_SESSION['user_id'],
                'email' => $_SESSION['email'] ?? '',
                'timeout' => $_SESSION['timeout']
            ]);
        } else {
            session_destroy();
            echo json_encode(['role' => 'guest', 'message' => 'Invalid session']);
        }
    } else {
        echo json_encode(['role' => 'guest', 'message' => 'No active session']);
    }

} catch (Exception $e) {
    error_log("getRole.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'role' => 'guest', 
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
?>