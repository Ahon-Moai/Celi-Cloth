<?php
/**
 * BDIX cPanel Product Media Upload API (Images & Videos)
 * Domain: https://files.feliciteclo.com
 * Handles single & multiple image/video uploads, Base64 JSON payloads,
 * validation, optimization, and public URL generation.
 */

// Strict error reporting for debugging while ensuring clean JSON output
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

$config = require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/auth.php';

// Handle CORS
handle_cors($config);

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method Not Allowed. Use POST for file uploads.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Authenticate Supabase Admin
$admin_user = authenticate_admin($config);

// Ensure image upload directory exists and is writable
$upload_dir = rtrim($config['upload_dir'], '/') . '/';
if (!is_dir($upload_dir)) {
    @mkdir($upload_dir, 0755, true);
}

// Ensure video upload directory exists and is writable
$video_upload_dir = rtrim($config['video_upload_dir'] ?? ($upload_dir . '../videos/'), '/') . '/';
if (!is_dir($video_upload_dir)) {
    @mkdir($video_upload_dir, 0755, true);
}

/**
 * Normalizes $_FILES into a clean list of file items
 */
function normalize_files_array() {
    $files = [];

    // Check common upload field names
    $field_keys = ['files', 'images', 'file', 'image', 'video', 'videos', 'files[]', 'images[]', 'videos[]'];

    foreach ($field_keys as $key) {
        if (!isset($_FILES[$key])) {
            continue;
        }

        $f = $_FILES[$key];

        // Multiple files uploaded under single field (e.g. files[])
        if (is_array($f['name'])) {
            $count = count($f['name']);
            for ($i = 0; $i < $count; $i++) {
                if (empty($f['name'][$i])) continue;
                $files[] = [
                    'name' => $f['name'][$i],
                    'type' => $f['type'][$i] ?? '',
                    'tmp_name' => $f['tmp_name'][$i],
                    'error' => $f['error'][$i],
                    'size' => $f['size'][$i],
                ];
            }
        } else {
            // Single file
            if (!empty($f['name'])) {
                $files[] = $f;
            }
        }
    }

    return $files;
}

/**
 * Parse JSON Base64 upload payloads (Fallback for when multipart is stripped by WAF/cPanel)
 */
function parse_json_base64_payloads() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }

    $first_char = substr(trim($raw), 0, 1);
    if ($first_char !== '{' && $first_char !== '[') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!$data || !is_array($data)) {
        return [];
    }

    $items = [];

    // Single item format: { data: "data:...;base64,...", filename: "my-image.webp" }
    if (isset($data['data']) && is_string($data['data'])) {
        $items[] = [
            'data' => $data['data'],
            'filename' => $data['filename'] ?? ('upload_' . time() . '.webp'),
        ];
    }
    // Multiple items format: { files: [ { data: "...", filename: "..." }, ... ] }
    elseif (isset($data['files']) && is_array($data['files'])) {
        foreach ($data['files'] as $item) {
            if (isset($item['data']) && is_string($item['data'])) {
                $items[] = [
                    'data' => $item['data'],
                    'filename' => $item['filename'] ?? ('upload_' . time() . '.webp'),
                ];
            }
        }
    }

    $normalized = [];
    $tmp_dir = sys_get_temp_dir();

    foreach ($items as $item) {
        $base64_str = $item['data'];
        $clean_b64 = preg_replace('/^data:[^;]+;base64,/', '', $base64_str);
        $decoded = base64_decode($clean_b64);
        if ($decoded === false || strlen($decoded) === 0) {
            continue;
        }

        $tmp_file = tempnam($tmp_dir, 'felicite_b64_');
        file_put_contents($tmp_file, $decoded);

        $normalized[] = [
            'name' => $item['filename'],
            'type' => '',
            'tmp_name' => $tmp_file,
            'error' => UPLOAD_ERR_OK,
            'size' => strlen($decoded),
            'is_temp_created' => true,
        ];
    }

    return $normalized;
}

$uploaded_items = normalize_files_array();

// If empty, try JSON Base64 payload
if (empty($uploaded_items)) {
    $uploaded_items = parse_json_base64_payloads();
}

