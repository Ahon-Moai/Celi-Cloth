<?php
/**
 * BDIX cPanel Hosting Diagnostic / Health Check
 * Accessible via https://files.feliciteclo.com/health.php to verify hosting readiness.
 */

header('Content-Type: application/json; charset=utf-8');

$config = require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cors.php';

// Handle CORS
handle_cors($config);

$upload_dir = rtrim($config['upload_dir'], '/') . '/';
$dir_exists = is_dir($upload_dir);
$dir_writable = $dir_exists && is_writable($upload_dir);

$gd_info = extension_loaded('gd') ? gd_info() : null;

$diagnostics = [
    'status' => ($dir_exists && $dir_writable && extension_loaded('gd') && extension_loaded('curl')) ? 'healthy' : 'warning',
    'timestamp' => date('c'),
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'storage' => [
        'upload_dir' => $upload_dir,
        'dir_exists' => $dir_exists,
        'dir_writable' => $dir_writable,
        'public_base_url' => $config['public_base_url'],
    ],
    'php_limits' => [
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
    ],
    'extensions' => [
        'curl' => extension_loaded('curl'),
        'gd' => extension_loaded('gd'),
        'gd_webp_support' => !empty($gd_info['WebP Support']),
        'fileinfo' => extension_loaded('fileinfo'),
        'openssl' => extension_loaded('openssl'),
        'json' => extension_loaded('json'),
        'exif' => extension_loaded('exif'),
    ],
    'configuration' => [
        'supabase_url' => !empty($config['supabase_url']),
        'admin_emails_count' => count($config['allowed_admin_emails']),
        'max_file_size_mb' => round($config['max_file_size'] / (1024 * 1024), 1),
    ],
];

echo json_encode($diagnostics, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
