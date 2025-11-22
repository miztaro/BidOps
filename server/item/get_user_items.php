<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "
        SELECT 
            i.item_id as id,
            i.title,
            i.description,
            i.category_type as category,
            ii.image_path as image
        FROM item i
        LEFT JOIN itemimage ii ON i.item_id = ii.item_id
        WHERE i.seller_id = ? AND i.status = 'active' AND i.item_type = 'swap'
        ORDER BY i.created_date DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    while ($row = $result->fetch_assoc()) {
        if ($row['image']) {
            $row['image'] = '../server/item/' . $row['image'];
        } else {
            $row['image'] = '../assets/images/default-item.jpg';
        }
        $items[] = $row;
    }

    echo json_encode([
        'success' => true,
        'items' => $items
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
