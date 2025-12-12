<?php
class Database {
    private $host = "localhost";
    private $port = 3306;
    private $db_name = "bidops";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);

        if ($this->conn->connect_error) {
            // FIX: Throw an exception instead of using die()
            throw new Exception("Database connection failed: " . $this->conn->connect_error);
        }

        $this->conn->set_charset("utf8");

        return $this->conn;
    }
}
