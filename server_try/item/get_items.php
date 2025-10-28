<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:8000");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:8000");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $item_type = isset($_GET['item_type']) ? $_GET['item_type'] : '';

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
              WHERE i.status IN ('active', 'pending_approval')";

    $params = [];
    if(!empty($category) && $category != 'All Programs') {
        $query .= " AND i.category_type = :category";
        $params[':category'] = $category;
    }

    if(!empty($item_type)) {
        $query .= " AND i.item_type = :item_type";
        $params[':item_type'] = $item_type;
    }

    $query .= " ORDER BY i.created_date DESC";

    $stmt = $db->prepare($query);
    
    foreach($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->execute();
    
    $items = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        
        $starting_price = 0;
        $end_date = null;
        $bid_count = 0;
        
        if ($row['item_type'] === 'bid') {
            $bidQuery = "SELECT starting_price, end_date FROM BIDITEM WHERE item_id = :item_id";
            $bidStmt = $db->prepare($bidQuery);
            $bidStmt->bindParam(":item_id", $row['item_id']);
            $bidStmt->execute();
            
            if ($bidData = $bidStmt->fetch(PDO::FETCH_ASSOC)) {
                $starting_price = $bidData['starting_price'];
                $end_date = $bidData['end_date'];
            }
            
            $countQuery = "SELECT COUNT(*) as bid_count FROM BIDOFFER WHERE item_id = :item_id AND bid_status IN ('active', 'pending')";
            $countStmt = $db->prepare($countQuery);
            $countStmt->bindParam(":item_id", $row['item_id']);
            $countStmt->execute();
            
            if ($countData = $countStmt->fetch(PDO::FETCH_ASSOC)) {
                $bid_count = $countData['bid_count'];
            }
        }
        
        $items[] = array(
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
        );
    }

    http_response_code(200);
    echo json_encode(array("items" => $items));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error retrieving items: " . $e->getMessage()));
}
?>