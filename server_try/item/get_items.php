<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once "../config/database.php";

$database = new Database();
$db = $database->getConnection();

$category = $_GET['category'] ?? '';
$item_type = $_GET['item_type'] ?? '';

$query = "SELECT 
            i.item_id,
            i.title,
            i.description,
            i.category_type,
            i.status,
            i.created_date,
            i.item_type,
            i.seller_id,
            u.username AS seller_name,
            ii.image_path
          FROM ITEM i
          JOIN USER u ON i.seller_id = u.user_id
          LEFT JOIN ITEMIMAGE ii ON i.item_id = ii.item_id
          WHERE i.status IN ('active', 'sold', 'pending_approval')";

$params = [];

if ($category !== "" && $category !== "All Programs") {
    $query .= " AND i.category_type = :category";
    $params[':category'] = $category;
}

if ($item_type !== "") {
    $query .= " AND i.item_type = :item_type";
    $params[':item_type'] = $item_type;
}

$query .= " ORDER BY i.created_date DESC";

$stmt = $db->prepare($query);

foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}

$stmt->execute();

$items = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $starting_price = 0;
    $end_date = null;
    $bid_count = 0;

    if ($row['item_type'] === 'bid') {
        $b = $db->prepare("SELECT starting_price, end_date FROM BIDITEM WHERE item_id = :id");
        $b->bindParam(":id", $row['item_id']);
        $b->execute();
        if ($bd = $b->fetch(PDO::FETCH_ASSOC)) {
            $starting_price = $bd['starting_price'];
            $end_date = $bd['end_date'];
        }

        $c = $db->prepare("SELECT COUNT(*) AS bid_count FROM BIDOFFER WHERE item_id = :id AND bid_status IN ('active','pending')");
        $c->bindParam(":id", $row['item_id']);
        $c->execute();
        if ($cd = $c->fetch(PDO::FETCH_ASSOC)) {
            $bid_count = $cd['bid_count'];
        }
    }

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

echo json_encode(["items" => $items]);
exit;
