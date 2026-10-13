<?php
/**
 * BDIX cPanel Product Image Storage API - Configuration
 * Domain: https://files.feliciteclo.com
 * Path:   /uploads/products/
 */

// Prevent direct browser execution of config
if (basename($_SERVER['PHP_SELF']) === 'config.php') {
    http_response_code(403);
    exit('Access denied');
}

return [
    // -------------------------------------------------------------
    // Supabase Authentication Settings
    // -------------------------------------------------------------
    // Your Supabase project URL (used to verify admin JWT tokens)
    'supabase_url' => getenv('SUPABASE_URL') ?: 'https://ketmwspwbfqziyhvdeqk.supabase.co',
    
    // Supabase Anon / Public Key (used for calling Supabase Auth API)
    'supabase_anon_key' => getenv('SUPABASE_ANON_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldG13c3B3YmZxeml5aHZkZXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NjAxNDcsImV4cCI6MjA5NzUzNjE0N30.dMJLD2WbtZLxvw1LTYlDGAnzKNER9rukGQ-yHsi8dXU',

    // Optional: Supabase JWT Secret (found in Supabase Settings > API > JWT Secret)
    // If provided, allows fast local HS256 JWT signature verification without an external HTTP request.
    'supabase_jwt_secret' => getenv('SUPABASE_JWT_SECRET') ?: '',

    // Authorized Admin Emails who are permitted to upload and delete images
    'allowed_admin_emails' => [
        'mimpy124ahon124@gmail.com',
        'feliciteclothing@gmail.com',
        'adminloginpaidbase@gmail.com',
    ],

    // -------------------------------------------------------------
    // Storage & URL Configuration
    // -------------------------------------------------------------
    // Absolute physical path on cPanel server where images and videos will be saved
    // Auto-detects whether config is directly in public_html or inside an /api subfolder
    'upload_dir' => (is_dir(__DIR__ . '/uploads/products/') 
        ? __DIR__ . '/uploads/products/' 
        : (is_dir(dirname(__DIR__) . '/uploads/products/') 
            ? dirname(__DIR__) . '/uploads/products/' 
            : __DIR__ . '/uploads/products/')),

    'video_upload_dir' => (is_dir(__DIR__ . '/uploads/videos/') 
        ? __DIR__ . '/uploads/videos/' 
        : (is_dir(dirname(__DIR__) . '/uploads/videos/') 
            ? dirname(__DIR__) . '/uploads/videos/' 
            : __DIR__ . '/uploads/videos/')),

    // Public domain URL pointing to the /uploads/products/ directory
    // Format: https://files.feliciteclo.com/uploads/products/
    'public_base_url' => rtrim(getenv('PUBLIC_BASE_URL') ?: 'https://files.feliciteclo.com/uploads/products', '/') . '/',

    // Public domain URL pointing to the /uploads/videos/ directory
    'video_public_base_url' => rtrim(getenv('VIDEO_PUBLIC_BASE_URL') ?: 'https://files.feliciteclo.com/uploads/videos', '/') . '/',

    // Maximum file upload size in bytes (100 MB for videos, 25 MB for images)
    'max_file_size' => 100 * 1024 * 1024,

    // Allowed file extensions (Images & Optimized Videos)
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov', 'm4v'],

    // Allowed MIME types
    'allowed_mime_types' => [
        'image/jpeg',
        'image/jpg',
        'image/pjpeg',
        'image/png',
        'image/webp',
        'image/x-webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-m4v',
    ],

    // -------------------------------------------------------------
    // Image Optimization & Processing Settings (PHP GD)
    // -------------------------------------------------------------
    // Resize images exceeding this maximum width or height while keeping aspect ratio
    'max_dimension' => 2400,

    // JPEG output quality (0 - 100)
    'jpeg_quality' => 85,

    // WebP output quality (0 - 100)
    'webp_quality' => 85,

    // PNG compression level (0 - 9)
    'png_compression' => 8,

    // Automatically convert uploaded JPEG/PNG to WebP if supported by PHP GD
    'convert_to_webp' => true,

    // -------------------------------------------------------------
    // CORS Configuration
    // -------------------------------------------------------------
    // Explicit allowed frontend origins
    'allowed_origins' => [
        'https://feliciteclo.com',
        'https://www.feliciteclo.com',
        'http://localhost:3000',
        'http://localhost:5173',
    ],

    // Regex pattern to allow all Vercel production & preview deployments
    // e.g. https://felicite-*.vercel.app or any *.vercel.app domain
    'allowed_origin_regex' => '/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/i',
];
