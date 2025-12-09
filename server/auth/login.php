<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 1. CORS Headers
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    $allowed_origins = ['http://localhost', 'http://localhost:8000', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: http://localhost:8000");
    }
    
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    http_response_code(200);
    exit();
}

$allowed_origins = ['http://localhost', 'http://localhost:8000', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:8000");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

session_start();

include_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        $input = file_get_contents("php://input");
        
        if (empty($input)) {
            throw new Exception("No data received");
        }
        
        $data = json_decode($input);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON format");
        }
        
        if (empty($data->username) || empty($data->password)) {
            echo json_encode([
                "success" => false,
                "message" => "Username and password are required!"
            ]);
            exit();
        }

        //Get MySQLi connection
        $database = new Database();
        $db = $database->getConnection();

        /* ----------------------
            CHECK USER LOGIN
        -----------------------*/

        $queryUser = "SELECT user_id, username, email, password, is_banned 
                      FROM user
                      WHERE username = ? AND is_deleted = 0";

        $stmtUser = $db->prepare($queryUser);
        $stmtUser->bind_param("s", $data->username);
        $stmtUser->execute();
        $resultUser = $stmtUser->get_result();

        $found = false;

        if ($resultUser->num_rows > 0) {
            $user = $resultUser->fetch_assoc();
            
            if ($user['is_banned']) {
                echo json_encode([
                    "success" => false,
                    "message" => "Your account has been banned. Please contact BidOps support."
                ]);
                exit();
            }

        
            // We check:
            // 1. Is it a Hash? (password_verify) - For your NEW account
            // 2. Is it Plain Text? (===) - For OLD dummy accounts (u1-u15)
            $input_password = $data->password;
            $stored_password = $user['password'];

            if (password_verify($input_password, $stored_password) || $input_password === $stored_password) {
                
                session_regenerate_id(true);

                $_SESSION['role'] = 'user';
                $_SESSION['user_id'] = $user['user_id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['timeout'] = time();
                
                $found = true;

                echo json_encode([
                    "success" => true,
                    "role" => "user",
                    "user" => [
                        "user_id" => $user['user_id'],
                        "username" => $user['username'],
                        "email" => $user['email']
                    ],
                    "message" => "Login successful!"
                ]);
                exit();
            }
           
        }

        /* ----------------------
            CHECK ADMIN LOGIN
        -----------------------*/
        if (!$found) {
            $queryAdmin = "SELECT admin_id, username, password FROM ADMIN WHERE username = ?";
            $stmtAdmin = $db->prepare($queryAdmin);
            $stmtAdmin->bind_param("s", $data->username);
            $stmtAdmin->execute();
            $resultAdmin = $stmtAdmin->get_result();

            if ($resultAdmin->num_rows > 0) {
                $admin = $resultAdmin->fetch_assoc();

                // Admin  keeps plain text 
        
                if ($data->password === $admin['password']) {
                    session_regenerate_id(true);

                    $_SESSION['role'] = 'admin';
                    $_SESSION['admin_id'] = $admin['admin_id'];
                    $_SESSION['username'] = $admin['username'];
                    $_SESSION['timeout'] = time();
                    $found = true;

                    echo json_encode([
                        "success" => true,
                        "role" => "admin",
                        "admin" => [
                            "admin_id" => $admin['admin_id'],
                            "username" => $admin['username']
                        ],
                        "message" => "Admin login successful!"
                    ]);
                    exit();
                }
            }
        }

        /* ----------------------
            INVALID LOGIN
        -----------------------*/
        echo json_encode([
            "success" => false,
            "message" => "Invalid username or password!"
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Server error: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
}
?>