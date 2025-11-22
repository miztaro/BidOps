<?php
// Show all errors (useful for debugging)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Handle CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database connection
include_once '../config/database.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

try {
    // Optional filters from query params
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $item_type = isset($_GET['item_type']) ? $_GET['item_type'] : '';

    // Base query
    $query = "SELECT 
                i.item_id,
                i.title,
                i.description,
                i.category_type,
                i.status,
                i.created_date,
                i.item_type,
                i.seller_id,
                u.username as seller_name,
                ii.image_path
              FROM ITEM i
              JOIN USER u ON i.seller_id = u.user_id
              LEFT JOIN ITEMIMAGE ii ON i.item_id = ii.item_id
              WHERE i.status IN ('active')";

    $params = [];
    $types = '';

    if (!empty($category) && $category != 'All Programs') {
        $query .= " AND i.category_type = ?";
        $params[] = $category;
        $types .= 's';
    }

    if (!empty($item_type)) {
        $query .= " AND i.item_type = ?";
        $params[] = $item_type;
        $types .= 's';
    }

    $query .= " ORDER BY i.created_date DESC";

    // Prepare and execute
    $stmt = $db->prepare($query);

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];

    while ($row = $result->fetch_assoc()) {
        $starting_price = 0;
        $end_date = null;
        $bid_count = 0;

        // If item is a bid, get more details
        if ($row['item_type'] === 'bid') {
            // Get bid details
            $bidQuery = "SELECT starting_price, end_date FROM BIDITEM WHERE item_id = ?";
            $bidStmt = $db->prepare($bidQuery);
            $bidStmt->bind_param('i', $row['item_id']);
            $bidStmt->execute();
            $bidResult = $bidStmt->get_result();
            if ($bidData = $bidResult->fetch_assoc()) {
                $starting_price = $bidData['starting_price'];
                $end_date = $bidData['end_date'];
            }

            // Count bids
            $countQuery = "SELECT COUNT(*) as bid_count FROM BIDOFFER 
                           WHERE item_id = ? AND bid_status IN ('active', 'pending')";
            $countStmt = $db->prepare($countQuery);
            $countStmt->bind_param('i', $row['item_id']);
            $countStmt->execute();
            $countResult = $countStmt->get_result();
            if ($countData = $countResult->fetch_assoc()) {
                $bid_count = $countData['bid_count'];
            }
        }

        // Add item to array
        $items[] = [
            "item_id" => $row['item_id'],
            "title" => $row['title'],
            "description" => $row['description'],
            "category_type" => $row['category_type'],
            "status" => $row['status'],
            "created_date" => $row['created_date'],
            "item_type" => $row['item_type'],
            "seller_id" => $row['seller_id'],
            "seller_name" => $row['seller_name'],
            "starting_price" => $starting_price,
            "image_path" => $row['image_path'],
            "end_date" => $end_date,
            "bid_count" => $bid_count
        ];
    }

    // Return JSON response
    http_response_code(200);
    echo json_encode(["items" => $items]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error retrieving items: " . $e->getMessage()]);
}
?>
