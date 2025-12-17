<?php
header('Content-Type: application/json');

if (!isset($_GET['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'user_id is required']);
    exit;
}

$seller_id = $_GET['user_id'];

include_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // All non-deleted listings for this seller (you can tweak statuses)
    $sql = "
        SELECT 
            i.item_id,
            i.title,
            i.description,
            i.category_type,
            i.status,
            i.item_type,
            i.created_date
        FROM item i
        WHERE i.seller_id = ?
        ORDER BY 
            CASE i.status
                WHEN 'active' THEN 1
                WHEN 'pending_approval' THEN 2
                WHEN 'sold' THEN 3
                WHEN 'approval_rejected' THEN 4
                ELSE 5
            END,
            i.created_date DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $seller_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'items'   => $items
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching listings: ' . $e->getMessage()
    ]);
    exit;
}
