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

    /* -----------------------------
        FETCH SWAP ITEM DETAILS
    ------------------------------*/
    $query = "
        SELECT 
            i.item_id,
            i.title,
            i.description,
            i.category_type,
            i.status,
            i.created_date,
            i.item_type,
            i.seller_id,
            u.username as seller_name,  /* <--- Fetching from USER table */
            u.email as seller_email     /* <--- Fetching from USER table */
        FROM item i
        JOIN user u ON i.seller_id = u.user_id  /* <--- FIX: Joined with the USER table */
        WHERE i.item_id = ? AND i.item_type = 'swap'
    ";

    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $item = $result->fetch_assoc();

    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Swap item not found or is not a swap item.']);
        exit;
    }

    /* -----------------------------
        FETCH ITEM IMAGES
    ------------------------------*/
    $imageQuery = "SELECT image_path FROM itemimage WHERE item_id = ? ORDER BY image_id";
    $imageStmt = $db->prepare($imageQuery);
    $imageStmt->bind_param("i", $item_id);
    $imageStmt->execute();
    $images = $imageStmt->get_result()->fetch_all(MYSQLI_ASSOC);

    /* -----------------------------
        RETURN RESPONSE
    ------------------------------*/
    echo json_encode([
        'success' => true,
        'item' => $item,
        'images' => $images
    ]);

} catch (Exception $e) {
    // Send a proper 500 error code
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>