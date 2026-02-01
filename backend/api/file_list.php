<?php
/**
 * File List API
 * Lists all files from the database with optional filtering
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
    
    // Get filter parameters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $type = isset($_GET['type']) ? trim($_GET['type']) : '';
    $sort = isset($_GET['sort']) ? trim($_GET['sort']) : 'created_at';
    $order = isset($_GET['order']) ? strtoupper(trim($_GET['order'])) : 'DESC';
    
    // Validate sort column
    $allowedSorts = ['name', 'type', 'size', 'created_at', 'updated_at'];
    if (!in_array($sort, $allowedSorts)) {
        $sort = 'created_at';
    }
    
    // Validate order
    if (!in_array($order, ['ASC', 'DESC'])) {
        $order = 'DESC';
    }
    
    // Build query
    $sql = "SELECT id, name, type, content, size, path, created_at, updated_at FROM files WHERE 1=1";
    $params = [];
    $types = '';
    
    if (!empty($search)) {
        $sql .= " AND (name LIKE ? OR content LIKE ?)";
        $searchParam = "%{$search}%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= 'ss';
    }
    
    if (!empty($type)) {
        $sql .= " AND type = ?";
        $params[] = $type;
        $types .= 's';
    }
    
    $sql .= " ORDER BY {$sort} {$order}";
    
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $files = [];
    while ($row = $result->fetch_assoc()) {
        $files[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'content' => $row['content'],
            'size' => (int)$row['size'],
            'path' => $row['path'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }
    
    $stmt->close();
    
    // Get statistics
    $statsQuery = "SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(size), 0) as total_size,
        COUNT(DISTINCT type) as unique_types
        FROM files";
    $statsResult = $conn->query($statsQuery);
    $stats = $statsResult->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'files' => $files,
            'stats' => [
                'total_files' => (int)$stats['total_files'],
                'total_size' => (int)$stats['total_size'],
                'unique_types' => (int)$stats['unique_types']
            ]
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch files: ' . $e->getMessage()
    ]);
}
