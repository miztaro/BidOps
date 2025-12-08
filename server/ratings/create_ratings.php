<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$rating_id = isset($input['rating_id']) ? intval($input['rating_id']) : 0;
$transaction_id = isset($input['transaction_id']) ? intval($input['transaction_id']) : null;
$rater_id = isset($input['rater_id']) ? $input['rater_id'] : null;
$rating = isset($input['rating']) ? intval($input['rating']) : 0;
$comment = isset($input['comment']) ? $input['comment'] : '';

if (!$transaction_id || !$rater_id || $rating < 1 || $rating > 5) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'bidops';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$conn->set_charset('utf8mb4');

if ($rating_id > 0) {
    $sql = "UPDATE userrating SET rating = ?, comment = ? WHERE rating_id = ? AND rater_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: '.$conn->error]);
        exit;
    }
    $stmt->bind_param('issi', $rating, $comment, $rating_id, $rater_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Rating updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed: '.$stmt->error]);
    }
    $stmt->close();
} else {
    $stmtCheck = $conn->prepare('SELECT rating_id FROM userrating WHERE transaction_id = ? AND rater_id = ?');
    $stmtCheck->bind_param('is', $transaction_id, $rater_id);
    $stmtCheck->execute();
    $stmtCheck->store_result();
    
    if ($stmtCheck->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Rating already exists for this transaction']);
        $stmtCheck->close();
        $conn->close();
        exit;
    }
    $stmtCheck->close();

    $stmt = $conn->prepare('INSERT INTO userrating (rating, comment, rater_id, transaction_id) VALUES (?, ?, ?, ?)');
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: '.$conn->error]);
        exit;
    }
    $stmt->bind_param('issi', $rating, $comment, $rater_id, $transaction_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Rating created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Insert failed: '.$stmt->error]);
    }
    $stmt->close();
}

$conn->close();
?>
