<?php
/**
 * Statistics API
 * Returns dashboard statistics
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Get file statistics
    $fileStats = $conn->query("
        SELECT 
            COUNT(*) as total_files,
            COALESCE(SUM(size), 0) as total_size,
            COUNT(DISTINCT type) as file_types
        FROM files
    ")->fetch_assoc();
    
    // Get command statistics
    $commandStats = $conn->query("
        SELECT 
            COUNT(*) as total_commands,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
        FROM command_history
    ")->fetch_assoc();
    
    // Get email statistics
    $emailStats = $conn->query("
        SELECT 
            COUNT(*) as total_emails,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM email_logs
    ")->fetch_assoc();
    
    // Get recent activity
    $recentActivity = [];
    $activityResult = $conn->query("
        SELECT 'command' as type, command as description, status, created_at
        FROM command_history
        ORDER BY created_at DESC
        LIMIT 5
    ");
    
    while ($row = $activityResult->fetch_assoc()) {
        $recentActivity[] = $row;
    }
    
    // Get file type distribution
    $typeDistribution = [];
    $typeResult = $conn->query("
        SELECT type, COUNT(*) as count
        FROM files
        GROUP BY type
        ORDER BY count DESC
        LIMIT 10
    ");
    
    while ($row = $typeResult->fetch_assoc()) {
        $typeDistribution[] = [
            'type' => $row['type'],
            'count' => (int)$row['count']
        ];
    }
    
    // Get command action distribution
    $actionDistribution = [];
    $actionResult = $conn->query("
        SELECT action, COUNT(*) as count
        FROM command_history
        GROUP BY action
        ORDER BY count DESC
    ");
    
    while ($row = $actionResult->fetch_assoc()) {
        $actionDistribution[] = [
            'action' => $row['action'],
            'count' => (int)$row['count']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'files' => [
                'total' => (int)$fileStats['total_files'],
                'total_size' => (int)$fileStats['total_size'],
                'types' => (int)$fileStats['file_types']
            ],
            'commands' => [
                'total' => (int)$commandStats['total_commands'],
                'successful' => (int)$commandStats['successful'],
                'failed' => (int)$commandStats['failed']
            ],
            'emails' => [
                'total' => (int)$emailStats['total_emails'],
                'sent' => (int)$emailStats['sent'],
                'failed' => (int)$emailStats['failed']
            ],
            'recent_activity' => $recentActivity,
            'file_types' => $typeDistribution,
            'action_distribution' => $actionDistribution
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
