# FELICITE™ — BDIX cPanel Image Storage API Deployment Guide

This guide provides complete, step-by-step instructions to deploy the PHP Image Storage API to your **HostSeba BDIX cPanel Hosting** account for **https://files.feliciteclo.com**.

No SSH access is required. Everything is done through **cPanel File Manager** and the **cPanel Web Interface**.

---

## Architecture Overview

```
┌─────────────────────────────────┐       ┌───────────────────────────────────┐
│     Vercel Frontend (React)     │       │     Supabase (Backend / DB)       │
│     feliciteclo.com             │       │     iwndirvcgkzgqpmjehuq          │
│                                 │       │                                   │
│  - Admin logs in                ├──────►│  - Issues JWT Access Token        │
│  - Selects product images       │       │  - Stores Product Records & URLs  │
│  - Submits Product to Supabase  ├──────►│  - Manages Orders & Inventory    │
└────────────────┬────────────────┘       └───────────────────────────────────┘
                 │
                 │ POST /upload.php
                 │ Authorization: Bearer <Supabase-JWT>
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 HostSeba BDIX cPanel Hosting (PHP API)                      │
│                 Domain: https://files.feliciteclo.com                       │
│                                                                             │
│  1. cors.php: Validates Vercel / feliciteclo.com origins                    │
│  2. auth.php: Validates Supabase JWT & verifies admin email                 │
│  3. upload.php: Resizes, optimizes (WebP/JPEG), strips EXIF metadata        │
│  4. Stores images into: /uploads/products/{unique-filename}                 │
│  5. Returns: https://files.feliciteclo.com/uploads/products/{unique-filename}│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Prerequisites & Hosting Requirements

Ensure your HostSeba cPanel hosting meets these standard PHP settings:

| Requirement | Recommended Value | Where to Check in cPanel |
| :--- | :--- | :--- |
| **PHP Version** | **PHP 8.0, 8.1, or 8.2** (PHP 7.4 minimum) | **cPanel > Select PHP Version** |
| **PHP Extensions** | `gd`, `curl`, `fileinfo`, `openssl`, `json`, `mbstring`, `exif` | **cPanel > Select PHP Version > Extensions** |
| **upload_max_filesize** | `20M` (or `30M`) | **cPanel > Select PHP Version > Options** |
| **post_max_size** | `25M` (or `35M`) | **cPanel > Select PHP Version > Options** |
| **memory_limit** | `128M` (or `256M`) | **cPanel > Select PHP Version > Options** |
| **max_execution_time** | `120` seconds | **cPanel > Select PHP Version > Options** |

---

## 2. Domain & Subdomain Configuration in cPanel

1. Log in to your **HostSeba cPanel**.
2. Go to **Domains** (or **Subdomains** depending on your cPanel theme).
3. Create the subdomain:
   - **Subdomain**: `files`
   - **Domain**: `feliciteclo.com`
   - **Document Root**: Enter `public_html/files` (or `files.feliciteclo.com` depending on default).
4. **SSL Certificate**:
   - In cPanel, navigate to **SSL/TLS Status** or **Let's Encrypt SSL**.
   - Issue a free SSL certificate for `files.feliciteclo.com` so HTTPS is active.
5. **DNS Setup**:
   - In your domain DNS manager (e.g., Cloudflare, Namecheap, or cPanel Zone Editor), ensure an **A record** exists:
     - Name: `files`
     - Type: `A`
     - Value: `[Your HostSeba BDIX Server IP]`
     *(Note: If using Cloudflare, you can set proxy status to DNS Only or Proxied with SSL mode "Full")*

---

## 3. Files & Directory Layout in cPanel File Manager

In cPanel, open **File Manager** and navigate into the document root for `files.feliciteclo.com` (for example, `/public_html/files/`).

You must upload/create the following exact folder structure:

```
[Subdomain Document Root: public_html/files/]
│
├── .htaccess                  (Root .htaccess: enables Bearer header & security)
├── config.php                 (Main API configuration & admin whitelist)
├── cors.php                   (Cross-Origin Resource Sharing handler)
├── auth.php                   (Supabase JWT token validator)
├── upload.php                 (Single & multiple image upload endpoint)
├── delete.php                 (Secure image deletion endpoint)
├── health.php                 (Hosting diagnostic / health check)
│
└── uploads/
    └── products/
        ├── .htaccess          (CRITICAL: Prevents script execution inside uploads)
        └── index.html         (Prevents folder directory listing)
