<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    // Return a 401 Unauthorized status
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

    // Query to fetch ALL items (bid and swap) listed by the user, and determine the correct status.
    $query = "
        SELECT 
            i.item_id AS id,
            i.title,
            i.description,
            i.category_type AS category,
            i.item_type AS mode,
            i.created_date AS date_listed,
            
            -- FIX: Use CASE statement to calculate the correct status based on item type and end date
            CASE
                -- Check for ended auctions
                WHEN i.item_type = 'bid' AND bi.end_date < NOW() THEN 'Ended'
                
                -- Check for items that are officially sold (requires logic to check transactionreceipt, but we use the simpler item.status for now)
                WHEN i.status = 'sold' THEN 'Sold'
                
                -- Display pending approval/rejected statuses
                WHEN i.status = 'pending_approval' THEN 'Pending'
                WHEN i.status = 'approval_rejected' THEN 'Rejected'

                -- Default to Active if none of the above
                ELSE 'Active'
            END AS status,
            
            -- We use GROUP_CONCAT to fetch all images for the item
            GROUP_CONCAT(ii.image_path) AS image_paths,
            bi.end_date -- Include end_date for potential client-side use
            
        FROM item i
        LEFT JOIN biditem bi ON i.item_id = bi.item_id  -- Join biditem to check end_date
        LEFT JOIN itemimage ii ON i.item_id = ii.item_id
        WHERE i.seller_id = ? 
        GROUP BY i.item_id -- Group by item_id to correctly aggregate images
        ORDER BY i.created_date DESC
    ";

    $stmt = $db->prepare($query);
    // Note: The seller_id is a string (u10, u1, etc.), so the bind type should be 's' (string) not 'i' (integer)
    $stmt->bind_param("s", $user_id); 
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    while ($row = $result->fetch_assoc()) {
        
        // Process images (using the aggregated paths)
        $image_paths = !empty($row['image_paths']) ? explode(',', $row['image_paths']) : [];
        
        // Determine the main image path for the client
        if (!empty($image_paths[0])) {
            // Assuming your client expects a path relative to the root/server/item
            $row['image'] = '../server/item/' . trim($image_paths[0]); 
        } else {
            $row['image'] = '../assets/images/default-item.jpg';
        }

        
        $row['status'] = ucfirst($row['status']); 
        
        // Remove the internal image_paths column before sending
        unset($row['image_paths']);

        $items[] = $row;
    }

    echo json_encode([
        'success' => true,
        'items' => $items
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching user listings: ' . $e->getMessage()
    ]);
}
?>