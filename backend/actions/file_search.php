<?php
/**
 * File Search Action
 * 
 * Searches for files by filename.
 */

require_once __DIR__ . '/../config/db.php';

function searchFiles($input) {
    $query = isset($input['query']) ? trim($input['query']) : '';
    
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return [
            'success' => false,
            'message' => 'Database connection failed.'
        ];
    }
    
    try {
        if (empty($query)) {
            // Return all files if no query
            return listAllFiles();
        }
        
        // Search by filename using LIKE
        $stmt = $pdo->prepare("
            SELECT id, filename, size, mime_type, created_at, updated_at
            FROM files 
            WHERE filename LIKE :query
            ORDER BY created_at DESC
        ");
        
        $stmt->execute([':query' => '%' . $query . '%']);
        $files = $stmt->fetchAll();
        
        return [
            'success' => true,
            'message' => count($files) . ' file(s) found.',
            'files' => $files,
            'query' => $query
        ];
        
    } catch (Exception $e) {
        error_log("File search error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Search failed: ' . $e->getMessage()
        ];
    }
}

function listAllFiles() {
    $pdo = getDbConnection();
    
    if (!$pdo) {
        return [
            'success' => false,
            'message' => 'Database connection failed.'
        ];
    }
    
    try {
        $stmt = $pdo->query("
            SELECT id, filename, size, mime_type, created_at, updated_at
            FROM files 
            ORDER BY created_at DESC
        ");
        
        $files = $stmt->fetchAll();
        
        // Verify files exist on disk and sync database
        $validFiles = [];
        $deletedFiles = [];
        
        foreach ($files as $file) {
            $filepath = UPLOADS_PATH . $file['filename'];
            if (file_exists($filepath)) {
                $validFiles[] = $file;
            } else {
                $deletedFiles[] = $file['filename'];
            }
        }
        
        // Clean up database entries for missing files
        if (!empty($deletedFiles)) {
            $placeholders = str_repeat('?,', count($deletedFiles) - 1) . '?';
            $stmt = $pdo->prepare("DELETE FROM files WHERE filename IN ($placeholders)");
            $stmt->execute($deletedFiles);
        }
        
        return [
            'success' => true,
            'message' => count($validFiles) . ' file(s) found.',
            'files' => $validFiles
        ];
        
    } catch (Exception $e) {
        error_log("List files error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to list files: ' . $e->getMessage()
        ];
    }
}
?>
