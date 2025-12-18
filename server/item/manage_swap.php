<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

if (!isset($data['swap_id']) || !isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Swap ID and action are required']);
    exit;
}

$swap_id = $data['swap_id'];
$action = $data['action']; // 'accept' or 'decline'
$current_user_id = $_SESSION['user_id'];

$database = new Database();
$db = $database->getConnection();

try {
    // Start transaction for atomic updates
    $db->begin_transaction();

    // Fetch the swap offer details, including the seller's ID for authorization
    // NOTE: Using requested_item_id and offered_item_id for consistency.
    $stmt = $db->prepare("
        SELECT 
            so.requested_item_id, 
            so.offered_item_id, 
            i.seller_id
        FROM swapoffer so
        INNER JOIN item i ON so.requested_item_id = i.item_id
        WHERE so.swap_id = ?
    ");
    $stmt->bind_param("i", $swap_id);
    $stmt->execute();
    $swap = $stmt->get_result()->fetch_assoc();

    if (!$swap) {
        throw new Exception('Swap offer not found');
    }

    // --- AUTHORIZATION CHECK (CRUCIAL FIX) ---
    if ($swap['seller_id'] != $current_user_id) {
        $db->rollback();
        echo json_encode(['success' => false, 'message' => 'Forbidden: You are not the seller of this item.']);
        exit;
    }
    // --- END AUTHORIZATION CHECK ---

    $requested_item_id = $swap['requested_item_id']; // The item the seller listed
    $offered_item_id = $swap['offered_item_id'];     // The item the buyer offered

    if ($action === 'accept') {
        /* -----------------------------
            ACCEPT SWAP: 4 DATABASE ACTIONS
        ------------------------------*/

        // 1. Update accepted swap status to 'completed'
        $stmt = $db->prepare("UPDATE swapoffer SET swap_status = 'completed' WHERE swap_id = ?");
        $stmt->bind_param("i", $swap_id);
        $stmt->execute();
        $stmt->close();

        // 2. Decline all other PENDING swap offers for the requested item
        $stmt = $db->prepare("
            UPDATE swapoffer 
            SET swap_status = 'lost' 
            WHERE requested_item_id = ? AND swap_id != ? AND swap_status = 'pending'
        ");
        $stmt->bind_param("ii", $requested_item_id, $swap_id);
        $stmt->execute();
        $stmt->close();

        // 3. Mark the seller's original item as 'swapped'
        $stmt = $db->prepare("UPDATE item SET status = 'swapped' WHERE item_id = ?");
        $stmt->bind_param("i", $requested_item_id);
        $stmt->execute();
        $stmt->close();
        
        // 4. Mark the buyer's offered item as 'swapped' 
        // This prevents the buyer from offering the item again.
        $stmt = $db->prepare("UPDATE item SET status = 'swapped' WHERE item_id = ?");
        $stmt->bind_param("i", $offered_item_id);
        $stmt->execute();
        $stmt->close();

        $stmt = $db->prepare("SELECT user_id FROM swapoffer WHERE swap_id = ?");
        $stmt->bind_param("s", $swap_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $buyer_id = $result['user_id']; // this is the actual buyer
        $stmt->close();

        $seller_id = $current_user_id;

        // 5. INSERT into transactionreceipt so it shows up in transactions
        $stmt = $db->prepare("
            INSERT INTO transactionreceipt 
            (status, completed_at, item_id, buyer_id, seller_id, swap_id)
            VALUES ('successful', NOW(), ?, ?, ?, ?)
        ");
        $stmt->bind_param("issi",
            $requested_item_id,  // item_id
            $buyer_id,           // buyer_id from swapoffer
            $seller_id,          // seller_id = current user
            $swap_id
        );

        if (!$stmt->execute()) {
            throw new Exception("Failed to record transaction receipt: " . $db->error);
        }

        $db->commit();
        echo json_encode([
            'success' => true,
            'message' => 'Swap accepted! Both items are marked as swapped.',
            'action' => 'accept',
            'requested_item_id' => $requested_item_id,
            'offered_item_id' => $offered_item_id
        ]);

    } elseif ($action === 'decline') {
        /* -----------------------------
            DECLINE SWAP
        ------------------------------*/

        // Update the specific swap status to 'declined' (not cancelled, to distinguish)
        $stmt = $db->prepare("UPDATE swapoffer SET swap_status = 'lost' WHERE swap_id = ?");
        $stmt->bind_param("i", $swap_id);
        $stmt->execute();

        // If this was the only pending offer, the requested item stays active.

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Swap offer declined successfully',
            'action' => 'decline'
        ]);

    } else {
        throw new Exception('Invalid action specified');
    }

} catch (Exception $e) {
    $db->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($db)) $db->close();
}
?>