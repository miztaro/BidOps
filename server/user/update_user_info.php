<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

include_once '../config/database.php';

try{
    $database = new Database();
    $conn = $database->getConnection();

    if($conn->connect_error){
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if(isset($data['action'])){
        $action = $data['action'];

        if($action === "change_password"){
            if (!isset($data['new_password']) || empty($data['new_password'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'New password is required'
                ]);
                exit;
            }

            $new_password = $data['new_password'];

            $sql = "UPDATE user SET password = ? WHERE user_id=?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $new_password, $user_id);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Password updated successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Password update failed or no changes made'
                ]);
            }

            $stmt->close();
        } else if($action === "change_username"){
            if(!isset($data['new_username']) || empty($data['new_username'])){
                echo json_encode([
                    'success' => false,
                    'message' => 'New username is required'
                ]);
                exit;
            }
            $new_username = trim($data['new_username']);

            try {
                $sql = "UPDATE user SET username = ? WHERE user_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ss", $new_username, $user_id);
                $stmt->execute();

                if($stmt->affected_rows > 0){
                    echo json_encode([
                        'success' => true,
                        'message' => 'Username updated successfully'
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'No changes made or update failed'
                    ]);
                }

                $stmt->close();
            } catch (mysqli_sql_exception $e) {
                if(strpos($e->getMessage(), "Duplicate entry") !== false){
                    echo json_encode([
                        'success' => false,
                        'message' => 'Username is already taken'
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Error: ' . $e->getMessage()
                    ]);
                }
            }
        }else if($action === 'delete_account'){
            // Delete ratings 
            $stmt = $conn->prepare("DELETE FROM userrating WHERE rater_id =?");
            $stmt->bind_param("s", $user_id);
            $stmt->execute();
            $stmt->close();

            // Delete reports 
            $stmt=$conn->prepare("DELETE FROM report WHERE reporter_id =?");
            $stmt->bind_param("s", $user_id);
            $stmt->execute();
            $stmt->close();

            // Update is_deleted
            $stmt = $conn->prepare("UPDATE user SET is_deleted = 1 WHERE user_id = ?");
            $stmt->bind_param("s", $user_id);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                session_destroy();

                echo json_encode([
                    'success' => true,
                    'message' => 'Account deleted successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Account deletion failed'
                ]);
            }

            $stmt->close();
        }else{
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
        }
    }else{
        echo json_encode([
            'success' => false,
            'message' => 'Action is required'
        ]);
    }
    $conn->close();
}catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating user info: ' . $e->getMessage()
    ]);
    exit;
}
?>