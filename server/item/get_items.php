<?php
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Add headers for CORS if needed, though often better handled by web server config
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");

include_once '../config/database.php';

// Create mysqli connection
$database = new Database();
$conn = $database->getConnection();

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

try {
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $item_type = isset($_GET['item_type']) ? $_GET['item_type'] : '';

    // --- OPTIMIZED MAIN QUERY: IMPLEMENTING THE AUCTION END DATE FILTER ---
    $query = "SELECT 
                i.item_id, i.title, i.description, i.category_type, i.status, 
                i.created_date, i.item_type, i.seller_id, 
                u.username AS seller_name,
                bi.starting_price,
                bi.end_date,
                COUNT(DISTINCT bo.bid_id) AS bid_count,
                GROUP_CONCAT(ii.image_path ORDER BY ii.image_id) AS image_paths
            FROM item i
            JOIN user u ON i.seller_id = u.user_id
            LEFT JOIN biditem bi ON i.item_id = bi.item_id 
            LEFT JOIN bidoffer bo ON i.item_id = bo.item_id AND bo.bid_status IN ('active','pending')
            LEFT JOIN itemimage ii ON i.item_id = ii.item_id
            WHERE i.status = 'active' 
              AND (
                i.item_type = 'swap' 
                OR 
                (
                    i.item_type = 'bid' 
                    -- CRITICAL FIX: Only show bid items where end_date is NOT NULL and is in the FUTURE
                    AND bi.end_date IS NOT NULL 
                    AND bi.end_date > NOW()
                )
              )";
    
    $types = '';
    $params = [];

    if (!empty($category) && $category != 'All Programs') {
        $query .= " AND i.category_type = ?";
        $types .= 's';
        $params[] = $category;
    }

    if (!empty($item_type)) {
        $query .= " AND i.item_type = ?";
        $types .= 's';
        $params[] = $item_type;
    }

    $query .= " GROUP BY i.item_id ORDER BY i.created_date DESC";
 
    $stmt = $conn->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    $category_counts = []; // New array to hold counts

    while ($row = $result->fetch_assoc()) {
        
        // Process images from GROUP_CONCAT
        $images = [];
        if (!empty($row['image_paths'])) {
            // Split the comma-separated string into an array of image paths
            $images = explode(',', $row['image_paths']);
        }
        
        // --- ADD CATEGORY COUNT LOGIC ---
        if (!isset($category_counts[$row['category_type']])) {
            $category_counts[$row['category_type']] = 0;
        }
        $category_counts[$row['category_type']]++;

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
            "starting_price" => $row['starting_price'] ?? 0, 
            "end_date" => $row['end_date'],
            "bid_count" => $row['bid_count'],
            "images" => $images
        ];
    }

    $stmt->close();
    
    // --- POPULATE CATEGORIES ARRAY FOR FRONTEND ---
    $categories = [];
    foreach ($category_counts as $name => $count) {
        $categories[] = [
            'name' => $name,
            'count' => $count
        ];
    }
    
    // --- RE-INTRODUCE LISTINGS LOGIC (For My Listings tab) ---
    $listings = [];
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    if($user_id){
        $listingQuery = "SELECT i.item_id, i.title, i.description, i.category_type, i.status, 
                              i.created_date, i.item_type, i.seller_id, 
                              u.username AS seller_name
                             FROM item i
                             JOIN user u ON i.seller_id = u.user_id
                             WHERE i.seller_id = ?
                             ORDER BY i.created_date DESC"; 
        $stmt2 = $conn->prepare($listingQuery);
        $stmt2->bind_param("s", $user_id);
        $stmt2->execute();
        $listingResult =$stmt2->get_result();

        while ($row = $listingResult->fetch_assoc()) {
            $listings[] = $row;
        }
        $stmt2->close();
    }

    // Return JSON
    echo json_encode([
        "items" => $items,
        "listings" => $listings,
        "categories" => $categories
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error retrieving items: " . $e->getMessage()]);
}

$conn->close();
?>