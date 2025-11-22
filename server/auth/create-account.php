<?php
session_start();
header("Content-Type: application/json");

require 'db_connection.php'; // $conn

$email = $_SESSION['verifiedEmail'] ?? '';
$idNumber = explode("@",$email)[0];
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if(!$email || !$username || !$password) {
    echo json_encode(["success"=>false,"message"=>"Missing fields"]);
    exit;
}

$hash = password_hash($password,PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (id_number,email,username,password) VALUES (?,?,?,?)");
$stmt->bind_param("ssss",$idNumber,$email,$username,$hash);

if($stmt->execute()){
    echo json_encode(["success"=>true,"message"=>"Account created"]);
    unset($_SESSION['verifiedEmail']);
}else{
    echo json_encode(["success"=>false,"message"=>"Failed to create account"]);
}
$stmt->close();
$conn->close();
?>
