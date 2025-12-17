<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include_once '../config/database.php';

if (!isset($_GET['item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Item ID is required']);
    exit;
}

$item_id = $_GET['item_id']; // The item the seller is listing (the one being requested by others)
$current_user_id = $_SESSION['user_id'] ?? null;

// Optional: Ensure the logged-in user is the seller of the item before showing offers
if (!$current_user_id) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    /* -----------------------------
        FETCH YOUR SWAP ITEM DETAILS (The item the seller listed)
    ------------------------------*/
    $query = "
        SELECT 
            i.*,
            u.user_id as seller_id,
            u.username as seller_name,
            u.email as seller_email,
            (SELECT COUNT(*) FROM swapoffer WHERE requested_item_id = i.item_id AND swap_status = 'pending') as total_offers
        FROM item i
        LEFT JOIN user u ON i.seller_id = u.user_id
        WHERE i.item_id = ? AND i.seller_id = ?
    ";

    $stmt = $db->prepare($query);
    $stmt->bind_param("is", $item_id, $current_user_id); // Check if current user is the seller
    $stmt->execute();
    $result = $stmt->get_result();
    $item = $result->fetch_assoc();

    if (!$item) {
        echo json_encode(['success' => false, 'message' => 'Item not found or you are not the seller.']);
        exit;
    }

    // Since this file is for the seller to view offers, we only need the item details for context, 
    // but the following is good for completeness if the frontend needs it.
    $stmt = $db->prepare("SELECT * FROM itemimage WHERE item_id = ? ORDER BY image_id");
    $stmt->bind_param("i", $item_id);
    $stmt->execute();
    $images = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    /* -----------------------------
        FETCH SWAP OFFERS (The items other users are trading)
        Crucial: Assuming swapoffer now has 'offered_item_id'
    ------------------------------*/
    $swap_offers = [];

    if ($item['item_type'] === 'swap') {
        $stmt = $db->prepare("
            SELECT 
                so.swap_id,
                so.offered_item_id,      /* <--- The item the offerer is giving */
                so.user_id as offerer_id, /* <--- The user making the offer */
                so.swap_status,
                so.created_at,
                u.username as offerer_name,
                u.email as offerer_email,
                
                oi.title as offered_item_title,
                oi.description as offered_item_description,
                oi.category_type as offered_item_category
                
            FROM swapoffer so
            INNER JOIN user u ON so.user_id = u.user_id
            INNER JOIN item oi ON so.offered_item_id = oi.item_id /* <--- Join to get offered item details */
            WHERE so.requested_item_id = ? 
            ORDER BY so.created_at DESC
        ");

        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $offers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Fetch image for each offered item
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
    TIME AGO FUNCTION (Kept as is)
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