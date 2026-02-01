<?php
/**
 * Contact Form Handler
 * Processes contact form submissions and stores them in the database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

require_once '../config/db.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    $required = ['name', 'email', 'subject', 'message'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Field '{$field}' is required");
        }
    }
    
    $name = trim($input['name']);
    $email = trim($input['email']);
    $subject = trim($input['subject']);
    $message = trim($input['message']);
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }
    
    // Sanitize inputs
    $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Insert into database
    $stmt = $conn->prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $name, $email, $subject, $message);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to save message');
    }
    
    $messageId = $conn->insert_id;
    $stmt->close();
    
    // Send email notification to admin (optional)
    $adminEmail = 'admin@virtualassistant.com';
    $emailSubject = "New Contact Form Submission: {$subject}";
    $emailBody = "
    New contact form submission received:
    
    Name: {$name}
    Email: {$email}
    Subject: {$subject}
    
    Message:
    {$message}
    
    ---
    Sent from Virtual Assistant Contact Form
    ";
    
    $headers = "From: noreply@virtualassistant.com\r\n";
    $headers .= "Reply-To: {$email}\r\n";
    
    // Attempt to send email (may fail in local environment)
    @mail($adminEmail, $emailSubject, $emailBody, $headers);
    
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! We will get back to you soon.',
        'data' => [
            'id' => $messageId
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