```

---

## 4. Step-by-Step Upload Instructions (File Manager)

### Step 4.1 — Upload Root Files
1. In cPanel **File Manager**, enter the document root of `files.feliciteclo.com`.
2. Click **Upload** in the top toolbar.
3. Upload the following files from the `bdix-cpanel-api/` folder:
   - `.htaccess`
   - `config.php`
   - `cors.php`
   - `auth.php`
   - `upload.php`
   - `delete.php`
   - `health.php`

*(Tip: In cPanel File Manager, make sure **Settings > Show Hidden Files (dotfiles)** is checked so you can view `.htaccess`)*

### Step 4.2 — Create the Uploads Folder
1. Inside the root of `files.feliciteclo.com`, click **+ Folder** and name it:
   `uploads`
2. Enter the new `uploads` folder, click **+ Folder** and name it:
   `products`
3. Enter `uploads/products/` and upload:
   - `.htaccess` (from `bdix-cpanel-api/uploads/products/.htaccess`)
   - `index.html` (from `bdix-cpanel-api/uploads/products/index.html`)

### Step 4.3 — Set Folder Permissions
Ensure the web server has write permission to store uploaded images:
1. Right-click the `uploads` folder > **Change Permissions** > Set to `755` (or `drwxr-xr-x`).
2. Right-click the `uploads/products` folder > **Change Permissions** > Set to `755`.
3. If your cPanel host uses a strict user group mode and 755 produces a write error, change `uploads/products` to `775`.

---

## 5. Editing `config.php` in cPanel

In cPanel File Manager, right-click `config.php` and click **Edit**:

```php
<?php
return [
    // 1. Supabase Project URL (same as your React app)
    'supabase_url' => 'https://iwndirvcgkzgqpmjehuq.supabase.co',

    // 2. Supabase Anon Key (Public)
    'supabase_anon_key' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

    // 3. Optional: Supabase JWT Secret (found in Supabase Settings > API > JWT Secret)
    // If entered, enables lightning-fast local cryptographic validation of tokens.
    'supabase_jwt_secret' => '',

    // 4. Authorized Admin Emails (Only these emails can upload or delete images)
    'allowed_admin_emails' => [
        'mimpy124ahon124@gmail.com',
        'feliciteclothing@gmail.com',
        'adminloginpaidbase@gmail.com',
    ],

    // 5. Upload directory physical path on cPanel
    'upload_dir' => __DIR__ . '/uploads/products/',

    // 6. Public base URL for product images
    'public_base_url' => 'https://files.feliciteclo.com/uploads/products/',

    // 7. Max file size in bytes (10MB)
    'max_file_size' => 10 * 1024 * 1024,

    // 8. Allowed extensions & MIME types
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
    'allowed_mime_types' => ['image/jpeg', 'image/png', 'image/webp'],

    // 9. Optimization settings
    'max_dimension'   => 2400,
    'jpeg_quality'    => 85,
    'webp_quality'    => 85,
    'png_compression' => 8,
    'convert_to_webp' => true,

    // 10. Allowed Frontend Origins (CORS)
    'allowed_origins' => [
        'https://feliciteclo.com',
        'https://www.feliciteclo.com',
        'http://localhost:3000',
        'http://localhost:5173',
    ],
    'allowed_origin_regex' => '/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/i',
];
```

Click **Save Changes**.

---

## 6. How to Test the Deployment

### Step 6.1 — Test Health Check
Open your browser and visit:
```
https://files.feliciteclo.com/health.php
```

You should receive a JSON response:
```json
{
  "status": "healthy",
  "php_version": "8.1.x",
  "storage": {
    "upload_dir": "/home/username/public_html/files/uploads/products/",
    "dir_exists": true,
    "dir_writable": true,
    "public_base_url": "https://files.feliciteclo.com/uploads/products/"
  },
  "extensions": {
    "curl": true,
    "gd": true,
    "gd_webp_support": true,
    "fileinfo": true,
    "openssl": true
  }
}
```

If `dir_writable` is `false`, check Step 4.3 and update folder permissions to `755` or `775`.

---

### Step 6.2 — Test Unauthorized Upload Rejection
In your terminal or Postman, run an upload without an Authorization token:

```bash
curl -X POST https://files.feliciteclo.com/upload.php -F "file=@sample.jpg"
```

Expected response (`HTTP 401 Unauthorized`):
```json
{
  "success": false,
  "error": "Unauthorized: Missing or malformed Bearer token in Authorization header"
}
```
This confirms that random visitors cannot upload files to your hosting.

---

### Step 6.3 — Test Admin Upload via Frontend
1. Open the FELICITE store admin panel.
2. Sign in using your authorized admin email (`mimpy124ahon124@gmail.com`).
3. Click **Add Product** (or edit an existing product).
4. Click **Upload to BDIX** or drag & drop a product image into the upload box.
5. Observe the upload progress indicator (`0%` → `100%`).
6. Upon completion:
   - The image preview renders with the `BDIX HOSTED` indicator.
   - The primary image URL updates to `https://files.feliciteclo.com/uploads/products/felicite_...webp`.
