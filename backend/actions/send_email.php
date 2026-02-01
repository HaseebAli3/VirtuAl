<?php
/**
 * Send Email Action
 * 
 * Sends an email using PHPMailer with SMTP (Gmail configuration)
 */

require_once __DIR__ . '/../config/db.php';

// Include PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Check if PHPMailer is available, if not use a simple SMTP implementation
function sendEmail($input) {
    // Validate input
    if (empty($input['to'])) {
        return [
            'success' => false,
            'message' => 'Recipient email is required.'
        ];
    }
    
    if (empty($input['subject'])) {
        return [
            'success' => false,
            'message' => 'Email subject is required.'
        ];
    }
    
    if (empty($input['message'])) {
        return [
            'success' => false,
            'message' => 'Email message is required.'
        ];
    }
    
    $to = filter_var($input['to'], FILTER_VALIDATE_EMAIL);
    
    if (!$to) {
        return [
            'success' => false,
            'message' => 'Invalid email address.'
        ];
    }
    
    $subject = $input['subject'];
    $messageBody = $input['message'];
    
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return [
            'success' => false,
            'message' => 'Database connection failed.'
        ];
    }
    
    try {
        // Try to send email using PHPMailer if available
        $emailSent = false;
        $status = 'failed';
        $errorMessage = '';
        
        // Check if PHPMailer class exists
        $phpmailerPath = __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php';
        
        if (file_exists($phpmailerPath)) {
            require_once $phpmailerPath;
            require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php';
            require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php';
            
            $mail = new PHPMailer(true);
            
            try {
                // Server settings
                $mail->isSMTP();
                $mail->Host = EMAIL_HOST;
                $mail->SMTPAuth = true;
                $mail->Username = EMAIL_USERNAME;
                $mail->Password = EMAIL_PASSWORD;
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = EMAIL_PORT;
                
                // Recipients
                $mail->setFrom(EMAIL_FROM, EMAIL_FROM_NAME);
                $mail->addAddress($to);
                
                // Content
                $mail->isHTML(false);
                $mail->Subject = $subject;
                $mail->Body = $messageBody;
                
                $mail->send();
                $emailSent = true;
                $status = 'sent';
            } catch (Exception $e) {
                $errorMessage = $mail->ErrorInfo;
            }
        } else {
            // Fallback: Use native PHP SMTP socket connection
            $emailSent = sendEmailViaSMTP($to, $subject, $messageBody);
            if ($emailSent) {
                $status = 'sent';
            } else {
                $errorMessage = 'SMTP connection failed';
            }
        }
        
        // Log to database
        $stmt = $pdo->prepare("
            INSERT INTO emails (recipient, subject, message, status)
            VALUES (:recipient, :subject, :message, :status)
        ");
        
        $stmt->execute([
            ':recipient' => $to,
            ':subject' => $subject,
            ':message' => $messageBody,
            ':status' => $status
        ]);
        
        if ($emailSent) {
            return [
                'success' => true,
                'message' => 'Email sent successfully to ' . $to,
                'email' => [
                    'id' => $pdo->lastInsertId(),
                    'to' => $to,
                    'subject' => $subject
                ]
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Failed to send email: ' . $errorMessage
            ];
        }
        
    } catch (Exception $e) {
        error_log("Send email error: " . $e->getMessage());
        
        // Log failed attempt
        try {
            $stmt = $pdo->prepare("
                INSERT INTO emails (recipient, subject, message, status)
                VALUES (:recipient, :subject, :message, 'failed')
            ");
            
            $stmt->execute([
                ':recipient' => $to,
                ':subject' => $subject,
                ':message' => $messageBody
            ]);
        } catch (Exception $logError) {
            error_log("Failed to log email: " . $logError->getMessage());
        }
        
        return [
            'success' => false,
            'message' => 'Failed to send email. Please try again later.'
        ];
    }
}

/**
 * Send email via SMTP socket (fallback when PHPMailer is not available)
 */
function sendEmailViaSMTP($to, $subject, $message) {
    $host = EMAIL_HOST;
    $port = EMAIL_PORT;
    $username = EMAIL_USERNAME;
    $password = EMAIL_PASSWORD;
    $from = EMAIL_FROM;
    $fromName = EMAIL_FROM_NAME;
    
    try {
        // Connect to SMTP server
        $socket = @fsockopen($host, $port, $errno, $errstr, 30);
        
        if (!$socket) {
            error_log("SMTP Connection failed: $errstr ($errno)");
            return false;
        }
        
        // Set stream timeout
        stream_set_timeout($socket, 30);
        
        // Read server greeting
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '220') {
            fclose($socket);
            return false;
        }
        
        // Send EHLO
        fwrite($socket, "EHLO " . gethostname() . "\r\n");
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') break;
        }
        
        // Start TLS
        fwrite($socket, "STARTTLS\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '220') {
            fclose($socket);
            return false;
        }
        
        // Enable TLS encryption
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        
        // Send EHLO again after TLS
        fwrite($socket, "EHLO " . gethostname() . "\r\n");
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') break;
        }
        
        // Authentication
        fwrite($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            return false;
        }
        
        fwrite($socket, base64_encode($username) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            return false;
        }
        
        fwrite($socket, base64_encode($password) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '235') {
            fclose($socket);
            return false;
        }
        
        // Send MAIL FROM
        fwrite($socket, "MAIL FROM:<$from>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            return false;
        }
        
        // Send RCPT TO
        fwrite($socket, "RCPT TO:<$to>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            return false;
        }
        
        // Send DATA
        fwrite($socket, "DATA\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '354') {
            fclose($socket);
            return false;
        }
        
        // Prepare email headers and body
        $headers = "From: $fromName <$from>\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "\r\n";
        
        // Escape dots at beginning of lines
        $message = str_replace("\n.", "\n..", $message);
        
        fwrite($socket, $headers . $message . "\r\n.\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            return false;
        }
        
        // Send QUIT
        fwrite($socket, "QUIT\r\n");
        fclose($socket);
        
        return true;
        
    } catch (Exception $e) {
        error_log("SMTP Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Get email history
 */
function getEmailHistory($limit = 50) {
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return [
            'success' => false,
            'message' => 'Database connection failed.'
        ];
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, recipient, subject, status, created_at
            FROM emails
            ORDER BY created_at DESC
            LIMIT :limit
        ");
        
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        $emails = $stmt->fetchAll();
        
        return [
            'success' => true,
            'emails' => $emails
        ];
        
    } catch (Exception $e) {
        error_log("Get email history error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to get email history.'
        ];
    }
}
?>
