<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

include_once '../config/database.php';

if (!isset($_GET['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Item ID is required']);
    exit;
}

$item_id = $_GET['item_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

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
                u.email as seller_email
              FROM ITEM i
              JOIN USER u ON i.seller_id = u.user_id
              WHERE i.item_id = :item_id AND i.item_type = 'swap'";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':item_id', $item_id);
    $stmt->execute();

    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Swap item not found']);
        exit;
    }

    $imageQuery = "SELECT image_path FROM ITEMIMAGE WHERE item_id = :item_id";
    $imageStmt = $db->prepare($imageQuery);
    $imageStmt->bindParam(':item_id', $item_id);
    $imageStmt->execute();
    
    $images = $imageStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'item' => $item,
        'images' => $images
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>