<?php
/**
 * Command Handler API
 * 
 * Main API endpoint that handles all assistant commands.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

// Initialize database
initDatabase();

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['action'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request. Action is required.'
    ]);
    exit();
}

$action = $input['action'];
$response = ['success' => false, 'message' => 'Unknown action'];

switch ($action) {
    case 'create':
        require_once __DIR__ . '/../actions/file_create.php';
        $response = createFile($input);
        break;
        
    case 'read':
        require_once __DIR__ . '/../actions/file_read.php';
        $response = read_file_content($input);
        break;
        
    case 'edit':
        require_once __DIR__ . '/../actions/file_edit.php';
        $response = editFile($input);
        break;
        
    case 'delete':
        require_once __DIR__ . '/../actions/file_delete.php';
        $response = deleteFile($input);
        break;
        
    case 'search':
        require_once __DIR__ . '/../actions/file_search.php';
        $response = searchFiles($input);
        break;
        
    case 'list':
        require_once __DIR__ . '/../actions/file_search.php';
        $response = listAllFiles();
        break;
        
    case 'email':
        require_once __DIR__ . '/../actions/send_email.php';
        $response = sendEmail($input);
        break;
        
    case 'contact':
        $response = handleContactForm($input);
        break;
        
    default:
        $response = [
            'success' => false,
            'message' => 'Unknown action: ' . $action
        ];
}

// Log the command
logCommand($action, $input, $response['success'] ? 'success' : 'failed');

echo json_encode($response);

/**
 * Handle contact form submission
 */
function handleContactForm($input) {
    if (empty($input['name']) || empty($input['email']) || empty($input['subject']) || empty($input['message'])) {
        return [
            'success' => false,
            'message' => 'All fields are required.'
        ];
    }
    
    // Validate email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid email address.'
        ];
    }
    
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return [
            'success' => false,
            'message' => 'Database connection failed.'
        ];
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO contacts (name, email, subject, message)
            VALUES (:name, :email, :subject, :message)
        ");
        
        $stmt->execute([
            ':name' => htmlspecialchars($input['name']),
            ':email' => htmlspecialchars($input['email']),
            ':subject' => htmlspecialchars($input['subject']),
            ':message' => htmlspecialchars($input['message'])
        ]);
        
        return [
            'success' => true,
            'message' => 'Thank you for your message! We will get back to you soon.'
        ];
    } catch (PDOException $e) {
        error_log("Contact form error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to submit message. Please try again.'
        ];
    }
}
?>
