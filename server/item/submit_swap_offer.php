<?php
session_start();
// Error reporting should still be active for final checks
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Authentication error: User not logged in.']);
    exit;
}
$offerer_user_id = $_SESSION['user_id'];

// --- 1. INPUT VALIDATION & ASSIGNMENT ---
$requested_item_id = $_POST['item_id'] ?? null;
$offered_item_title = $_POST['offered_item_title'] ?? null;
$offered_item_description = $_POST['offered_item_description'] ?? ''; 
$offered_item_category = $_POST['offered_item_category'] ?? '';
$message = $_POST['message'] ?? ''; 
$item_image = $_FILES['item_image'] ?? null; // Get the file data

if (!$requested_item_id || !$offered_item_title) {
    echo json_encode(['success' => false, 'message' => 'Missing required swap ID or offered item title.']);
    exit;
}
if (!$item_image || $item_image['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No image file uploaded or an upload error occurred.']);
    exit;
}


include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $db->begin_transaction();

    /* ----------------------------------------------------
        A. INSERT THE USER'S OFFERED ITEM INTO THE ITEM TABLE
    -----------------------------------------------------*/
    $stmt = $db->prepare("
        INSERT INTO item 
        (seller_id, title, description, category_type, item_type, status, created_date) 
        VALUES (?, ?, ?, ?, 'swap', 'available', NOW())
    ");
    
    // FIX: Using "ssss" because seller_id (User ID) is VARCHAR
    $stmt->bind_param(
        "ssss", 
        $offerer_user_id, 
        $offered_item_title, 
        $offered_item_description, 
        $offered_item_category
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Item insertion failed: " . $stmt->error);
    }
    $offered_item_id = $db->insert_id; 

    /* ----------------------------------------------------
        B. IMAGE LOGIC (Final implementation)
    -----------------------------------------------------*/
    $target_dir = "uploads/";
    
    // Check if the uploads directory exists and is writable (Crucial for XAMPP)
    if (!is_dir($target_dir)) {
        if (!mkdir($target_dir, 0777, true)) {
            throw new Exception("Failed to create upload directory: " . $target_dir);
        }
    }
    if (!is_writable($target_dir)) {
        throw new Exception("Upload directory is not writable. Check folder permissions.");
    }
    
    $file_extension = pathinfo($item_image["name"], PATHINFO_EXTENSION);
    $unique_filename = uniqid('swap_', true) . '.' . $file_extension;
    $target_file = $target_dir . $unique_filename;

    if (move_uploaded_file($item_image["tmp_name"], $target_file)) {
        // Success: Insert image path into itemimage table
        $stmt = $db->prepare("INSERT INTO itemimage (item_id, image_path) VALUES (?, ?)");
        $stmt->bind_param("is", $offered_item_id, $target_file); 
        if (!$stmt->execute()) {
            throw new Exception("Image path insertion failed: " . $stmt->error);
        }
    } else {
        // Log the exact upload error if the move failed
        $error_message = match($item_image['error']) {
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
            default => 'Unknown file upload error.'
        };
        throw new Exception("File upload failed: " . $error_message);
    }

    /* ----------------------------------------------------
        C. INSERT INTO SWAPOFFER TABLE - MINIMAL COLUMNS
        (Using only the existing columns confirmed in your structure)
    -----------------------------------------------------*/
    $stmt = $db->prepare("
        INSERT INTO swapoffer 
        (item_id, user_id, swap_status) 
        VALUES (?, ?, 'pending')
    ");
    
    // Type Signature: "is" (i: requested item ID, s: user ID)
    $stmt->bind_param(
        "is", 
        $requested_item_id, 
        $offerer_user_id
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Swap offer insertion failed: " . $stmt->error);
    }

    /* ----------------------------------------------------
        D. SEND OPTIONAL MESSAGE TO SELLER (Chat Message)
    -----------------------------------------------------*/
    if (!empty($message)) {
        // 1. Get the seller_id for the requested item
        $seller_query = $db->prepare("SELECT seller_id FROM item WHERE item_id = ?");
        $seller_query->bind_param("i", $requested_item_id);
        $seller_query->execute();
        $seller_res = $seller_query->get_result();
        
        if ($seller_res->num_rows > 0) {
            $row = $seller_res->fetch_assoc();
            $seller_id = $row['seller_id'];
            $buyer_id = $offerer_user_id;

            // Only send if not chatting with self depending on logic, but typically allowed for testing
            // Check for existing chat
            $chat_query = $db->prepare("
                SELECT chat_id 
                FROM chat 
                WHERE item_id = ? 
                  AND ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
                LIMIT 1
            ");
            $chat_query->bind_param("issss", $requested_item_id, $buyer_id, $seller_id, $seller_id, $buyer_id);
            $chat_query->execute();
            $chat_res = $chat_query->get_result();
            
            $chat_id = null;
            
            if ($chat_res->num_rows > 0) {
                $chat_row = $chat_res->fetch_assoc();
                $chat_id = $chat_row['chat_id'];
            } else {
                // Create new chat
                $new_chat = $db->prepare("INSERT INTO chat (item_id, buyer_id, seller_id, created_at) VALUES (?, ?, ?, NOW())");
                $new_chat->bind_param("iss", $requested_item_id, $buyer_id, $seller_id);
                if ($new_chat->execute()) {
                    $chat_id = $db->insert_id;
                }
            }

            // Insert the message if we have a valid chat_id
            if ($chat_id) {
                $msg_insert = $db->prepare("INSERT INTO message (chat_id, user_id, message, sent_at) VALUES (?, ?, ?, NOW())");
                $msg_insert->bind_param("iss", $chat_id, $offerer_user_id, $message);
                $msg_insert->execute();
            }
        }
    }

    $db->commit();

    // SUCCESS RESPONSE
    echo json_encode([
        'success' => true, 
        'message' => 'Swap offer submitted successfully!',
        'offered_item_id' => $offered_item_id
    ]);

} catch (Exception $e) {
    $db->rollback();
    // ERROR RESPONSE
    echo json_encode([
        'success' => false,
        'message' => 'Database or Server error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($db)) $db->close();
}
?>