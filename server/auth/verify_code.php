<?php
session_start();
header("Content-Type: application/json");

require 'db_connection.php'; // $conn

$code = $_POST['code'] ?? '';
$email = $_SESSION['pendingEmail'] ?? '';

if (!$code || !$email) die(json_encode(["success"=>false,"message"=>"Missing data"]));

$stmt = $conn->prepare("SELECT * FROM email_verification WHERE email=? AND code=?");
$stmt->bind_param("ss",$email,$code);
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows > 0){
    $_SESSION['verifiedEmail'] = $email;

    $stmtDel = $conn->prepare("DELETE FROM email_verification WHERE email=?");
    $stmtDel->bind_param("s",$email);
    $stmtDel->execute();
    $stmtDel->close();

    echo json_encode(["success"=>true]);
} else {
    echo json_encode(["success"=>false,"message"=>"Incorrect code"]);
}

$stmt->close();
$conn->close();
?>
