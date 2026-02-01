<?php
/**
 * Command History API
 * Retrieves and manages command history
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get history with optional filters
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        $action = isset($_GET['action']) ? trim($_GET['action']) : '';
        $status = isset($_GET['status']) ? trim($_GET['status']) : '';
        
        // Limit max results
        $limit = min($limit, 100);
        
        $sql = "SELECT id, command, action, status, result, created_at FROM command_history WHERE 1=1";
        $params = [];
        $types = '';
        
        if (!empty($action)) {
            $sql .= " AND action = ?";
            $params[] = $action;
            $types .= 's';
        }
        
        if (!empty($status)) {
            $sql .= " AND status = ?";
            $params[] = $status;
            $types .= 's';
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $history = [];
        while ($row = $result->fetch_assoc()) {
            $history[] = [
                'id' => (int)$row['id'],
                'command' => $row['command'],
                'action' => $row['action'],
                'status' => $row['status'],
                'result' => $row['result'],
                'created_at' => $row['created_at']
            ];
        }
        
        $stmt->close();
        
        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM command_history";
        $countResult = $conn->query($countSql);
        $total = $countResult->fetch_assoc()['total'];
        
        echo json_encode([
            'success' => true,
            'data' => [
                'history' => $history,
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Clear history
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($id > 0) {
            // Delete specific entry
            $stmt = $conn->prepare("DELETE FROM command_history WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $affected = $stmt->affected_rows;
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => $affected > 0 ? 'Entry deleted' : 'Entry not found'
            ]);
        } else {
            // Clear all history
            $conn->query("TRUNCATE TABLE command_history");
            
            echo json_encode([
                'success' => true,
                'message' => 'History cleared'
            ]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
