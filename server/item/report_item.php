<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../config/database.php'; 

// 1. Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to report an item.']);
    exit;
}

$reporter_id = $_SESSION['user_id'];

// 2. Get the JSON data from the fetch request
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['item_id']) || !isset($data['reason'])) {
    echo json_encode(['success' => false, 'message' => 'Item ID and reason are required.']);
    exit;
}

$item_id = $data['item_id'];
$reason = trim($data['reason']);

try {
    $database = new Database();
    $db = $database->getConnection();

    // 3. Find who the seller is for this specific item
    // We do this because your report table tracks "Reported User ID"
    $stmt = $db->prepare("SELECT seller_id FROM item WHERE item_id = ?");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$result) {
        throw new Exception('Item not found.');
    }

    $reported_id = $result['seller_id'];

    // Prevent users from reporting themselves
    if ($reporter_id === $reported_id) {
        throw new Exception('You cannot report your own item.');
    }

    // 4. Insert the report into the database
    // Note: status defaults to 'pending' in your SQL schema
    $stmt = $db->prepare("
        INSERT INTO report (reporter_id, reported_id, reason, created_at) 
        VALUES (?, ?, ?, NOW())
    ");
    
    $stmt->bind_param("sss", $reporter_id, $reported_id, $reason);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true, 
            'message' => 'Report submitted successfully. Our team will review it.'
        ]);
    } else {
        throw new Exception('Failed to save report to database.');
    }
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($db)) $db->close();
}
?>