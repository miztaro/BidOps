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

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->username) && !empty($data->password)) {
        $database = new Database();
        $db = $database->getConnection();
        
        $query = "SELECT * FROM USER WHERE username = :username AND is_deleted = 0";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":username", $data->username);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($data->password === $user['password']) {
                if ($user['is_banned']) {
                    echo json_encode([
                        "success" => false,
                        "message" => "Your account has been banned! Please contact BidOps support."
                    ]);
                } else {
                    echo json_encode([
                        "success" => true,
                        "user" => [
                            "user_id" => $user['user_id'],
                            "username" => $user['username'],
                            "email" => $user['email']
                        ]
                    ]);
                }
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid password!"
                ]);
            }
        } else {
            echo json_encode([
                "success" => false,
                "message" => "User not found!"
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