// If still empty, determine error cause
if (empty($uploaded_items)) {
    $content_length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    $post_max = ini_get('post_max_size');
    
    if ($content_length > 0) {
        http_response_code(413);
        echo json_encode([
            'success' => false,
            'error' => "Request payload exceeds server limit ({$post_max}). Please upload using client-side optimized images.",
            'details' => [
                'content_length_bytes' => $content_length,
                'post_max_size' => $post_max,
            ],
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'No files provided in request. Use field name "file", "files[]", "video", or "image".',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Optimizes, resizes, and saves an image or video safely
 */
function process_and_save_media($file, $config, $upload_dir, $video_upload_dir) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $upload_errors = [
            UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
            UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive specified in the HTML form.',
            UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder on server.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.',
        ];
        $msg = $upload_errors[$file['error']] ?? ('Unknown upload error #' . $file['error']);
        return ['success' => false, 'error' => $msg];
    }

    // 1. File size check
    if ($file['size'] > $config['max_file_size']) {
        $max_mb = round($config['max_file_size'] / (1024 * 1024), 1);
        return ['success' => false, 'error' => "File exceeds maximum size limit of {$max_mb} MB."];
    }

    // 2. Extension check
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $config['allowed_extensions'], true)) {
        return ['success' => false, 'error' => "Invalid file extension '{$ext}'. Allowed: " . implode(', ', $config['allowed_extensions'])];
    }

    // 3. MIME type inspection via Fileinfo
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $real_mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($real_mime, $config['allowed_mime_types'], true)) {
            // Also allow standard octet-stream for valid extensions if finfo is strict
            if ($real_mime !== 'application/octet-stream' && $real_mime !== 'video/mp4') {
                return ['success' => false, 'error' => "File format '{$real_mime}' is not permitted."];
            }
        }
    }

    $unique_id = bin2hex(random_bytes(8));
    $timestamp = time();
    $is_video = in_array($ext, ['mp4', 'webm', 'mov', 'm4v'], true);

    // ==========================================
    // Video File Handling
    // ==========================================
    if ($is_video) {
        $filename = "felicite_vid_{$timestamp}_{$unique_id}.{$ext}";
        $destination = $video_upload_dir . $filename;

        if (isset($file['is_temp_created'])) {
            $saved = @rename($file['tmp_name'], $destination) || @copy($file['tmp_name'], $destination);
            @unlink($file['tmp_name']);
        } else {
            $saved = @move_uploaded_file($file['tmp_name'], $destination);
        }

        if (!$saved) {
            return ['success' => false, 'error' => 'Failed to save video to destination directory.'];
        }

        @chmod($destination, 0644);
        $public_base = $config['video_public_base_url'] ?? 'https://files.feliciteclo.com/uploads/videos/';
        $public_url = rtrim($public_base, '/') . '/' . $filename;

        return [
            'success' => true,
            'filename' => $filename,
            'url' => $public_url,
            'size' => filesize($destination),
            'format' => $ext,
            'isVideo' => true,
        ];
    }

    // ==========================================
    // Image File Handling
    // ==========================================
    $img_info = @getimagesize($file['tmp_name']);
    if ($img_info === false) {
        // Fallback move if GD cannot inspect but file is verified
        $filename = "felicite_{$timestamp}_{$unique_id}.{$ext}";
        $destination = $upload_dir . $filename;
        if (isset($file['is_temp_created'])) {
            @rename($file['tmp_name'], $destination);
        } else {
            @move_uploaded_file($file['tmp_name'], $destination);
        }
        @chmod($destination, 0644);
        return [
            'success' => true,
            'filename' => $filename,
            'url' => rtrim($config['public_base_url'], '/') . '/' . $filename,
            'size' => filesize($destination),
            'format' => $ext,
        ];
    }

    $orig_width = $img_info[0];
    $orig_height = $img_info[1];
    $img_type = $img_info[2];

    // Determine target extension
    $target_ext = $ext;
    $should_convert_webp = $config['convert_to_webp'] && function_exists('imagewebp');
    if ($should_convert_webp) {
        $target_ext = 'webp';
    }

    $filename = "felicite_{$timestamp}_{$unique_id}.{$target_ext}";
    $destination = $upload_dir . $filename;

    // Image processing via GD if available
    $processed = false;

    if (extension_loaded('gd')) {
        $source_img = null;

        switch ($img_type) {
            case IMAGETYPE_JPEG:
                $source_img = @imagecreatefromjpeg($file['tmp_name']);
                if ($source_img && function_exists('exif_read_data')) {
                    $exif = @exif_read_data($file['tmp_name']);
                    if (!empty($exif['Orientation'])) {
                        switch ($exif['Orientation']) {
                            case 3:
                                $source_img = imagerotate($source_img, 180, 0);
                                break;
                            case 6:
                                $source_img = imagerotate($source_img, -90, 0);
                                list($orig_width, $orig_height) = [$orig_height, $orig_width];
                                break;
                            case 8:
                                $source_img = imagerotate($source_img, 90, 0);
                                list($orig_width, $orig_height) = [$orig_height, $orig_width];
                                break;
                        }
                    }
                }
                break;
            case IMAGETYPE_PNG:
                $source_img = @imagecreatefrompng($file['tmp_name']);
                break;
            case IMAGETYPE_WEBP:
                if (function_exists('imagecreatefromwebp')) {
                    $source_img = @imagecreatefromwebp($file['tmp_name']);
                }
                break;
        }

        if ($source_img) {
            $max_dim = $config['max_dimension'] ?? 2400;
            $new_width = $orig_width;
            $new_height = $orig_height;

            // Scale down if exceeds max_dimension
            if ($orig_width > $max_dim || $orig_height > $max_dim) {
                if ($orig_width >= $orig_height) {
                    $new_width = $max_dim;
                    $new_height = (int) round(($orig_height / $orig_width) * $max_dim);
                } else {
                    $new_height = $max_dim;
                    $new_width = (int) round(($orig_width / $orig_height) * $max_dim);
                }
            }

            // Create canvas
            $target_img = imagecreatetruecolor($new_width, $new_height);

            // Handle transparency for PNG & WebP
            imagealphablending($target_img, false);
            imagesavealpha($target_img, true);

            // Resample
            imagecopyresampled(
                $target_img,
                $source_img,
                0, 0, 0, 0,
                $new_width, $new_height,
                $orig_width, $orig_height
            );

            // Output based on target format
            if ($target_ext === 'webp' && function_exists('imagewebp')) {
                $saved = imagewebp($target_img, $destination, $config['webp_quality'] ?? 85);
            } elseif ($target_ext === 'png') {
                $saved = imagepng($target_img, $destination, $config['png_compression'] ?? 8);
            } else {
                $saved = imagejpeg($target_img, $destination, $config['jpeg_quality'] ?? 85);
            }

            imagedestroy($source_img);
            imagedestroy($target_img);

            if ($saved) {
                $processed = true;
                $orig_width = $new_width;
                $orig_height = $new_height;
            }
        }
    }

    // Fallback: move uploaded file directly if GD is not present or processing failed
    if (!$processed) {
        $filename = "felicite_{$timestamp}_{$unique_id}.{$ext}";
        $destination = $upload_dir . $filename;
        if (isset($file['is_temp_created'])) {
            @rename($file['tmp_name'], $destination);
        } else {
            @move_uploaded_file($file['tmp_name'], $destination);
        }
    }

    // Clean up temporary file if created from base64
    if (isset($file['is_temp_created']) && file_exists($file['tmp_name'])) {
        @unlink($file['tmp_name']);
    }

    // Set standard file permissions (readable by web server)
    @chmod($destination, 0644);

    $public_url = rtrim($config['public_base_url'], '/') . '/' . $filename;
    $final_size = filesize($destination);

    return [
        'success' => true,
        'filename' => $filename,
        'url' => $public_url,
        'size' => $final_size,
        'width' => $orig_width,
        'height' => $orig_height,
        'format' => $processed ? $target_ext : $ext,
    ];
}

$results = [];
$errors = [];

foreach ($uploaded_items as $item) {
    $res = process_and_save_media($item, $config, $upload_dir, $video_upload_dir);
    if ($res['success']) {
        $results[] = [
            'original_name' => $item['name'],
            'filename' => $res['filename'],
            'url' => $res['url'],
            'size' => $res['size'],
            'width' => $res['width'] ?? null,
            'height' => $res['height'] ?? null,
            'format' => $res['format'],
            'isVideo' => $res['isVideo'] ?? false,
        ];
    } else {
        $errors[] = [
            'file' => $item['name'],
            'error' => $res['error'],
        ];
    }
}

if (empty($results)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'All file uploads failed.',
        'details' => $errors,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => count($results) . ' file(s) uploaded successfully.',
    'files' => $results,
    // Convenience properties for single uploads
    'url' => $results[0]['url'],
    'filename' => $results[0]['filename'],
    'errors' => $errors,
], JSON_UNESCAPED_SLASHES);