7. Save the product. The product record in Supabase is updated with the new BDIX URL.

---

## 7. Troubleshooting Common cPanel Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **HTTP 401 "Missing Authorization header"** | Apache in FastCGI mode strips the `Authorization` header before passing it to PHP. | Ensure the root `.htaccess` is present and contains: <br>`RewriteCond %{HTTP:Authorization} ^(.*)`<br>`RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]` |
| **HTTP 500 "Upload directory is not writable"** | Permission on `/uploads/products/` is read-only. | In cPanel File Manager, right-click `uploads/products` > Change Permissions > set to `755` (or `775`). |
| **HTTP 413 "File Too Large"** | `upload_max_filesize` or `post_max_size` is too low in php.ini. | In cPanel > **Select PHP Version > Options**, set `upload_max_filesize = 30M` and `post_max_size = 35M`. |
| **CORS Error in Browser Console** | Vercel domain not recognized by CORS handler. | Check `config.php`: make sure your domain or `allowed_origin_regex` covers your Vercel preview domain. |
| **Images return 404** | Document root of subdomain doesn't match folder path. | Confirm in cPanel > Subdomains that `files.feliciteclo.com` points directly to the folder containing `upload.php` and `uploads/`. |

---

## 8. Security Hardening Highlights

1. **Zero Script Execution**: The `uploads/products/.htaccess` denies execution of `.php`, `.cgi`, `.py`, `.sh`, `.exe`, or any other executable extensions. Even if an attacker somehow uploaded a file with a script extension, the web server refuses to execute it.
2. **Strict MIME & Magic Byte Validation**: Uploads are inspected using PHP `finfo` (magic bytes) and `getimagesize()` to guarantee they are genuine images.
3. **Randomized Collision-Free Filenames**: User-supplied filenames are never used for storage. Filenames are generated using `felicite_{timestamp}_{random_hex}.{ext}`.
4. **Path Traversal Protection**: The `delete.php` endpoint verifies all paths with `basename()` and `realpath()`, strictly preventing any traversal attacks (`../`).
5. **Role-Based Token Validation**: Every request is authenticated against Supabase and cross-referenced with your `allowed_admin_emails` whitelist.
