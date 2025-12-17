<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

        // Get MySQLi connection
        $database = new Database();
        $db = $database->getConnection();

    
        // CHECK USER LOGIN

        // We need to find them even if deleted to verify password first.
        $queryUser = "SELECT user_id, username, email, password, is_banned, is_deleted 
                      FROM user
                      WHERE username = ?";

        $stmtUser = $db->prepare($queryUser);
        $stmtUser->bind_param("s", $data->username);
        $stmtUser->execute();
        $resultUser = $stmtUser->get_result();

        $found = false;

        if ($resultUser->num_rows > 0) {
            $user = $resultUser->fetch_assoc();
            
            // *** CHANGE 2: Verify Password FIRST ***
            // We check password before checking ban/delete status for security
            $input_password = $data->password;
            $stored_password = $user['password'];

            if (password_verify($input_password, $stored_password) || $input_password === $stored_password) {
                
                // Password is CORRECT. Now check status.

                // A. CHECK BANNED
                if ($user['is_banned'] == 1) {
                    echo json_encode([
                        "success" => false,
                        "message" => "Your account has been banned. Please contact BidOps support."
                    ]);
                    exit();
                }

                // B. CHECK DELETED 
                if ($user['is_deleted'] == 1) {
                    echo json_encode([
                        "success" => false,
                        "message" => "Account is deleted.",
                        "is_deleted" => true,       // Signal for Frontend
                        "user_id" => $user['user_id'] // ID for Reactivation
                    ]);
                    exit();
                }

                // C. SUCCESSFUL LOGIN
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
            // If password wrong, $found remains false, falls through to Admin check
        }

    
        // CHECK ADMIN LOGIN
    
        if (!$found) {
            $queryAdmin = "SELECT admin_id, username, password FROM admin WHERE username = ?";
            $stmtAdmin = $db->prepare($queryAdmin);
            $stmtAdmin->bind_param("s", $data->username);
            $stmtAdmin->execute();
            $resultAdmin = $stmtAdmin->get_result();

            if ($resultAdmin->num_rows > 0) {
                $admin = $resultAdmin->fetch_assoc();

                // Admin keeps plain text 
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

        // INVALID LOGIN (User not found, password wrong, or Admin not found)
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