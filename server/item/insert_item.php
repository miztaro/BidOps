<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
session_start();

$database = new Database();
$db = $database->getConnection();
$maxTitleLength = 60;
$maxDescLength = 300;

// if(!isset($_SESSION['user_id'])) {
//     http_response_code(401);
//     echo json_encode(array("message" => "Please log in to create a listing."));
//     exit();
// }

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        $title = $_POST['title'] ?? '';
        $category = $_POST['category'] ?? '';
        $description = $_POST['description'] ?? '';
        $listingType = $_POST['listingType'] ?? '';
        $starting_price = $_POST['starting_price'] ?? 0;
        $end_date = $_POST['end_date'] ?? '';
        
        $seller_id = 'u1'; // using Alice as default seller
        //$seller_id = $_SESSION['user_id']; //use current user

        if(empty($title) || empty($category) || empty($description) || empty($listingType)) {
            http_response_code(400);
            echo json_encode(array("message" => "All fields are required."));
            exit();
        }
        // to check
        if(empty(trim($title)) || empty(trim($description))) {
            http_response_code(400);
            if(empty(trim($title))){
                echo json_encode(array("message" => "Input valid title."));
            }
            elseif(empty(trim($description))){
                echo json_encode(array("message" => "Input valid description."));
            }
            exit();
        }
        //to check
        if(strlen($title) > $maxTitleLength || strlen($description) > $maxDescLength){
            http_response_code(400);
            if(strlen($title) > $maxTitleLength){
                echo json_encode(array("message" => "Maximum input for title is 60 characters."));
            }
            elseif(strlen($description) > $maxDescLength){
                echo json_encode(array("message" => "Maximum input for description is 300 characters."));
            }
            exit();
        }

        if($listingType == 'bid') {
            if(empty($end_date)) {
                http_response_code(400);
                echo json_encode(array("message" => "End date and time are required for bid listings."));
                exit();
            }
            
            // converting to date time format sa mysql
            $end_date_mysql = date('Y-m-d H:i:s', strtotime($end_date));
            $now = date('Y-m-d H:i:s');
            
            if($end_date_mysql <= $now) {
                http_response_code(400);
                echo json_encode(array("message" => "End date must be in the future."));
                exit();
            }
        }

        $image_path = null;
        if(isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            // use uploads folder directly in server
            $upload_dir = "uploads/";
            if(!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }

            $file_extension = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
            $filename = "item_" . time() . "_" . uniqid() . "." . $file_extension;
            $target_file = $upload_dir . $filename;

            $allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if(!in_array(strtolower($file_extension), $allowed_types)) {
                http_response_code(400);
                echo json_encode(array("message" => "Only JPG, JPEG, PNG, GIF & WEBP files are allowed."));
                exit();
            }

            if(move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
                $image_path = $target_file;
            } else {
                throw new Exception("Failed to upload image.");
            }
        }

        $db->beginTransaction();

        try {
            $query = "INSERT INTO ITEM (title, description, category_type, item_type, seller_id, status) 
                      VALUES (:title, :description, :category, :item_type, :seller_id, 'active')";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(":title", $title);
            $stmt->bindParam(":description", $description);
            $stmt->bindParam(":category", $category);
            $stmt->bindParam(":item_type", $listingType);
            $stmt->bindParam(":seller_id", $seller_id);

            if(!$stmt->execute()) {
                throw new Exception("Failed to create item.");
            }

            $item_id = $db->lastInsertId();

            if($image_path) {
                $imageQuery = "INSERT INTO ITEMIMAGE (image_path, item_id) VALUES (:image_path, :item_id)";
                $imageStmt = $db->prepare($imageQuery);
                $imageStmt->bindParam(":image_path", $image_path);
                $imageStmt->bindParam(":item_id", $item_id);
                
                if(!$imageStmt->execute()) {
                    throw new Exception("Failed to save image.");
                }
            }

            if($listingType == 'bid') {
                $bidQuery = "INSERT INTO BIDITEM (item_id, starting_price, start_date, end_date) 
                            VALUES (:item_id, :starting_price, NOW(), :end_date)";
                $bidStmt = $db->prepare($bidQuery);
                $bidStmt->bindParam(":item_id", $item_id);
                $bidStmt->bindParam(":starting_price", $starting_price);
                $bidStmt->bindParam(":end_date", $end_date_mysql);
                
                if(!$bidStmt->execute()) {
                    throw new Exception("Failed to create bid item.");
                }
            } else {
                $swapQuery = "INSERT INTO SWAPITEM (item_id) VALUES (:item_id)";
                $swapStmt = $db->prepare($swapQuery);
                $swapStmt->bindParam(":item_id", $item_id);
                
                if(!$swapStmt->execute()) {
                    throw new Exception("Failed to create swap item.");
                }
            }

            $db->commit();

            http_response_code(201);
            echo json_encode(array(
                "message" => "Item created successfully!",
                "item_id" => $item_id
            ));

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error creating item: " . $e->getMessage()));
    }
} else {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed."));
}
?>