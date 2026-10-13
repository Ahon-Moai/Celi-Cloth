<?php
/**
 * CORS Handler for BDIX Image Storage API
 * Handles preflight requests and ensures Vercel & custom domain can communicate with cPanel.
 */

function handle_cors($config) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    $is_allowed = false;

    if (!empty($origin)) {
        // 1. Check exact matches in config
        if (in_array($origin, $config['allowed_origins'], true)) {
            $is_allowed = true;
        }
        // 2. Check Vercel regex pattern (*.vercel.app)
        elseif (!empty($config['allowed_origin_regex']) && preg_match($config['allowed_origin_regex'], $origin)) {
            $is_allowed = true;
        }
        // 3. Allow Cloud Run / dev preview domains or netlify or feliciteclo.com
        elseif (preg_match('/^https:\/\/([a-zA-Z0-9-]+\.)*(run\.app|netlify\.app|feliciteclo\.com)$/i', $origin)) {
            $is_allowed = true;
        }
    }

    if ($is_allowed && !empty($origin)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Credentials: true");
    } else {
        // Fallback for direct browser calls or non-origin requests
        header("Access-Control-Allow-Origin: *");
    }

    header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With, Accept");
    header("Access-Control-Max-Age: 86400");

    // Preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
