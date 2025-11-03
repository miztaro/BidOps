<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db/connection.php';

$sql = "SELECT it.item_id, it.title, it.description, it.category_type, it.status, it.created_date, it.item_type, it.seller_id,
               bi.starting_price, bi.start_date, bi.end_date,
               img.image_path
        FROM item it
        LEFT JOIN biditem bi ON it.item_id = bi.item_id
        LEFT JOIN itemimage img ON it.item_id = img.item_id
        WHERE it.status = 'pending_approval'";

$result = $conn->query($sql);

$items = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()){
        $items[] = $row;
    }
}

echo json_encode($items);
$conn->close();
?>
