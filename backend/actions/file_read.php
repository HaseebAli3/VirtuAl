<?php
/**
 * File Read Action
 * 
 * Reads and returns the content of a file.
 */

require_once __DIR__ . '/../config/db.php';

function read_file_content($input) {
    // Validate input
    if (empty($input['filename'])) {
        return [
            'success' => false,
            'message' => 'Filename is required.'
        ];
    }
    
    $filename = basename($input['filename']);
    
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return [
            'success' => false,
            'message' => 'Database connection failed.'
        ];
    }
    
    // Get file info from database
    $stmt = $pdo->prepare("SELECT * FROM files WHERE filename = :filename");
    $stmt->execute([':filename' => $filename]);
    $file = $stmt->fetch();
    
    if (!$file) {
        return [
            'success' => false,
            'message' => 'File not found: ' . $filename
        ];
    }
    
    $filepath = UPLOADS_PATH . $filename;
    
    // Check if file exists on disk
    if (!file_exists($filepath)) {
        // File in database but not on disk - clean up database entry
        $stmt = $pdo->prepare("DELETE FROM files WHERE filename = :filename");
        $stmt->execute([':filename' => $filename]);
        
        return [
            'success' => false,
            'message' => 'File not found on disk. Database has been cleaned up.'
        ];
    }
    
    // Read file content
    $content = file_get_contents($filepath);
    
    if ($content === false) {
        return [
            'success' => false,
            'message' => 'Failed to read file content.'
        ];
    }
    
    return [
        'success' => true,
        'message' => 'File read successfully.',
        'content' => $content,
        'file' => [
            'id' => $file['id'],
            'filename' => $file['filename'],
            'size' => $file['size'],
            'mime_type' => $file['mime_type'],
            'created_at' => $file['created_at'],
            'updated_at' => $file['updated_at']
        ]
    ];
}
?>
