<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include '../config/db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("
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
    ");
    
    $stmt->execute([$user_id]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert image paths to full URLs
    foreach ($items as &$item) {
        if ($item['image']) {
            $item['image'] = '../server/item/' . $item['image'];
        } else {
            $item['image'] = '../assets/images/default-item.jpg';
        }
    }
    
    echo json_encode([
        'success' => true,
        'items' => $items
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>