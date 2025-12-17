<?php
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require '../config/database.php';
$database = new Database();
$conn = $database->getConnection();

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

// Validate ID
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo json_encode(["error" => "No valid item ID provided"]);
    exit;
}

$item_id = intval($_GET['id']);

// Fetch item
$stmt_item = $conn->prepare("SELECT * FROM item WHERE item_id = ? AND seller_id = ?");
$stmt_item->bind_param("is", $item_id, $user_id);
$stmt_item->execute();
$item_result = $stmt_item->get_result();
$item = $item_result->fetch_assoc();

if (!$item) {
    echo json_encode([
        'success' => false,
        'message' => 'Item not found or access denied'
    ]);
    exit;
}

// Fetch bid
$stmt_bid = $conn->prepare("SELECT * FROM biditem WHERE item_id=?");
$stmt_bid->bind_param("i", $item_id);
$stmt_bid->execute();
$bid_result = $stmt_bid->get_result();
$bid = $bid_result->fetch_assoc();

// Fetch images
$stmt_img = $conn->prepare("SELECT image_path FROM itemimage WHERE item_id=?");
$stmt_img->bind_param("i", $item_id);
$stmt_img->execute();
$img_result = $stmt_img->get_result();

$images = [];
while ($row = $img_result->fetch_assoc()) {
    $images[] = $row['image_path']; 
}

//Fetch Categories
$categories = [];
$cat_result = $conn->query("SELECT DISTINCT category_type FROM item ORDER BY category_type ASC");
while($row = $cat_result->fetch_assoc()){
    $categories[] = $row['category_type'];
}

// Return JSON
echo json_encode([
    "success"=> true,
    "item" => $item,
    "bid" => $bid ?: null,
    "images" => $images,
    "categories" => $categories
]);
exit;
?>
