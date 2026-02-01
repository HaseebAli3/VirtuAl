<?php
/**
 * File Create Action
 * 
 * Creates a new file with the given filename and content.
 */

require_once __DIR__ . '/../config/db.php';

function createFile($input) {
    // Validate input
    if (empty($input['filename'])) {
        return [
            'success' => false,
            'message' => 'Filename is required.'
        ];
    }
    
    $filename = sanitizeFilename($input['filename']);
    $content = isset($input['content']) ? $input['content'] : '';
    
    if (!$filename) {
        return [
            'success' => false,
            'message' => 'Invalid filename. Please use only letters, numbers, underscores, hyphens, and dots.'
        ];
    }
    
    // Check file extension (allow common text file extensions)
    $allowedExtensions = ['txt', 'md', 'json', 'html', 'css', 'js', 'xml', 'csv', 'log'];
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    if (!in_array($extension, $allowedExtensions)) {
        // If no extension or invalid extension, add .txt
        $filename = $filename . '.txt';
    }
    
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return [
            'success' => false,
            'message' => 'Database connection failed.'
        ];
    }
    
    // Check if file already exists
    $stmt = $pdo->prepare("SELECT id FROM files WHERE filename = :filename");
    $stmt->execute([':filename' => $filename]);
    
    if ($stmt->fetch()) {
        return [
            'success' => false,
            'message' => 'A file with this name already exists. Try a different name or use edit to modify the existing file.'
        ];
    }
    
    // Create the file
    $filepath = UPLOADS_PATH . $filename;
    
    try {
        // Ensure uploads directory exists
        if (!file_exists(UPLOADS_PATH)) {
            mkdir(UPLOADS_PATH, 0755, true);
        }
        
        // Write content to file
        if (file_put_contents($filepath, $content) === false) {
            return [
                'success' => false,
                'message' => 'Failed to create file on disk.'
            ];
        }
        
        $filesize = strlen($content);
        $mimeType = getMimeType($filename);
        
        // Insert into database
        $stmt = $pdo->prepare("
            INSERT INTO files (filename, filepath, size, mime_type)
            VALUES (:filename, :filepath, :size, :mime_type)
        ");
        
        $stmt->execute([
            ':filename' => $filename,
            ':filepath' => $filepath,
            ':size' => $filesize,
            ':mime_type' => $mimeType
        ]);
        
        return [
            'success' => true,
            'message' => 'File created successfully.',
            'file' => [
                'id' => $pdo->lastInsertId(),
                'filename' => $filename,
                'size' => $filesize
            ]
        ];
        
    } catch (Exception $e) {
        error_log("File create error: " . $e->getMessage());
        
        // Clean up file if database insert failed
        if (file_exists($filepath)) {
            unlink($filepath);
        }
        
        return [
            'success' => false,
            'message' => 'Failed to create file: ' . $e->getMessage()
        ];
    }
}

/**
 * Sanitize filename to prevent directory traversal and invalid characters
 */
function sanitizeFilename($filename) {
    // Remove any directory components
    $filename = basename($filename);
    
    // Remove any characters that aren't alphanumeric, underscore, hyphen, or dot
    $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $filename);
    
    // Ensure filename is not empty and not just dots
    if (empty($filename) || preg_match('/^\.+$/', $filename)) {
        return null;
    }
    
    // Limit filename length
    if (strlen($filename) > 200) {
        $filename = substr($filename, 0, 200);
    }
    
    return $filename;
}

/**
 * Get MIME type based on file extension
 */
function getMimeType($filename) {
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    $mimeTypes = [
        'txt' => 'text/plain',
        'md' => 'text/markdown',
        'json' => 'application/json',
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'xml' => 'application/xml',
        'csv' => 'text/csv',
        'log' => 'text/plain'
    ];
    
    return isset($mimeTypes[$extension]) ? $mimeTypes[$extension] : 'text/plain';
}
?>
