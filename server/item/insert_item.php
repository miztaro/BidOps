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
$maxTitleLength = 50;
$minTitleLength = 3;
$maxDescLength = 300;
$minDescLength = 10;

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
        $bid_increment_percent = $_POST['bid_increment_percent'] ?? 5;
        $bid_increment_percent = intval($bid_increment_percent);

        if ($bid_increment_percent < 1 || $bid_increment_percent > 20) {
        $bid_increment_percent = 5;
        }
       
        $seller_id = 'u1'; // using Alice as default seller
        //$seller_id = $_SESSION['user_id']; //use current user

        if(empty($title) || empty($category) || empty($description) || empty($listingType)) {
            http_response_code(400);
            echo json_encode(array("message" => "All fields are required."));
            exit();
        }
       
        if(empty(trim($title)) || empty(trim($description))) {
            http_response_code(400);
            echo json_encode(array("message" => empty(trim($title)) ? "Title cannot be empty." : "Description cannot be empty."));
            exit();
        }
       
        // Check minimum length
        if(strlen($title) < $minTitleLength) {
            http_response_code(400);
            echo json_encode(array("message" => "Title must be at least {$minTitleLength} characters."));
            exit();
        }
       
        if(strlen($description) < $minDescLength) {
            http_response_code(400);
            echo json_encode(array("message" => "Description must be at least {$minDescLength} characters."));
            exit();
        }
       
        // Check maximum length
        if(strlen($title) > $maxTitleLength) {
            http_response_code(400);
            echo json_encode(array("message" => "Title cannot exceed {$maxTitleLength} characters."));
            exit();
        }
       
        if(strlen($description) > $maxDescLength) {
            http_response_code(400);
            echo json_encode(array("message" => "Description cannot exceed {$maxDescLength} characters."));
            exit();
        }

        if($listingType == 'bid') {
            if(empty($end_date)) {
                http_response_code(400);
                echo json_encode(array("message" => "End date and time are required for bid listings."));
                exit();
            }
           
            if(empty($starting_price) || $starting_price <= 0) {
                http_response_code(400);
                echo json_encode(array("message" => "Starting price must be greater than 0."));
                exit();
            }
           
            $end_date_mysql = date('Y-m-d H:i:s', strtotime($end_date));
            $now = date('Y-m-d H:i:s');
           
            if($end_date_mysql <= $now) {
                http_response_code(400);
                echo json_encode(array("message" => "End date must be in the future."));
                exit();
            }
        }

        $savedImages = [];
        $maxFiles = 5;
        $maxSizeBytes = 10 * 1024 * 1024; 
        $allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        // Normalize incoming file arrays
        $fileInputs = [];
        if (isset($_FILES['images'])) {
            $fileInputs = $_FILES['images'];
        } elseif (isset($_FILES['image'])) {
            $fileInputs = $_FILES['image'];
        }

        // Helper to process normalized $_FILES-like array
        if (!empty($fileInputs) && isset($fileInputs['name'])) {
            if (is_array($fileInputs['name'])) {
                $countFiles = count($fileInputs['name']);
                $toProcess = min($countFiles, $maxFiles);
                $upload_dir = __DIR__ . "/uploads/";
                if(!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

                for ($i = 0; $i < $toProcess; $i++) {
                    if ($fileInputs['error'][$i] !== 0) continue;
                    $originalName = $fileInputs['name'][$i];
                    $tmpName = $fileInputs['tmp_name'][$i];
                    $size = $fileInputs['size'][$i];


                    $file_extension = pathinfo($originalName, PATHINFO_EXTENSION);
                    if (!in_array(strtolower($file_extension), $allowed_types)) {
                        http_response_code(400);
                        echo json_encode(array("message" => "Only JPG, JPEG, PNG, GIF & WEBP files are allowed."));
                        exit();
                    }
                    if ($size > $maxSizeBytes) {
                        http_response_code(400);
                        echo json_encode(array("message" => "Each image must be less than 10MB."));
                        exit();
                    }

                    $filename = "item_" . time() . "_" . uniqid() . "." . $file_extension;
                    $target_file = $upload_dir . $filename;
                    if (move_uploaded_file($tmpName, $target_file)) {
                        // store relative path 
                        $savedImages[] = "uploads/" . $filename;
                    } else {
                        throw new Exception("Failed to upload file: {$originalName}");
                    }
                }
            } else {
                if ($fileInputs['error'] == 0) {
                    $originalName = $fileInputs['name'];
                    $tmpName = $fileInputs['tmp_name'];
                    $size = $fileInputs['size'];


                    $file_extension = pathinfo($originalName, PATHINFO_EXTENSION);
                    if (!in_array(strtolower($file_extension), $allowed_types)) {
                        http_response_code(400);
                        echo json_encode(array("message" => "Only JPG, JPEG, PNG, GIF & WEBP files are allowed."));
                        exit();
                    }
                    if ($size > $maxSizeBytes) {
                        http_response_code(400);
                        echo json_encode(array("message" => "Image must be less than 10MB."));
                        exit();
                    }

                    $upload_dir = __DIR__ . "/uploads/";
                    if(!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

                    $filename = "item_" . time() . "_" . uniqid() . "." . $file_extension;
                    $target_file = $upload_dir . $filename;
                    if (move_uploaded_file($tmpName, $target_file)) {
                        $savedImages[] = "uploads/" . $filename;
                    } else {
                        throw new Exception("Failed to upload image.");
                    }
                }
            }
        }

        $db->begin_transaction();

        try {
            $query = "INSERT INTO ITEM (title, description, category_type, item_type, seller_id, status)
                      VALUES (?, ?, ?, ?, ?, 'active')";
            $stmt = $db->prepare($query);
            $stmt->bind_param("sssss", $title, $description, $category, $listingType, $seller_id);

            if(!$stmt->execute()) throw new Exception("Failed to create item.");
            $item_id = $db->insert_id;

            if (!empty($savedImages)) {
                $imageQuery = "INSERT INTO ITEMIMAGE (image_path, item_id) VALUES (?, ?)";
                $imageStmt = $db->prepare($imageQuery);
                foreach ($savedImages as $path) {
                    $imageStmt->bind_param("si", $path, $item_id);
                    if (!$imageStmt->execute()) throw new Exception("Failed to save image record.");
                }
            }

            if($listingType == 'bid') {
                $bidQuery = "INSERT INTO BIDITEM (item_id, starting_price, start_date, end_date, bid_increment_percent)
                            VALUES (?, ?, NOW(), ?, ?)";
                $bidStmt = $db->prepare($bidQuery);
                $bidStmt->bind_param("idss", $item_id, $starting_price, $end_date_mysql, $bid_increment_percent);
                if(!$bidStmt->execute()) throw new Exception("Failed to create bid item.");
            } else {
                $swapQuery = "INSERT INTO SWAPITEM (item_id) VALUES (?)";
                $swapStmt = $db->prepare($swapQuery);
                $swapStmt->bind_param("i", $item_id);
                if(!$swapStmt->execute()) throw new Exception("Failed to create swap item.");
            }

            $db->commit();

            http_response_code(201);
            echo json_encode([
                "message" => "Item created successfully!",
                "item_id" => $item_id
            ]);

        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error creating item: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>