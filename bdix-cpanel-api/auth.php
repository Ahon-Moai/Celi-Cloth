<?php
/**
 * Supabase JWT Authentication & Admin RBAC Validator for BDIX Storage API
 * Validates the Supabase session token passed in the Authorization header.
 */

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function send_auth_error($status_code, $message) {
    http_response_code($status_code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => $message,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

function get_bearer_token() {
    $header = null;

    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (!empty($headers['Authorization'])) {
            $header = $headers['Authorization'];
        } elseif (!empty($headers['authorization'])) {
            $header = $headers['authorization'];
        }
    }

    if (!$header) {
        return null;
    }

    if (preg_match('/Bearer\s(\S+)/i', $header, $matches)) {
        return $matches[1];
    }

    return null;
}

function verify_jwt_signature($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    list($head_b64, $payload_b64, $sig_b64) = $parts;

    $signature = base64url_decode($sig_b64);
    $expected_sig = hash_hmac('sha256', "{$head_b64}.{$payload_b64}", $secret, true);

    return hash_equals($expected_sig, $signature);
}

function verify_token_with_supabase_api($token, $supabase_url, $supabase_anon_key) {
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'cURL extension is required on PHP server'];
    }

    $url = rtrim($supabase_url, '/') . '/auth/v1/user';

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'apikey: ' . $supabase_anon_key,
        'Accept: application/json',
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        return ['success' => false, 'error' => 'Supabase connection error: ' . $curl_error];
    }

    if ($http_code !== 200 || !$response) {
        return ['success' => false, 'error' => 'Invalid or expired Supabase token (HTTP ' . $http_code . ')'];
    }

    $user_data = json_decode($response, true);
    if (!$user_data || empty($user_data['id'])) {
        return ['success' => false, 'error' => 'Malformed user response from Supabase'];
    }

    return ['success' => true, 'user' => $user_data];
}

function authenticate_admin($config) {
    $token = get_bearer_token();
    if (!$token) {
        send_auth_error(401, 'Unauthorized: Missing or malformed Bearer token in Authorization header');
    }

    // Inspect JWT structure
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        send_auth_error(401, 'Unauthorized: Invalid JWT format');
    }

    $payload_raw = base64url_decode($parts[1]);
    $payload = json_decode($payload_raw, true);

    if (!$payload || !is_array($payload)) {
        send_auth_error(401, 'Unauthorized: Malformed JWT payload');
    }

    // Check expiration
    if (!empty($payload['exp']) && $payload['exp'] < time()) {
        send_auth_error(401, 'Unauthorized: Supabase session token has expired');
    }

    $user_email = null;
    $user_id = $payload['sub'] ?? null;

    // Method 1: Local signature verification if JWT Secret is configured
    if (!empty($config['supabase_jwt_secret'])) {
        if (!verify_jwt_signature($token, $config['supabase_jwt_secret'])) {
            send_auth_error(401, 'Unauthorized: Invalid JWT signature');
        }
        $user_email = $payload['email'] ?? null;
    } else {
        // Method 2: Verify live with Supabase Auth API
        $api_res = verify_token_with_supabase_api(
            $token,
            $config['supabase_url'],
            $config['supabase_anon_key']
        );

        if (!$api_res['success']) {
            send_auth_error(401, 'Unauthorized: ' . $api_res['error']);
        }

        $user_email = $api_res['user']['email'] ?? null;
        $user_id = $api_res['user']['id'] ?? $user_id;
    }

    if (empty($user_email)) {
        send_auth_error(403, 'Forbidden: User token does not contain an email address');
    }

    // Verify user is in allowed admin emails list
    $allowed_emails = array_map('strtolower', $config['allowed_admin_emails']);
    if (!in_array(strtolower($user_email), $allowed_emails, true)) {
        send_auth_error(403, "Forbidden: Email '{$user_email}' is not authorized to manage product images");
    }

    return [
        'id' => $user_id,
        'email' => $user_email,
        'payload' => $payload,
    ];
}
