<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Fetch all reports
    $query = "
        SELECT 
            r.report_id,
            r.reporter_id,
            r.reported_id,
            r.reason as description,
            r.status,
            r.created_at,
            reporter.username as reporter_username,
            reporter.email as reporter_email
        FROM report r
        LEFT JOIN user reporter ON r.reporter_id = reporter.user_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $reports = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // For each report, determine if it's a user or item report
    foreach ($reports as &$report) {
        $reported_id = $report['reported_id'];
        
        // Try to find if reported_id is a user
        $stmt = $db->prepare("SELECT user_id, username, email FROM user WHERE user_id = ?");
        $stmt->bind_param("s", $reported_id);
        $stmt->execute();
        $user_result = $stmt->get_result()->fetch_assoc();
        
        if ($user_result) {
            // It's a user report
            $report['reported_user_id'] = $user_result['user_id'];
            $report['reported_username'] = '@' . $user_result['username'];
            $report['reported_user_email'] = $user_result['email'];
            $report['report_type'] = 'user';
        } else {
            // Try to find if it's an item
            $stmt = $db->prepare("SELECT item_id, title, category_type, seller_id FROM item WHERE item_id = ?");
            $stmt->bind_param("s", $reported_id);
            $stmt->execute();
            $item_result = $stmt->get_result()->fetch_assoc();
            
            if ($item_result) {
                // It's an item report
                $report['reported_item_id'] = $item_result['item_id'];
                $report['item_title'] = $item_result['title'];
                $report['item_category'] = $item_result['category_type'];
                $report['seller_id'] = $item_result['seller_id'];
                $report['report_type'] = 'item';
            } else {
                // Unknown type
                $report['report_type'] = 'unknown';
            }
        }
    }

    echo json_encode([
        'success' => true,
        'reports' => $reports
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>