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

if (!isset($data['swap_id']) || !isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Swap ID and action are required']);
    exit;
}

$swap_id = $data['swap_id'];
$action = $data['action']; // 'accept' or 'decline'

try {
    $database = new Database();
    $db = $database->getConnection();

    // Start transaction
    $db->begin_transaction();

    // Fetch the swap offer details
    $stmt = $db->prepare("
        SELECT so.*, i.item_id, i.title, i.seller_id
        FROM swapoffer so
        INNER JOIN item i ON so.item_id = i.item_id
        WHERE so.swap_id = ?
    ");
    $stmt->bind_param("i", $swap_id);
    $stmt->execute();
    $swap = $stmt->get_result()->fetch_assoc();

    if (!$swap) {
        throw new Exception('Swap offer not found');
    }

    if ($action === 'accept') {
        /* -----------------------------
            ACCEPT SWAP
        ------------------------------*/

        // Update swap status to 'completed'
        $stmt = $db->prepare("UPDATE swapoffer SET swap_status = 'completed' WHERE swap_id = ?");
        $stmt->bind_param("i", $swap_id);
        $stmt->execute();

        // Decline all other swap offers for this item
        $stmt = $db->prepare("
            UPDATE swapoffer 
            SET swap_status = 'cancelled' 
            WHERE item_id = ? AND swap_id != ? AND swap_status = 'pending'
        ");
        $stmt->bind_param("ii", $swap['item_id'], $swap_id);
        $stmt->execute();

        // Update item status to 'swapped'
        $stmt = $db->prepare("UPDATE item SET status = 'swapped' WHERE item_id = ?");
        $stmt->bind_param("i", $swap['item_id']);
        $stmt->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Swap accepted successfully! Item is now marked as swapped.',
            'action' => 'accept'
        ]);

    } elseif ($action === 'decline') {
        /* -----------------------------
            DECLINE SWAP
        ------------------------------*/

        // Update swap status to 'cancelled'
        $stmt = $db->prepare("UPDATE swapoffer SET swap_status = 'cancelled' WHERE swap_id = ?");
        $stmt->bind_param("i", $swap_id);
        $stmt->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Swap offer declined successfully',
            'action' => 'decline'
        ]);

    } else {
        throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    $db->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>