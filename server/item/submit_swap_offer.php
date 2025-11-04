<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include '../config/database.php';

// using Alice as the offerer (u1)
$offerer_id = 'u1';

$item_id = $_POST['item_id'] ?? null;
$offered_item_title = $_POST['offered_item_title'] ?? null;
$offered_item_description = $_POST['offered_item_description'] ?? null;
$offered_item_category = $_POST['offered_item_category'] ?? null;
$message = $_POST['message'] ?? '';

if (!$item_id || !$offered_item_title || !$offered_item_description || !$offered_item_category) {
    echo json_encode(['success' => false, 'message' => 'All item details are required']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $stmt = $db->prepare("
        SELECT i.*, u.username as seller_name 
        FROM ITEM i 
        JOIN USER u ON i.seller_id = u.user_id 
        WHERE i.item_id = ? AND i.item_type = 'swap' AND i.status = 'active'
    ");
    $stmt->execute([$item_id]);
    $target_item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$target_item) {
        echo json_encode(['success' => false, 'message' => 'Swap item not found or not available']);
        exit;
    }
    
    $new_item_id = insertNewItem($db, $offerer_id, $offered_item_title, $offered_item_description, $offered_item_category);
    
    if (isset($_FILES['item_image']) && $_FILES['item_image']['error'] === UPLOAD_ERR_OK) {
        $image_path = uploadItemImage($_FILES['item_image'], $new_item_id);
        if ($image_path) {
            $stmt = $db->prepare("INSERT INTO ITEMIMAGE (image_path, item_id) VALUES (?, ?)");
            $stmt->execute([$image_path, $new_item_id]);
        }
    }
    
    $swap_id = 'SWAP_' . uniqid();
    $stmt = $db->prepare("
        INSERT INTO swapoffer (swap_id, item_id, user_id, swap_status, created_at)
        VALUES (?, ?, ?, 'pending', NOW())
    ");
    
    $stmt->execute([$swap_id, $item_id, $offerer_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Swap offer submitted successfully!',
        'swap_id' => $swap_id,
        'new_item_id' => $new_item_id
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

function insertNewItem($db, $user_id, $title, $description, $category) {
    $stmt = $db->query("SELECT MAX(item_id) as max_id FROM ITEM");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $new_item_id = intval($result['max_id']) + 1;
    
    $stmt = $db->prepare("
        INSERT INTO ITEM (item_id, title, description, category_type, status, item_type, seller_id)
        VALUES (?, ?, ?, ?, 'active', 'swap', ?)
    ");
    
    $stmt->execute([$new_item_id, $title, $description, $category, $user_id]);
    
    $stmt = $db->prepare("INSERT INTO swapitem (item_id) VALUES (?)");
    $stmt->execute([$new_item_id]);
    
    return $new_item_id;
}

function uploadItemImage($file, $item_id) {
    $upload_dir = "uploads/";
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $file_extension = pathinfo($file["name"], PATHINFO_EXTENSION);
    $filename = "swap_item_" . $item_id . "_" . uniqid() . "." . $file_extension;
    $target_file = $upload_dir . $filename;

    $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array(strtolower($file_extension), $allowed_types)) {
        return null;
    }

    if ($file["size"] > 5 * 1024 * 1024) {
        return null;
    }

    if (move_uploaded_file($file["tmp_name"], $target_file)) {
        return $target_file;
    }

    return null;
}
?>