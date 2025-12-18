<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include_once '../config/database.php';

// Check if Item ID is provided
if (!isset($_GET['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Item ID is required']);
    exit;
}

$item_id = $_GET['item_id']; 
$current_user_id = $_SESSION['user_id'] ?? null;

// Ensure user is logged in
if (!$current_user_id) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    /* -----------------------------
        1. FETCH THE MAIN ITEM DETAILS
    ------------------------------*/
    $query = "
        SELECT 
            i.*,
            u.user_id as seller_id,
            u.username as seller_name,
            u.email as seller_email
        FROM item i
        LEFT JOIN user u ON i.seller_id = u.user_id
        WHERE i.item_id = ?
    ";

    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $item = $stmt->get_result()->fetch_assoc();

    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found.']);
        exit;
    }

    // Identify if the current user is the owner (Seller)
    $is_seller = ($item['seller_id'] === $current_user_id);

    /* -----------------------------
        2. FETCH MAIN ITEM IMAGES
    ------------------------------*/
    $stmt = $db->prepare("SELECT * FROM itemimage WHERE item_id = ? ORDER BY image_id");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    /* -----------------------------
        3. FETCH SWAP OFFERS (The Privacy Filter)
    ------------------------------*/
    $swap_offers = [];

    if ($item['item_type'] === 'swap') {
        // Base query to get swap details
        $offer_query = "
            SELECT 
                so.swap_id,
                so.offered_item_id,      /* The item being given to the seller */
                so.user_id as offerer_id, /* The user making the offer */
                so.swap_status,
                so.created_at,
                u.username as offerer_name,
                u.email as offerer_email,
                oi.title as offered_item_title,
                oi.description as offered_item_description,
                oi.category_type as offered_item_category
            FROM swapoffer so
            INNER JOIN user u ON so.user_id = u.user_id
            INNER JOIN item oi ON so.offered_item_id = oi.item_id
            WHERE so.requested_item_id = ? 
        ";

        // --- THE PRIVACY LOGIC ---
        // If the current user is NOT the seller, they should only see their own offer.
        if (!$is_seller) {
            $offer_query .= " AND so.user_id = ?";
            $stmt = $db->prepare($offer_query);
            $stmt->bind_param("is", $item_id, $current_user_id);
        } else {
            // If the current user IS the seller, show all offers
            $offer_query .= " ORDER BY so.created_at DESC";
            $stmt = $db->prepare($offer_query);
            $stmt->bind_param("i", $item_id);
        }

        $stmt->execute();
        $offers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Fetch the image for each offered item
        foreach ($offers as &$offer) {
            $stmt_img = $db->prepare("SELECT image_path FROM itemimage WHERE item_id = ? ORDER BY image_id LIMIT 1");
            $stmt_img->bind_param("i", $offer['offered_item_id']);
            $stmt_img->execute();
            $offered_image_result = $stmt_img->get_result();
            $offered_image = $offered_image_result->fetch_assoc();
            
            $offer['offered_item_image'] = $offered_image ? $offered_image['image_path'] : '../assets/images/default.png';
            $offer['time_ago'] = getTimeAgo($offer['created_at']);
        }

        $swap_offers = $offers;
    }

    echo json_encode([
        'success' => true,
        'is_seller' => $is_seller, // Tells frontend to show/hide "Accept" buttons
        'item' => $item,
        'images' => $images,
        'swap_offers' => $swap_offers
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($db)) $db->close();
}

/* -----------------------------
    TIME AGO UTILITY FUNCTION
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