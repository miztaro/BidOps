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

if (!isset($data['bid_id']) || !isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Bid ID and action are required']);
    exit;
}

$bid_id = $data['bid_id'];
$action = $data['action']; // 'accept' or 'decline'

try {
    $database = new Database();
    $db = $database->getConnection();

    // Start transaction
    $db->begin_transaction();

    // Fetch the bid details
    $stmt = $db->prepare("
        SELECT bo.*, i.item_id, i.title, i.seller_id
        FROM bidoffer bo
        INNER JOIN item i ON bo.item_id = i.item_id
        WHERE bo.bid_id = ?
    ");
    $stmt->bind_param("i", $bid_id);
    $stmt->execute();
    $bid = $stmt->get_result()->fetch_assoc();

    if (!$bid) {
        throw new Exception('Bid not found');
    }

    if ($action === 'accept') {
        /* -----------------------------
            ACCEPT BID
        ------------------------------*/

        // Update bid status to 'accepted'
        $stmt = $db->prepare("UPDATE bidoffer SET bid_status = 'accepted' WHERE bid_id = ?");
        $stmt->bind_param("i", $bid_id);
        $stmt->execute();

        // Decline all other bids for this item
        $stmt = $db->prepare("
            UPDATE bidoffer 
            SET bid_status = 'declined' 
            WHERE item_id = ? AND bid_id != ? AND bid_status = 'active'
        ");
        $stmt->bind_param("ii", $bid['item_id'], $bid_id);
        $stmt->execute();

        // Update item status to 'sold'
        $stmt = $db->prepare("UPDATE item SET status = 'sold' WHERE item_id = ?");
        $stmt->bind_param("i", $bid['item_id']);
        $stmt->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Bid accepted successfully',
            'action' => 'accept'
        ]);

    } elseif ($action === 'decline') {
        /* -----------------------------
            DECLINE BID
        ------------------------------*/

        // Update bid status to 'declined'
        $stmt = $db->prepare("UPDATE bidoffer SET bid_status = 'declined' WHERE bid_id = ?");
        $stmt->bind_param("i", $bid_id);
        $stmt->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Bid declined successfully',
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