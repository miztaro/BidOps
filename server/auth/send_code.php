<?php
session_start();
header("Content-Type: application/json");

require 'phpmailer/PHPMailer.php';
require 'phpmailer/SMTP.php';
require 'phpmailer/Exception.php';

// Use your mysqli connection
require 'db_connection.php'; // include the file with your $conn

$email = $_POST['email'] ?? '';
if (!str_ends_with($email, "@slu.edu.ph")) {
    echo json_encode(["success"=>false,"message"=>"Only SLU emails allowed"]);
    exit;
}

$code = rand(100000, 999999);

// Save code in DB
$stmt = $conn->prepare("INSERT INTO email_verification (email, code) VALUES (?, ?) ON DUPLICATE KEY UPDATE code=?");
$stmt->bind_param("sss", $email, $code, $code);
$stmt->execute();
$stmt->close();

// Send via PHPMailer
$mail = new PHPMailer\PHPMailer\PHPMailer();
$mail->isSMTP();
$mail->Host = "smtp.gmail.com";
$mail->SMTPAuth = true;
$mail->Username = "YOUR_GMAIL@gmail.com";
$mail->Password = "YOUR_APP_PASSWORD";
$mail->SMTPSecure = "tls";
$mail->Port = 587;

$mail->setFrom("YOUR_GMAIL@gmail.com","SLU Verification");
$mail->addAddress($email);
$mail->Subject = "Your Verification Code";
$mail->Body = "Your verification code is: $code";

if($mail->send()) echo json_encode(["success"=>true]);
else echo json_encode(["success"=>false,"message"=>"Email sending failed"]);
?>
