<?php
/**
 * Database Configuration
 * 
 * Configure your MySQL database connection settings here.
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'virtual_assistant');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Files storage path (relative to backend directory)
define('UPLOADS_PATH', __DIR__ . '/../../uploads/');

// Email configuration (SMTP Settings)
define('EMAIL_HOST', 'smtp.gmail.com');
define('EMAIL_PORT', 587);
define('EMAIL_USE_TLS', true);
define('EMAIL_USERNAME', 'fakenewsdetectionssystem@gmail.com');
define('EMAIL_PASSWORD', 'dwlu abey hiwx bhwa');
define('EMAIL_FROM', 'fakenewsdetectionssystem@gmail.com');
define('EMAIL_FROM_NAME', 'Virtual Assistant');

// Create PDO connection
function getDbConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            return null;
        }
    }
    
    return $pdo;
}

// Initialize database and create tables if they don't exist
function initDatabase() {
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return false;
    }
    
    try {
        // Create files table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                filepath VARCHAR(500) NOT NULL,
                size INT DEFAULT 0,
                mime_type VARCHAR(100) DEFAULT 'text/plain',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create emails table for logging sent emails
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS emails (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recipient VARCHAR(255) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                message TEXT,
                status ENUM('sent', 'failed') DEFAULT 'sent',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create command_history table for logging commands
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS command_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                command_type VARCHAR(50) NOT NULL,
                command_data JSON,
                result VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create contacts table for contact form submissions
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create uploads directory if it doesn't exist
        if (!file_exists(UPLOADS_PATH)) {
            mkdir(UPLOADS_PATH, 0755, true);
        }
        
        return true;
    } catch (PDOException $e) {
        error_log("Database initialization failed: " . $e->getMessage());
        return false;
    }
}

// Log command to history
function logCommand($type, $data, $result) {
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return false;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO command_history (command_type, command_data, result)
            VALUES (:type, :data, :result)
        ");
        
        $stmt->execute([
            ':type' => $type,
            ':data' => json_encode($data),
            ':result' => $result
        ]);
        
        return true;
    } catch (PDOException $e) {
        error_log("Failed to log command: " . $e->getMessage());
        return false;
    }
}
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("DB connection fail: " . $e->getMessage());
            $this->connection = null;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}

?>
