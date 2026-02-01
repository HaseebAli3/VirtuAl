<?php
/**
 * Helper Functions
 * Common utility functions used throughout the application
 */

/**
 * Sanitize filename
 */
function sanitizeFilename($filename) {
    // Remove any directory traversal attempts
    $filename = basename($filename);
    
    // Remove dangerous characters
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
    
    // Prevent double extensions
    $filename = preg_replace('/\.+/', '.', $filename);
    
    return $filename;
}

/**
 * Get file extension from filename
 */
function getFileExtension($filename) {
    $parts = explode('.', $filename);
    return count($parts) > 1 ? strtolower(end($parts)) : 'txt';
}

/**
 * Get MIME type from extension
 */
function getMimeType($extension) {
    $mimeTypes = [
        'txt' => 'text/plain',
        'html' => 'text/html',
        'htm' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'xml' => 'application/xml',
        'php' => 'application/x-php',
        'py' => 'text/x-python',
        'md' => 'text/markdown',
        'csv' => 'text/csv',
        'sql' => 'application/sql',
        'log' => 'text/plain'
    ];
    
    return $mimeTypes[$extension] ?? 'text/plain';
}

/**
 * Format file size
 */
function formatFileSize($bytes) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $index = 0;
    
    while ($bytes >= 1024 && $index < count($units) - 1) {
        $bytes /= 1024;
        $index++;
    }
    
    return round($bytes, 2) . ' ' . $units[$index];
}

/**
 * Validate email address
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Generate unique ID
 */
function generateUniqueId($prefix = '') {
    return $prefix . uniqid() . '_' . bin2hex(random_bytes(4));
}

/**
 * Log activity to database
 */
function logActivity($conn, $action, $description, $status = 'success') {
    $stmt = $conn->prepare("INSERT INTO activity_log (action, description, status) VALUES (?, ?, ?)");
    $stmt->bind_param('sss', $action, $description, $status);
    $stmt->execute();
    $stmt->close();
}

/**
 * Parse natural language command
 */
function parseCommand($command) {
    $command = strtolower(trim($command));
    
    // File creation patterns
    $createPatterns = [
        '/create\s+(?:a\s+)?(?:new\s+)?file\s+(?:named?\s+)?["\']?([^"\']+)["\']?\s+with\s+content\s+["\']?(.+)["\']?/i',
        '/make\s+(?:a\s+)?file\s+(?:called?\s+)?["\']?([^"\']+)["\']?\s+(?:containing|with)\s+["\']?(.+)["\']?/i',
        '/new\s+file\s+["\']?([^"\']+)["\']?\s*:\s*(.+)/i'
    ];
    
    // File read patterns
    $readPatterns = [
        '/(?:read|open|show|display|view)\s+(?:the\s+)?(?:file\s+)?["\']?([^"\']+)["\']?/i',
        '/(?:what\'?s?\s+in|contents?\s+of)\s+(?:the\s+)?(?:file\s+)?["\']?([^"\']+)["\']?/i'
    ];
    
    // File edit patterns
    $editPatterns = [
        '/(?:edit|update|modify|change)\s+(?:the\s+)?(?:file\s+)?["\']?([^"\']+)["\']?\s+(?:to|with)\s+["\']?(.+)["\']?/i',
        '/(?:replace|set)\s+(?:the\s+)?(?:content\s+of\s+)?(?:file\s+)?["\']?([^"\']+)["\']?\s+(?:to|with)\s+["\']?(.+)["\']?/i'
    ];
    
    // File delete patterns
    $deletePatterns = [
        '/(?:delete|remove|erase)\s+(?:the\s+)?(?:file\s+)?["\']?([^"\']+)["\']?/i'
    ];
    
    // File search patterns
    $searchPatterns = [
        '/(?:find|search|look\s+for)\s+(?:files?\s+)?(?:named?\s+|called?\s+|containing\s+)?["\']?([^"\']+)["\']?/i',
        '/(?:list|show)\s+(?:all\s+)?files?\s+(?:with|containing|named?)\s+["\']?([^"\']+)["\']?/i'
    ];
    
    // Email patterns
    $emailPatterns = [
        '/(?:send|email|mail)\s+(?:an?\s+)?(?:email\s+)?to\s+([^\s]+)\s+(?:with\s+)?subject\s+["\']?([^"\']+)["\']?\s+(?:and\s+)?(?:message|body|content)\s+["\']?(.+)["\']?/i',
        '/(?:compose|write)\s+(?:an?\s+)?email\s+to\s+([^\s]+)\s*:\s*([^:]+)\s*:\s*(.+)/i'
    ];
    
    // Check patterns
    foreach ($createPatterns as $pattern) {
        if (preg_match($pattern, $command, $matches)) {
            return ['action' => 'create', 'filename' => trim($matches[1]), 'content' => trim($matches[2])];
        }
    }
    
    foreach ($readPatterns as $pattern) {
        if (preg_match($pattern, $command, $matches)) {
            return ['action' => 'read', 'filename' => trim($matches[1])];
        }
    }
    
    foreach ($editPatterns as $pattern) {
        if (preg_match($pattern, $command, $matches)) {
            return ['action' => 'edit', 'filename' => trim($matches[1]), 'content' => trim($matches[2])];
        }
    }
    
    foreach ($deletePatterns as $pattern) {
        if (preg_match($pattern, $command, $matches)) {
            return ['action' => 'delete', 'filename' => trim($matches[1])];
        }
    }
    
    foreach ($searchPatterns as $pattern) {
        if (preg_match($pattern, $command, $matches)) {
            return ['action' => 'search', 'query' => trim($matches[1])];
        }
    }
    
    foreach ($emailPatterns as $pattern) {
        if (preg_match($pattern, $command, $matches)) {
            return [
                'action' => 'email',
                'to' => trim($matches[1]),
                'subject' => trim($matches[2]),
                'body' => trim($matches[3])
            ];
        }
    }
    
    // Help command
    if (preg_match('/^(?:help|commands?|what\s+can\s+you\s+do)/i', $command)) {
        return ['action' => 'help'];
    }
    
    // List files command
    if (preg_match('/^(?:list|show)\s+(?:all\s+)?files?$/i', $command)) {
        return ['action' => 'list'];
    }
    
    return null;
}

/**
 * Get help text
 */
function getHelpText() {
    return "
Available Commands:

FILE OPERATIONS:
- Create file: \"create file example.txt with content Hello World\"
- Read file: \"read file example.txt\" or \"show example.txt\"
- Edit file: \"edit file example.txt with new content here\"
- Delete file: \"delete file example.txt\"
- Search files: \"find files named example\" or \"search for test\"
- List files: \"list files\" or \"show all files\"

EMAIL:
- Send email: \"send email to user@example.com subject Hello message Your message here\"

OTHER:
- Help: \"help\" or \"what can you do\"

Tips:
- You can use natural language - the assistant understands context
- File names can be with or without quotes
- Commands are case-insensitive
";
}
