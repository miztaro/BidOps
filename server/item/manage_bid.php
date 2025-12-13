<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// The relative include path is usually the most reliable in XAMPP/local setups
include_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
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

    // Fetch the bid details (bo.bidder_id and i.seller_id are crucial)
    $stmt = $db->prepare("
        SELECT bo.bidder_id, i.item_id, i.title, i.seller_id
        FROM bidoffer bo
        INNER JOIN item i ON bo.item_id = i.item_id
        WHERE bo.bid_id = ?
    ");
    // Assuming bid_id is an integer (i)
    $stmt->bind_param("i", $bid_id);
    $stmt->execute();
    $bid = $stmt->get_result()->fetch_assoc();
    $stmt->close(); 

    if (!$bid) {
        throw new Exception('Bid not found.');
    }

    $item_id = $bid['item_id'];
    $seller_id = $bid['seller_id'];
    $buyer_id = $bid['bidder_id']; // The bidder is the buyer (Kate)

    if ($action === 'accept') {
        /* -----------------------------
            ACCEPT BID LOGIC
        ------------------------------*/

        // 1. Update bid status to 'accepted'
        $stmt = $db->prepare("UPDATE bidoffer SET bid_status = 'accepted' WHERE bid_id = ?");
        $stmt->bind_param("i", $bid_id);
        if (!$stmt->execute()) {
             throw new Exception("Failed to update accepted bid status.");
        }
        $stmt->close();

        // 2. Decline all other active bids for this item
        $stmt = $db->prepare("
            UPDATE bidoffer 
            SET bid_status = 'declined' 
            WHERE item_id = ? AND bid_id != ? AND bid_status = 'active'
        ");
        $stmt->bind_param("ii", $item_id, $bid_id);
        $stmt->execute();
        $stmt->close();

        // 3. Update item status to 'sold'
        $stmt = $db->prepare("UPDATE item SET status = 'sold' WHERE item_id = ?");
        $stmt->bind_param("i", $item_id);
        if (!$stmt->execute()) {
             throw new Exception("Failed to update item status to sold.");
        }
        $stmt->close();
        
        // 4. CRITICAL FIX: Insert transaction receipt (No 'item_type' column)
        $transactionId = 'tr' . uniqid(); 
        
        // Removed 'item_type' field and placeholder from the query
        $stmt = $db->prepare("
            INSERT INTO transactionreceipt 
            (transaction_id, status, completed_at, item_id, buyer_id, seller_id, bid_id) 
            VALUES (?, 'successful', NOW(), ?, ?, ?, ?)
        ");

        // The parameters are: (transactionId, item_id, buyer_id, seller_id, bid_id)
        // Binding all IDs as strings (s) for maximum compatibility.
        $stmt->bind_param("sssss", 
            $transactionId, 
            $item_id, 
            $buyer_id, 
            $seller_id, 
            $bid_id 
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to record transaction receipt: " . $db->error);
        }
        $stmt->close();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Bid accepted successfully, and transaction recorded.',
            'action' => 'accept'
        ]);

    } elseif ($action === 'decline') {
        /* -----------------------------
            DECLINE BID LOGIC
        ------------------------------*/
        // Update bid status to 'declined'
        $stmt = $db->prepare("UPDATE bidoffer SET bid_status = 'declined' WHERE bid_id = ?");
        $stmt->bind_param("i", $bid_id);
        $stmt->execute();
        $stmt->close();
        
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
    // Catch-all for database errors or logic errors
    if (isset($db) && method_exists($db, 'rollback')) {
        $db->rollback();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
// Ensure connection is closed if it was successfully opened
if (isset($db) && method_exists($db, 'close')) {
    $db->close();
}
?>