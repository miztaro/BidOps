<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once dirname(__DIR__) . '/db/connection.php';

$title = mysqli_real_escape_string($conn, $_POST['title']);
$category = mysqli_real_escape_string($conn, $_POST['category']);
$description = mysqli_real_escape_string($conn, $_POST['description']);
$listingType = mysqli_real_escape_string($conn, $_POST['listingType']);
$seller_id = 'u1';
$status = 'pending_approval';

$image = $_FILES['image']['name'];
$tempname = $_FILES['image']['tmp_name'];

$folder = __DIR__ . '/../uploads/' . basename($image);
$relative_path = 'server/uploads/' . basename($image);


$sql = "INSERT INTO item (title, description, category_type, status, created_date, item_type, seller_id)
        VALUES ('$title', '$description', '$category', '$status', NOW(), '$listingType', '$seller_id')";

if ($conn->query($sql) === TRUE) {
    $item_id = $conn->insert_id;

    if (move_uploaded_file($tempname, $folder)) {
        $sql_img = "INSERT INTO itemimage (image_path, item_id) VALUES ('$relative_path', '$item_id')";
        $conn->query($sql_img);
        echo '<p>Listing created successfully! Item ID: ' . $item_id . '</p>';
    } else {
        echo '<p>Item saved, but image upload failed.</p>';
    }
} else {
    echo 'SQL Error: ' . $conn->error;
}

$conn->close();
?>
