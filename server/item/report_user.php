<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Adjusted path to match your other working files
include_once '../config/database.php';

// --- AUTHENTICATION CHECK ---
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized: User not logged in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['item_id']) || !isset($data['reason'])) {
    echo json_encode(['success' => false, 'message' => 'Item ID and reason are required']);
    exit;
}

$item_id = $data['item_id'];
$reason = $data['reason'];
$reporter_id = $_SESSION['user_id'];

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Find the seller of the item (the person being reported)
    $stmt = $db->prepare("SELECT seller_id FROM item WHERE item_id = ?");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$result) {
        throw new Exception('Item not found');
    }

    $reported_id = $result['seller_id'];

    // Prevent reporting yourself
    if ($reporter_id == $reported_id) {
        throw new Exception('You cannot report your own listing');
    }

    // 2. Insert the report into the database
    $stmt = $db->prepare("
        INSERT INTO report (reporter_id, reported_id, reason) 
        VALUES (?, ?, ?)
    ");
    
    $stmt->bind_param("sss", $reporter_id, $reported_id, $reason);

    if (!$stmt->execute()) {
        throw new Exception("Failed to submit report: " . $db->error);
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Report submitted successfully. We will review it shortly.'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($db)) $db->close();
}
?>