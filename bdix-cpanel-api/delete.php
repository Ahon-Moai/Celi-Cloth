<?php
/**
 * BDIX cPanel Product Image Deletion API
 * Allows authorized admins to delete uploaded product images from /uploads/products/
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

$config = require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/auth.php';

// Handle CORS
handle_cors($config);

// Allow POST or DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method Not Allowed. Use POST or DELETE.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Authenticate Admin
$admin_user = authenticate_admin($config);

// Read input from JSON body, form data, or query string
$raw_input = file_get_contents('php://input');
$json_data = json_decode($raw_input, true) ?: [];

$target = $json_data['filename'] ?? $json_data['url'] ?? $_POST['filename'] ?? $_POST['url'] ?? $_GET['file'] ?? '';

if (empty($target)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing "filename" or "url" parameter in request.',
    ]);
    exit;
}

// Extract pure basename from URL or path
$parsed_path = parse_url($target, PHP_URL_PATH);
$filename = basename($parsed_path ?: $target);

// 1. Strict filename character whitelist (Prevents path traversal, injection, or deletion of system files)
if (!preg_match('/^[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|webp|mp4|webm|mov|m4v)$/i', $filename)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid or disallowed filename format.',
    ]);
    exit;
}

// Disallow special dotfiles or double dots
if ($filename === '.' || $filename === '..' || strpos($filename, '..') !== false) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Path traversal characters are prohibited.',
    ]);
    exit;
}

$upload_dir = realpath(rtrim($config['upload_dir'], '/'));
$video_upload_dir = realpath(rtrim($config['video_upload_dir'] ?? ($config['upload_dir'] . '../videos/'), '/'));

$file_path = null;
$target_dir = null;

if ($upload_dir && file_exists($upload_dir . DIRECTORY_SEPARATOR . $filename)) {
    $file_path = $upload_dir . DIRECTORY_SEPARATOR . $filename;
    $target_dir = $upload_dir;
} elseif ($video_upload_dir && file_exists($video_upload_dir . DIRECTORY_SEPARATOR . $filename)) {
    $file_path = $video_upload_dir . DIRECTORY_SEPARATOR . $filename;
    $target_dir = $video_upload_dir;
}

// Check if file exists in either directory
if (!$file_path || !file_exists($file_path)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => "File '{$filename}' not found in upload directories.",
    ]);
    exit;
}

// Verify realpath is strictly inside target upload directory
$real_file_path = realpath($file_path);
if ($real_file_path === false || strpos($real_file_path, $target_dir) !== 0) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Security violation: Access outside target directory is prohibited.',
    ]);
    exit;
}

// Execute safe deletion
if (!@unlink($real_file_path)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => "Failed to delete file '{$filename}'. Check server file permissions.",
    ]);
    exit;
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => "Image '{$filename}' was deleted successfully.",
    'filename' => $filename,
    'deleted_by' => $admin_user['email'],
], JSON_UNESCAPED_SLASHES);
