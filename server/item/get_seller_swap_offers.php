<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include_once '../config/database.php';

if (!isset($_GET['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Item ID is required']);
    exit;
}

$item_id = $_GET['item_id'];

try {
    $database = new Database();
    $db = $database->getConnection();

    /* -----------------------------
        FETCH YOUR SWAP ITEM DETAILS
    ------------------------------*/

    $query = "
        SELECT 
            i.*,
            u.user_id as seller_id,
            u.username as seller_name,
            u.email as seller_email,
            (SELECT COUNT(*) FROM swapoffer WHERE item_id = i.item_id AND swap_status = 'pending') as total_offers
        FROM item i
        LEFT JOIN user u ON i.seller_id = u.user_id
        WHERE i.item_id = ?
    ";

    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $item = $result->fetch_assoc();

    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found']);
        exit;
    }

    /* -----------------------------
        FETCH YOUR ITEM IMAGES
    ------------------------------*/

    $stmt = $db->prepare("SELECT * FROM itemimage WHERE item_id = ? ORDER BY image_id");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    /* -----------------------------
        FETCH SWAP OFFERS
        (Items other users want to trade)
        
        NOTE: In swapoffer table:
        - item_id = the item YOU are offering (your listing)
        - user_id = the person who wants to swap WITH you
        
        We need to find what item THEY are offering in exchange.
        This might be in a separate field or we need to join with their items.
    ------------------------------*/

    $swap_offers = [];

    if ($item['item_type'] === 'swap') {
        // First, let's get all swap offers for this item
        $stmt = $db->prepare("
            SELECT 
                so.swap_id,
                so.item_id,
                so.user_id,
                so.swap_status,
                so.created_at,
                u.username as offerer_name,
                u.email as offerer_email
            FROM swapoffer so
            INNER JOIN user u ON so.user_id = u.user_id
            WHERE so.item_id = ?
            ORDER BY so.created_at DESC
        ");

        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $offers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // For each offer, we need to find what item they're offering
        // This is typically stored in another table or field
        // Let's check if there's a related item they're offering
        
        foreach ($offers as &$offer) {
            // Try to find the item they're offering in exchange
            // This might be in swapitem table or another relation
            $stmt = $db->prepare("
                SELECT 
                    i.item_id,
                    i.title,
                    i.description,
                    i.category_type
                FROM swapitem si
                INNER JOIN item i ON si.item_id = i.item_id
                WHERE si.item_id = ? AND i.seller_id = ?
                LIMIT 1
            ");
            
            $stmt->bind_param("ii", $offer['item_id'], $offer['user_id']);
            $stmt->execute();
            $offered_item_result = $stmt->get_result();
            
            if ($offered_item_result->num_rows > 0) {
                $offered_item = $offered_item_result->fetch_assoc();
                
                $offer['offered_item_id'] = $offered_item['item_id'];
                $offer['offered_item_title'] = $offered_item['title'];
                $offer['offered_item_description'] = $offered_item['description'];
                $offer['offered_item_category'] = $offered_item['category_type'];
                
                // Get image for offered item
                $stmt = $db->prepare("SELECT * FROM itemimage WHERE item_id = ? ORDER BY image_id LIMIT 1");
                $stmt->bind_param("i", $offered_item['item_id']);
                $stmt->execute();
                $offered_images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                $offer['offered_item_images'] = $offered_images;
            } else {
                // If no specific item found, use placeholder
                $offer['offered_item_id'] = null;
                $offer['offered_item_title'] = 'User\'s Item';
                $offer['offered_item_description'] = 'No description available';
                $offer['offered_item_category'] = 'N/A';
                $offer['offered_item_images'] = [];
            }
            
            $offer['time_ago'] = getTimeAgo($offer['created_at']);
        }

        $swap_offers = $offers;
    }

    echo json_encode([
        'success' => true,
        'item' => $item,
        'images' => $images,
        'swap_offers' => $swap_offers
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

/* -----------------------------
    TIME AGO FUNCTION
------------------------------*/

function getTimeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    
    if ($diff->d > 0) {
        return $diff->d . ' day' . ($diff->d > 1 ? 's' : '') . ' ago';
    } elseif ($diff->h > 0) {
        return $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
    } elseif ($diff->i > 0) {
        return $diff->i . ' minute' . ($diff->i > 1 ? 's' : '') . ' ago';
    } else {
        return 'Just now';
    }
}
?>