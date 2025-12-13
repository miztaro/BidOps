<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Revert to simple relative include path, which seems to prevent the crashing HTML error
include '../config/database.php'; 

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check for connection error immediately after attempting to connect
    if ($db->connect_error) {
        throw new Exception("Database Connection Failed: " . $db->connect_error);
    }
    
    // ... (REST OF THE SQL QUERY AND LOGIC REMAINS THE SAME AS THE LAST CORRECTED VERSION)
    // We will leave the rest of the file as you sent it last, assuming the SQL logic is now correct.
    
    $query = "
        SELECT 
            i.item_id AS id,
            i.title,
            i.description,
            i.category_type AS category,
            i.item_type AS mode,
            i.created_date AS date_listed,
            
            CASE
                WHEN i.item_type = 'bid' AND bi.end_date IS NOT NULL AND bi.end_date < NOW() THEN 'Ended'
                WHEN i.status = 'sold' THEN 'Sold'
                WHEN i.status = 'pending_approval' THEN 'Pending'
                WHEN i.status = 'approval_rejected' THEN 'Rejected'
                ELSE i.status
            END AS status_display_name,
            
            GROUP_CONCAT(ii.image_path) AS image_paths
            
        FROM item i
        JOIN user u ON i.seller_id = u.user_id
        LEFT JOIN biditem bi ON i.item_id = bi.item_id  
        LEFT JOIN itemimage ii ON i.item_id = ii.item_id
        WHERE i.seller_id = ? 
        GROUP BY i.item_id 
        ORDER BY i.created_date DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bind_param("s", $user_id); 
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    while ($row = $result->fetch_assoc()) {
        
        $image_paths = !empty($row['image_paths']) ? explode(',', $row['image_paths']) : [];
        $row['image'] = !empty($image_paths[0]) ? '../server/item/' . trim($image_paths[0]) : '../assets/images/default-item.jpg';
        
        $row['status'] = $row['status_display_name']; 
        unset($row['image_paths']);
        unset($row['status_display_name']); 

        $items[] = $row;
    }

    echo json_encode([
        'success' => true,
        'items' => $items
    ]);

} catch (Exception $e) {
    // If connection fails, return a clean JSON error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching user listings: ' . $e->getMessage()
    ]);
}
?>