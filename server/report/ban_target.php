<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['report_id']) || !isset($data['target_id']) || !isset($data['target_type'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit;
}

$report_id = $data['report_id'];
$target_id = $data['target_id'];
$target_type = $data['target_type']; // 'item' or 'user'

try {
    $database = new Database();
    $db = $database->getConnection();

    $db->begin_transaction();

    if ($target_type === 'item') {
        // Ban the item by updating its status
        $stmt = $db->prepare("UPDATE item SET status = 'banned' WHERE item_id = ?");
        $stmt->bind_param("s", $target_id);
        $stmt->execute();

        // Get the seller_id and ban them too
        $stmt = $db->prepare("SELECT seller_id FROM item WHERE item_id = ?");
        $stmt->bind_param("s", $target_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result && isset($result['seller_id'])) {
            // Ban the seller (add is_banned column if it doesn't exist)
            $stmt = $db->prepare("UPDATE user SET is_banned = 1 WHERE user_id = ?");
            $stmt->bind_param("s", $result['seller_id']);
            $stmt->execute();
        }
    } elseif ($target_type === 'user') {
        // Ban the user
        $stmt = $db->prepare("UPDATE user SET is_banned = 1 WHERE user_id = ?");
        $stmt->bind_param("s", $target_id);
        $stmt->execute();

        // Ban all their items
        $stmt = $db->prepare("UPDATE item SET status = 'banned' WHERE seller_id = ?");
        $stmt->bind_param("s", $target_id);
        $stmt->execute();
    }

    // Mark report as resolved
    $stmt = $db->prepare("UPDATE report SET status = 'resolved' WHERE report_id = ?");
    $stmt->bind_param("i", $report_id);
    $stmt->execute();

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Target banned successfully'
    ]);

} catch (Exception $e) {
    $db->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>