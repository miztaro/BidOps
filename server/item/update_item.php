<?php

header("Content-Type: application/json");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require "../config/database.php";
$database = new Database();
$conn = $database->getConnection();

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

if($_SERVER['REQUEST_METHOD'] === 'POST'){
    $item_id = intval($_POST['item_id']);
    $title = $_POST['item_name'];
    $description = $_POST['description'];
    $category_type = $_POST['category'];
    $status = $_POST['status'];
    $item_type = $_POST['item_type'] ?? '';

    // Basic validation for all items
    if (!$item_id || !$title || !$category_type || !$status) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "All required fields must be filled out."]);
        exit();
    }

    // Bid-specific validation
    if (strtolower($item_type) === 'bid') {
        $starting_price = $_POST['starting_price'] ?? null;
        $start_date = $_POST['start_date'] ?? null;
        $end_date = $_POST['end_date'] ?? null;

        if (!$starting_price || !$start_date || !$end_date) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Starting price and dates are required for bid items."]);
            exit();
        }

        // Price validation
        $starting_price = floatval($starting_price);
        if (!is_numeric($starting_price) || $starting_price < 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Starting price must be a positive number."]);
            exit();
        }   

        // Date validation
        $start_date = str_replace('T', ' ', $start_date) . ':00';
        $end_date = str_replace('T', ' ', $end_date) . ':00';
        $start_timestamp = strtotime($start_date);
        $end_timestamp = strtotime($end_date);

        if ($start_timestamp === false || $end_timestamp === false || $end_timestamp <= $start_timestamp) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid start/end dates."]);
            exit();
        }
    } else {
        // Swap items: set default values
        $starting_price = 0;
        $start_date = date("Y-m-d H:i:s");
        $end_date = date("Y-m-d H:i:s");
    }

    //Update 'item' Table
    $sql_item ="UPDATE item
                SET title=?, description=?, category_type=?, status=?
                WHERE item_id=?";
    $stmt_item = $conn->prepare($sql_item);
    $stmt_item->bind_param("ssssi", $title, $description, $category_type, $status, $item_id);
    $stmt_item->execute();

    // Upsert into biditem table
    $sql_bid = "
        INSERT INTO biditem (item_id, starting_price, start_date, end_date)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            starting_price = VALUES(starting_price),
            start_date = VALUES(start_date),
            end_date = VALUES(end_date)
    ";
    $stmt_bid = $conn->prepare($sql_bid);
    $stmt_bid->bind_param("idss", $item_id, $starting_price, $start_date, $end_date);
    $stmt_bid->execute();
    $stmt_bid->close();

    //Handle removed images
    $removedImages = json_decode($_POST['removed_images'] ?? '[]', true);
    if(!empty($removedImages)){
        $sql_del = "DELETE FROM itemimage WHERE image_path = ? AND item_id = ?";
        $stmt_del = $conn->prepare($sql_del);
        foreach($removedImages as $imgPath){
            $stmt_del->bind_param("si", $imgPath, $item_id);
            $stmt_del->execute();

            $fullPath = __DIR__ . "/" . $imgPath;
            if(file_exists($fullPath)){
                unlink($fullPath);
            } else {
                error_log("File not found for deletion: " . $fullPath);
            }
        }
        $stmt_del->close();
    }

    // Handle new uploads
    if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
       $uploadDir = __DIR__ . "/uploads/";

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);  // create folder if it doesn't exist
        }

        foreach($_FILES['images']['name'] as $key => $name){
            if($_FILES['images']['error'][$key] === UPLOAD_ERR_OK){
                $tmp = $_FILES['images']['tmp_name'][$key];

                $safeName = preg_replace("/[^a-zA-Z0-9\-_\.]/", "_", basename($name));
                $newName = time() . "_" . basename($safeName);

                $serverPath = $uploadDir . $newName;
                $databasePath = "uploads/" . $newName;

                if(move_uploaded_file($tmp,$serverPath)){
                    $sql_img = "INSERT INTO itemimage (image_path, item_id) VALUES (?,?)";
                    $stmt_img = $conn->prepare($sql_img);
                    $stmt_img->bind_param("si", $databasePath, $item_id);
                    $stmt_img->execute();
                    $stmt_img->close();
                }else{
                    error_log("Failed to move uploaded file: $tmp to $serverPath");
                }
            }
        }
    }
    echo json_encode(["success" => true]);
}
