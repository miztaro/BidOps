<?php
session_start();
require __DIR__ . '/../../vendor/autoload.php'; // Firebase JWT
use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

// Get JWT token from Google redirect
$id_token = $_GET['credential'] ?? '';
if (!$id_token) die("No token provided.");

// Google OAuth client ID
$client_id = '904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com';

// Fetch Google public keys
$certs_url = "https://www.googleapis.com/oauth2/v3/certs";
$certs = json_decode(file_get_contents($certs_url), true);

// Convert to JWK keys
$jwk_keys = JWK::parseKeySet($certs);

try {
    // Decode and verify token
    $decoded = JWT::decode($id_token, $jwk_keys);
} catch (\Exception $e) {
    die("Invalid token: " . $e->getMessage());
}

// Verify audience
if ($decoded->aud !== $client_id) die("Invalid audience.");

// Only allow SLU emails
$email = $decoded->email ?? '';
$name  = $decoded->name ?? '';
if (!str_ends_with($email, '@slu.edu.ph')) die("Access denied: Only SLU emails allowed.");

// Store in session
$_SESSION['google_register'] = [
    'name' => $name,
    'email' => $email
];

// Redirect to create account page
header("Location: /BidOps/client/create-account.html");
exit();
