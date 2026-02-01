-- Virtual Assistant Database Setup
-- Run this SQL file to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS virtual_assistant 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE virtual_assistant;

-- Files table - stores file metadata and content
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'txt',
    content LONGTEXT,
    size INT DEFAULT 0,
    path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name),
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email logs table - stores sent email records
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Command history table - logs all assistant commands
CREATE TABLE IF NOT EXISTS command_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    command TEXT NOT NULL,
    action VARCHAR(50) NOT NULL,
    status ENUM('success', 'error') DEFAULT 'success',
    result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action (action),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact messages table - stores contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log table - general activity tracking
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO files (name, type, content, size, path) VALUES
('welcome.txt', 'txt', 'Welcome to Virtual Assistant! This is a sample file.', 52, '/files/welcome.txt'),
('notes.md', 'md', '# My Notes\n\nThis is a sample markdown file.\n\n## Features\n- File management\n- Email sending\n- Command history', 108, '/files/notes.md'),
('config.json', 'json', '{\n  "app_name": "Virtual Assistant",\n  "version": "1.0.0",\n  "author": "Developer"\n}', 85, '/files/config.json');

-- Insert sample command history
INSERT INTO command_history (command, action, status, result) VALUES
('create file welcome.txt with content Welcome to Virtual Assistant!', 'create', 'success', 'File created successfully'),
('list all files', 'list', 'success', 'Found 3 files');

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON virtual_assistant.* TO 'your_username'@'localhost';
-- FLUSH PRIVILEGES;
