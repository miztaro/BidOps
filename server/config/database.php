<?php
class Database {
    private $host = "localhost";
    private $db_name = "bidops";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);

        if ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }

        $this->conn->set_charset("utf8");

        return $this->conn;
    }
}
?>
