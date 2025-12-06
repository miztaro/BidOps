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

if (!isset($data['report_id'])) {
    echo json_encode(['success' => false, 'message' => 'Report ID is required']);
    exit;
}

$report_id = $data['report_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

    // Mark report as rejected (dismissed)
    $stmt = $db->prepare("UPDATE report SET status = 'rejected' WHERE report_id = ?");
    $stmt->bind_param("i", $report_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Report dismissed successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Report not found'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>