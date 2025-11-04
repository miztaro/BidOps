<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once "../config/database.php";

$database = new Database();
$db = $database->getConnection();

$q = $_GET['q'] ?? '';
$searchTerm = "%$q%";


$stmtBid = $db->prepare("
    SELECT i.item_id, i.title, i.description, i.category_type, i.status, i.item_type, i.seller_id, u.username AS seller_name, ii.image_path,
           b.starting_price, b.end_date
    FROM ITEM i
    JOIN USER u ON i.seller_id = u.user_id
    JOIN BIDITEM b ON i.item_id = b.item_id
    LEFT JOIN ITEMIMAGE ii ON i.item_id = ii.item_id
    WHERE (i.title LIKE :search OR i.description LIKE :search)
      AND i.item_type = 'bid'
      AND i.status IN ('active','sold','pending_approval')
");
$stmtBid->bindValue(":search", $searchTerm);
$stmtBid->execute();

$bidItems = [];

while ($row = $stmtBid->fetch(PDO::FETCH_ASSOC)) {
    // Get bid count
    $bidCountStmt = $db->prepare("
        SELECT COUNT(*) AS bid_count 
        FROM BIDOFFER 
        WHERE item_id = :id AND bid_status IN ('active','pending')
    ");
    $bidCountStmt->bindParam(":id", $row['item_id']);
    $bidCountStmt->execute();
    $bidCount = $bidCountStmt->fetch(PDO::FETCH_ASSOC)['bid_count'] ?? 0;

    $bidItems[] = [
        "item_id" => $row['item_id'],
        "title" => $row['title'],
        "description" => $row['description'],
        "category_type" => $row['category_type'],
        "status" => $row['status'],
        "item_type" => $row['item_type'],
        "seller_id" => $row['seller_id'],
        "seller_name" => $row['seller_name'],
        "starting_price" => $row['starting_price'],
        "end_date" => $row['end_date'],
        "bid_count" => (int)$bidCount,
        "image_path" => $row['image_path']
    ];
}


$stmtSwap = $db->prepare("
    SELECT i.item_id, i.title, i.description, i.category_type, i.status, i.item_type, i.seller_id, u.username AS seller_name, ii.image_path
    FROM ITEM i
    JOIN USER u ON i.seller_id = u.user_id
    JOIN SWAPITEM s ON i.item_id = s.item_id
    LEFT JOIN ITEMIMAGE ii ON i.item_id = ii.item_id
    WHERE (i.title LIKE :search OR i.description LIKE :search)
      AND i.item_type = 'swap'
      AND i.status IN ('active','sold','pending_approval')
");
$stmtSwap->bindValue(":search", $searchTerm);
$stmtSwap->execute();

$swapItems = [];

while ($row = $stmtSwap->fetch(PDO::FETCH_ASSOC)) {
    $swapItems[] = [
        "item_id" => $row['item_id'],
        "title" => $row['title'],
        "description" => $row['description'],
        "category_type" => $row['category_type'],
        "status" => $row['status'],
        "item_type" => $row['item_type'],
        "seller_id" => $row['seller_id'],
        "seller_name" => $row['seller_name'],
        "image_path" => $row['image_path']
    ];
}


echo json_encode([
    "success" => true,
    "query" => $q,
    "bid_items" => $bidItems,
    "swap_items" => $swapItems,
    "total_bid" => count($bidItems),
    "total_swap" => count($swapItems)
]);
exit;
