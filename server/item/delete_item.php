<?php
session_start();

// Set headers for CORS and JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true'); 

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Debug: Log session info 
error_log('Session role: ' . (isset($_SESSION['role']) ? $_SESSION['role'] : 'not set'));
error_log('Session user_id: ' . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'not set'));

// Check if user is admin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized access. Admin only.',
        'session_role' => isset($_SESSION['role']) ? $_SESSION['role'] : 'not set',
        'debug' => 'Check if you are logged in as admin'
    ]);
    exit;
}

// Get the input data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    $data = $_POST;
}

$item_id = isset($data['item_id']) ? intval($data['item_id']) : 0;
$delete_type = isset($data['delete_type']) ? $data['delete_type'] : '';

if ($item_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid item ID.']);
    exit;
}

// Include db
include_once '../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $conn->begin_transaction();
    
    $stmt = $conn->prepare("SELECT item_type, seller_id FROM item WHERE item_id = ?");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Item not found.");
    }
    
    $item = $result->fetch_assoc();
    $item_type = $item['item_type'];
    
    // Verify delete type matches item type
    if ($delete_type && $delete_type !== $item_type) {
        throw new Exception("Item type mismatch.");
    }
    
    // Delete from specific tables 
    if ($item_type === 'bid') {
        $stmt = $conn->prepare("DELETE FROM bidoffer WHERE item_id = ?");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        
        $stmt = $conn->prepare("DELETE FROM biditem WHERE item_id = ?");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
    } 
    else if ($item_type === 'swap') {
        $stmt = $conn->prepare("DELETE FROM swapoffer WHERE item_id = ?");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
    }
    
    // Delete
    $stmt = $conn->prepare("DELETE FROM itemimage WHERE item_id = ?");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    
    $stmt = $conn->prepare("DELETE FROM item WHERE item_id = ?");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Item deleted successfully.'
    ]);
    
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting item: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>