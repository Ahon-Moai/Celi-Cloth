<?php
/**
 * BDIX cPanel Product Image Upload API
 * Handles single & multiple image uploads, validation, optimization, and public URL generation.
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

// Ensure upload directory exists and is writable
$upload_dir = rtrim($config['upload_dir'], '/') . '/';
if (!is_dir($upload_dir)) {
    if (!@mkdir($upload_dir, 0755, true)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Upload directory does not exist and could not be created on server.',
        ]);
        exit;
    }
}

if (!is_writable($upload_dir)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Upload directory is not writable. Please set folder permissions to 755 or 775.',
    ]);
    exit;
}

/**
 * Normalizes $_FILES into a clean list of file items
 */
function normalize_files_array() {
    $files = [];

    // Check common upload field names
    $field_keys = ['files', 'images', 'file', 'image'];

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

$uploaded_items = normalize_files_array();

if (empty($uploaded_items)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'No files provided in request. Use field name "file", "files[]", "image", or "images[]".',
    ]);
    exit;
}

/**
 * Optimizes, resizes, and saves the image safely
 */
function process_and_save_image($file, $config, $upload_dir) {
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
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $real_mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($real_mime, $config['allowed_mime_types'], true)) {
        return ['success' => false, 'error' => "File MIME type '{$real_mime}' is not an allowed image format."];
    }

    // 4. Verify image content using getimagesize
    $img_info = @getimagesize($file['tmp_name']);
    if ($img_info === false) {
        return ['success' => false, 'error' => 'File appears to be corrupted or is not a valid image.'];
    }

    $orig_width = $img_info[0];
    $orig_height = $img_info[1];
    $img_type = $img_info[2];

    // 5. Generate secure, unique filename (No user-supplied path components)
    $unique_id = bin2hex(random_bytes(8));
    $timestamp = time();

    // Determine target extension
    $target_ext = $ext;
    $should_convert_webp = $config['convert_to_webp'] && function_exists('imagewebp');
    if ($should_convert_webp) {
        $target_ext = 'webp';
    }

    $filename = "felicite_{$timestamp}_{$unique_id}.{$target_ext}";
    $destination = $upload_dir . $filename;

    // 6. Image processing via GD if available
    $processed = false;

    if (extension_loaded('gd')) {
        $source_img = null;

        switch ($img_type) {
            case IMAGETYPE_JPEG:
                $source_img = @imagecreatefromjpeg($file['tmp_name']);
                // Auto-rotate if EXIF orientation exists
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
            $max_dim = $config['max_dimension'];
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
                $saved = imagewebp($target_img, $destination, $config['webp_quality']);
            } elseif ($target_ext === 'png') {
                $saved = imagepng($target_img, $destination, $config['png_compression']);
            } else {
                $saved = imagejpeg($target_img, $destination, $config['jpeg_quality']);
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
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return ['success' => false, 'error' => 'Failed to save uploaded file to destination folder.'];
        }
    }

    // Set standard file permissions (readable by web server)
    @chmod($destination, 0644);

    $public_url = $config['public_base_url'] . $filename;
    $final_size = filesize($destination);

    return [
        'success' => true,
        'filename' => $filename,
        'url' => $public_url,
        'size' => $final_size,
        'width' => $orig_width,
        'height' => $orig_height,
        'format' => $target_ext,
    ];
}

$results = [];
$errors = [];

foreach ($uploaded_items as $item) {
    $res = process_and_save_image($item, $config, $upload_dir);
    if ($res['success']) {
        $results[] = [
            'original_name' => $item['name'],
            'filename' => $res['filename'],
            'url' => $res['url'],
            'size' => $res['size'],
            'width' => $res['width'],
            'height' => $res['height'],
            'format' => $res['format'],
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
    'message' => count($results) . ' image(s) uploaded successfully.',
    'files' => $results,
    // Convenience property for single file uploads
    'url' => $results[0]['url'],
    'filename' => $results[0]['filename'],
    'errors' => $errors,
], JSON_UNESCAPED_SLASHES);
