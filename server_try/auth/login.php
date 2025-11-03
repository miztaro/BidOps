<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:8000");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:8000");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization");

include_once '../config/database.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->username) && !empty($data->password)) {
        $database = new Database();
        $db = $database->getConnection();

        // Check USER table first
        $queryUser = "SELECT * FROM USER WHERE username = :username AND is_deleted = 0";
        $stmtUser = $db->prepare($queryUser);
        $stmtUser->bindParam(":username", $data->username);
        $stmtUser->execute();

        // Check ADMIN table if not found in USER
        $queryAdmin = "SELECT * FROM ADMIN WHERE username = :username";
        $stmtAdmin = $db->prepare($queryAdmin);
        $stmtAdmin->bindParam(":username", $data->username);
        $stmtAdmin->execute();

        $found = false;

        if ($stmtUser->rowCount() > 0) {
            $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
            if ($data->password === $user['password']) {
                // Clear any old admin session
                unset($_SESSION['admin_id']);

                $_SESSION['role'] = 'user';
                $_SESSION['user_id'] = $user['user_id'];
                $found = true;

                echo json_encode([
                    "success" => true,
                    "role" => "user",
                    "user" => [
                        "user_id" => $user['user_id'],
                        "username" => $user['username'],
                        "email" => $user['email']
                    ]
                ]);
            }
        } elseif ($stmtAdmin->rowCount() > 0) {
            $admin = $stmtAdmin->fetch(PDO::FETCH_ASSOC);
            if ($data->password === $admin['password']) {

                unset($_SESSION['user_id']);
                $_SESSION['role'] = 'admin';
                $_SESSION['admin_id'] = $admin['admin_id'];
                $found = true;

                echo json_encode([
                    "success" => true,
                    "role" => "admin",
                    "admin" => [
                        "admin_id" => $admin['admin_id'],
                        "username" => $admin['username']
                    ]
                ]);
            }
        }

        if (!$found) {
            echo json_encode([
                "success" => false,
                "message" => "Invalid username or password!"
            ]);
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Username and password are required!"
        ]);
    }
}
?>
