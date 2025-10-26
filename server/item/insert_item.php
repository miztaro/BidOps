
<?php

require_once __DIR__ . '/../db/connection.php';

$title = mysqli_real_escape_string($conn, $_POST['title']);
$category = mysqli_real_escape_string($conn, $_POST['category']);
$description = mysqli_real_escape_string($conn, $_POST['description']);
$listingType = mysqli_real_escape_string($conn, $_POST['listingType']);

// Dummy seller ID since the login or sign up has not been implemented for now :(
$seller_id = 'u1';


$status = 'pending_approval';


$image = $_FILES['image']['name'];
$tempname = $_FILES['image']['tmp_name'];
$upload_dir = __DIR__ . '../uploads/';
$folder = $upload_dir . basename($image);
$folder = __DIR__ . '../uploads/' . basename($image);
$relative_path = 'uploads/' . basename($image);


// Insert data into the 'item' table
$sql = "INSERT INTO item (title, description, category_type, status, created_date, item_type, seller_id)
        VALUES ('$title', '$description', '$category', '$status', NOW(), '$listingType', '$seller_id')";

if ($conn->query($sql) === TRUE) {
    $item_id = $conn->insert_id;

    if (move_uploaded_file($tempname, $folder)) {
        $sql_img = "INSERT INTO itemimage (image_path, item_id) VALUES ('$folder', '$item_id')";
        if ($conn->query($sql_img) === TRUE) {
            echo '<p>Listing created successfully! Item ID: ' . $item_id . '</p>';
        } else {
            echo '<p>Item saved, but image insert failed: ' . $conn->error . '</p>';
        }
    } else {
        echo '<p>Item saved, but error uploading image.</p>';
    }
} else {
    echo '<p>Error creating item: ' . $conn->error . '</p>';
}

$conn->close();
?>
