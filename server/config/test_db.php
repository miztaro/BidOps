<?php
require_once __DIR__ . '/database.php';

$db = new Database();
$conn = $db->getConnection();

// Check port PHP is using
$port_result = $conn->query("SHOW VARIABLES LIKE 'port'");
$port_row = $port_result->fetch_assoc();
echo "PHP MySQL port: " . $port_row['Value'] . "<br>";


// 1) Check basic connection
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}
echo "OK: connected to MySQL<br>";

// 2) Confirm active database
$result = $conn->query("SELECT DATABASE() AS db");
$row = $result->fetch_assoc();
echo "Current DB: " . $row['db'] . "<br>";

// 3) Try a simple query on a known table
$result2 = $conn->query("SELECT item_id, title FROM item LIMIT 5");
echo "Rows found by SELECT: " . $result2->num_rows . "<br>";

while ($row = $result2->fetch_assoc()) {
    echo "Item: " . $row['id'] . " - " . $row['title'] . "<br>";
}
$conn->close();
