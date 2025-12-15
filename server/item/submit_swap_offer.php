<?php
// server/item/submit_swap_offer.php
error_reporting(E_ALL); // Set error reporting for debugging
session_start();
header('Content-Type: application/json');
// Headers are generally handled better by the server configuration, but kept here for function.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Check login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized or session expired.']);
    exit;
}

include '../config/database.php';

// The ID of the user submitting the offer (the buyer)
$offerer_id = $_SESSION['user_id']; 

// Data from the JavaScript FormData POST
$item_id_requested = $_POST['item_id'] ?? null; // The seller's item (Calculus book)
$offered_item_title = $_POST['offered_item_title'] ?? null;
$offered_item_description = $_POST['offered_item_description'] ?? null;
$offered_item_category = $_POST['offered_item_category'] ?? null;
$message = $_POST['message'] ?? ''; // Currently unused, but good practice

if (!$item_id_requested || !$offered_item_title || !$offered_item_description || !$offered_item_category) {
    echo json_encode(['success' => false, 'message' => 'All item details are required for the proposed item.']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Validate the target item (the one the offerer wants)
    $stmt = $db->prepare("
        SELECT i.item_id, i.seller_id 
        FROM ITEM i 
        WHERE i.item_id = ? AND i.item_type = 'swap' AND i.status = 'active'
    ");
    $stmt->bind_param("i", $item_id_requested);
    $stmt->execute();
    $result = $stmt->get_result();
    $target_item = $result->fetch_assoc();
    
    if (!$target_item) {
        echo json_encode(['success' => false, 'message' => 'Requested swap item not found or not available.']);
        exit;
    }
    
    // Check if user is trying to swap with their own item
    if ($target_item['seller_id'] == $offerer_id) {
        echo json_encode(['success' => false, 'message' => 'Cannot place a swap offer on your own item.']);
        exit;
    }
    
    // 2. Insert the NEW offered item into the ITEM table
    $offered_item_id = insertNewItem($db, $offerer_id, $offered_item_title, $offered_item_description, $offered_item_category);
    
    if (isset($_FILES['item_image']) && $_FILES['item_image']['error'] === UPLOAD_ERR_OK) {
        $image_path = uploadItemImage($_FILES['item_image'], $offered_item_id);
        if ($image_path) {
            $stmt = $db->prepare("INSERT INTO ITEMIMAGE (image_path, item_id) VALUES (?, ?)");
            $stmt->bind_param("si", $image_path, $offered_item_id);
            $stmt->execute();
        }
    }
    
    // 3. Insert the Swap Offer record, linking both item IDs
    // ASSUMING your swapoffer table has columns: requested_item_id, offered_item_id, user_id (offerer)
    $stmt = $db->prepare("
        INSERT INTO swapoffer (requested_item_id, offered_item_id, user_id, swap_status, created_at)
        VALUES (?, ?, ?, 'pending', NOW())
    ");
    // Change swap_id in DB to auto-increment primary key if possible. Using iiis here for (int, int, int, string) if item_id's and user_id are ints.
    $stmt->bind_param("iii", $item_id_requested, $offered_item_id, $offerer_id);
    $stmt->execute();
    
    // Get the ID of the newly created swap offer record
    $new_swap_offer_id = $db->insert_id; 
    
    echo json_encode([
        'success' => true,
        'message' => 'Swap offer submitted successfully!',
        'swap_offer_id' => $new_swap_offer_id,
        'offered_item_id' => $offered_item_id
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($db)) $db->close();
}

function insertNewItem($db, $user_id, $title, $description, $category) {
    // NOTE: This assumes item_id is manually managed/auto-incremented.
    // Let the database handle the item_id primary key if possible.
    // If not, use the current logic:
    $result = $db->query("SELECT MAX(item_id) as max_id FROM ITEM");
    $row = $result->fetch_assoc();
    $new_item_id = intval($row['max_id']) + 1;
    
    $stmt = $db->prepare("
        INSERT INTO ITEM (item_id, title, description, category_type, status, item_type, seller_id)
        VALUES (?, ?, ?, ?, 'active', 'swap', ?)
    ");
    // Ensure item_id is handled as integer 'i', user_id as integer 'i'
    $stmt->bind_param("isssi", $new_item_id, $title, $description, $category, $user_id); 
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to insert new item into ITEM table: " . $stmt->error);
    }
    
    $stmt = $db->prepare("INSERT INTO swapitem (item_id) VALUES (?)");
    $stmt->bind_param("i", $new_item_id);
    if (!$stmt->execute()) {
         throw new Exception("Failed to insert new item into swapitem table: " . $stmt->error);
    }
    
    return $new_item_id;
}

function uploadItemImage($file, $item_id) {
    $upload_dir = "../uploads/"; // Changed to go up one directory to access the main uploads folder
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $file_extension = pathinfo($file["name"], PATHINFO_EXTENSION);
    $filename = "swap_item_" . $item_id . "_" . uniqid() . "." . $file_extension;
    $target_file = $upload_dir . $filename;

    $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array(strtolower($file_extension), $allowed_types)) {
        return null;
    }

    if ($file["size"] > 5 * 1024 * 1024) {
        return null;
    }

    if (move_uploaded_file($file["tmp_name"], $target_file)) {
        // Return path relative to the server/item/ folder where this script is called from
        return "uploads/" . $filename; 
    }

    return null;
}
?>