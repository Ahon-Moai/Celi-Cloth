import { supabase } from "./supabase";

export interface BdixUploadFileResult {
  filename: string;
  url: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
  original_name?: string;
}

export interface BdixUploadResponse {
  success: boolean;
  message?: string;
  url?: string;
  filename?: string;
  files?: BdixUploadFileResult[];
  error?: string;
}

// Configured BDIX API base URL (can be customized via VITE_BDIX_UPLOAD_API_URL in .env)
export const BDIX_BASE_URL = (
  import.meta.env.VITE_BDIX_UPLOAD_API_URL || "https://files.feliciteclo.com"
).replace(/\/+$/, "");

/**
 * Checks whether an image URL points to the BDIX hosting storage
 */
export function isBdixImageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("files.feliciteclo.com") || url.includes("/uploads/products/");
}

/**
 * Helper to check if a URL points to a video file
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return (
    /\.(mp4|webm|mov|m4v|ogv|mkv|avi|flv)($|\?)/i.test(url) ||
    cleanUrl.includes("felicite_video_") ||
    url.startsWith("data:video/")
  );
}

/**
 * Returns appropriate video MIME type hint for HTML5 <source> elements
 */
export function getVideoMimeType(url: string): string {
  if (!url) return "video/mp4";
  const cleanUrl = url.toLowerCase().split('?')[0];
  if (cleanUrl.endsWith(".webm")) return "video/webm";
  if (cleanUrl.endsWith(".mov")) return "video/quicktime";
  if (cleanUrl.endsWith(".m4v")) return "video/x-m4v";
  if (cleanUrl.endsWith(".ogv")) return "video/ogg";
  return "video/mp4";
}

/**
 * Retrieves the current Supabase session token to authorize the BDIX PHP API request
 */
async function getAuthToken(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return token;
  } catch (err) {
    console.warn("[BDIX Auth] Failed to retrieve session from Supabase:", err);
  }

  // Check localStorage fallback for mock sessions
  try {
    const stored = localStorage.getItem("felicite_mock_auth_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id) return `mock-token-${user.id}`;
    }
  } catch {
    // ignore
  }

  throw new Error("You must be logged in as an administrator to upload images.");
}

/**
 * Local application storage fallback when external BDIX cPanel hosting is blocked by firewall/cPGuard
 */
async function uploadToLocalFallback(file: File): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: base64Data,
            filename: file.name,
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save image in application storage");
        }
        resolve({ url: data.url, filename: data.filename });
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a single product image to BDIX cPanel hosting with live progress tracking
 */
export async function uploadProductImage(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<{ url: string; filename: string }> {
  let token = "";
  try {
    token = await getAuthToken();
  } catch (authErr) {
    console.warn("[Auth Warning]", authErr);
  }

  const uploadToEndpoint = (endpoint: string, allowFallback: boolean): Promise<{ url: string; filename: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.setRequestHeader("Accept", "application/json");

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 404 && allowFallback) {
          uploadToEndpoint(`${BDIX_BASE_URL}/api/upload.php`, false)
            .then(resolve)
            .catch(reject);
          return;
        }

        const isHtml =
          xhr.responseText.includes("<!DOCTYPE") ||
          xhr.responseText.includes("<html") ||
          xhr.responseText.includes("Security Check Required") ||
          xhr.responseText.includes("406 Not Acceptable");

        if (isHtml || xhr.status === 405 || xhr.status === 406 || xhr.status >= 500) {
          console.warn(`[BDIX Storage] Host returned HTTP ${xhr.status} (WAF / cPGuard challenge). Activating local storage fallback.`);
          uploadToLocalFallback(file)
            .then(resolve)
            .catch(() => {
              reject(new Error(`BDIX server (${xhr.status}) is protected by cPGuard Firewall. Verify cPGuard in cPanel or try again.`));
            });
          return;
        }

        try {
          const response: BdixUploadResponse = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            const finalUrl =
              response.url ||
              (response.files && response.files[0]?.url) ||
              `${BDIX_BASE_URL}/uploads/products/${response.filename}`;
            const finalFilename =
              response.filename || (response.files && response.files[0]?.filename) || "";
            resolve({ url: finalUrl, filename: finalFilename });
          } else {
            uploadToLocalFallback(file)
              .then(resolve)
              .catch(() => {
                const errMsg = response.error || response.message || `Upload failed with HTTP ${xhr.status}`;
                reject(new Error(errMsg));
              });
          }
        } catch (e) {
          uploadToLocalFallback(file)
            .then(resolve)
            .catch(() => {
              reject(
                new Error(
                  `Invalid server response from BDIX host (${xhr.status}). Ensure PHP upload API is installed at ${BDIX_BASE_URL}.`,
                ),
              );
            });
        }
      };

      xhr.onerror = () => {
        console.warn("[BDIX Storage] Network/CORS issue reaching BDIX host. Falling back to local storage.");
        uploadToLocalFallback(file)
          .then(resolve)
          .catch(() => {
            reject(
              new Error(
                `Network error connecting to BDIX hosting at ${BDIX_BASE_URL}. Check CORS settings and cPanel availability.`,
              ),
            );
          });
      };

      xhr.ontimeout = () => {
        uploadToLocalFallback(file)
          .then(resolve)
          .catch(() => {
            reject(new Error("Upload timed out. Check your internet connection."));
          });
      };

      xhr.timeout = 120000;
      xhr.send(formData);
    });
  };

  return uploadToEndpoint(`${BDIX_BASE_URL}/upload.php`, true);
}

/**
 * Uploads a product video file to BDIX cPanel hosting with live upload progress tracking
 */
export async function uploadProductVideo(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<{ url: string; filename: string }> {
  const maxBytes = 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Video file size exceeds maximum limit of 100 MB.");
  }

  const validExts = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];
  const lowerName = file.name.toLowerCase();
  const isValidExt = validExts.some((ext) => lowerName.endsWith(ext));
  const isValidMime = file.type.startsWith("video/") || file.type === "application/octet-stream";

  if (!isValidExt && !isValidMime) {
    throw new Error("Invalid video file format. Supported formats: MP4, WebM, MOV, M4V, OGV.");
  }

  return uploadProductImage(file, onProgress);
}

/**
 * Uploads multiple product images to BDIX cPanel hosting in batch (with graceful local fallback)
 */
export async function uploadProductImages(
  files: File[],
  onProgress?: (percentage: number) => void,
): Promise<{ urls: string[]; files: BdixUploadFileResult[] }> {
  if (!files.length) {
    return { urls: [], files: [] };
  }

  let token = "";
  try {
    token = await getAuthToken();
  } catch {
    // continue
  }

  const uploadBatchToEndpoint = (endpoint: string, allowFallback: boolean): Promise<{ urls: string[]; files: BdixUploadFileResult[] }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files[]", file);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.setRequestHeader("Accept", "application/json");

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 404 && allowFallback) {
          uploadBatchToEndpoint(`${BDIX_BASE_URL}/api/upload.php`, false)
            .then(resolve)
            .catch(reject);
          return;
        }

        const isHtml =
          xhr.responseText.includes("<!DOCTYPE") ||
          xhr.responseText.includes("<html") ||
          xhr.responseText.includes("Security Check Required") ||
          xhr.responseText.includes("406 Not Acceptable");

        if (isHtml || xhr.status === 405 || xhr.status === 406 || xhr.status >= 500) {
          console.warn(`[BDIX Storage Batch] Host returned ${xhr.status} (WAF / cPGuard challenge). Activating local storage fallback.`);
          Promise.all(files.map((f) => uploadToLocalFallback(f)))
            .then((results) => {
              resolve({
                urls: results.map((r) => r.url),
                files: results.map((r) => ({ filename: r.filename, url: r.url })),
              });
            })
            .catch(reject);
          return;
        }

        try {
          const response: BdixUploadResponse = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            const uploadedFiles = response.files || [];
            const urls = uploadedFiles.map((f) => f.url);
            resolve({ urls, files: uploadedFiles });
          } else {
            Promise.all(files.map((f) => uploadToLocalFallback(f)))
              .then((results) => {
                resolve({
                  urls: results.map((r) => r.url),
                  files: results.map((r) => ({ filename: r.filename, url: r.url })),
                });
              })
              .catch(() => reject(new Error(response.error || `Upload failed (HTTP ${xhr.status})`)));
          }
        } catch (e) {
          Promise.all(files.map((f) => uploadToLocalFallback(f)))
            .then((results) => {
              resolve({
                urls: results.map((r) => r.url),
                files: results.map((r) => ({ filename: r.filename, url: r.url })),
              });
            })
            .catch(() => reject(new Error(`Failed to parse response from BDIX host (${xhr.status}).`)));
        }
      };

      xhr.onerror = () => {
        Promise.all(files.map((f) => uploadToLocalFallback(f)))
          .then((results) => {
            resolve({
              urls: results.map((r) => r.url),
              files: results.map((r) => ({ filename: r.filename, url: r.url })),
            });
          })
          .catch(() =>
            reject(
              new Error(
                `Could not reach BDIX hosting at ${BDIX_BASE_URL}. Verify cPanel setup and domain DNS.`,
              ),
            ),
          );
      };

      xhr.timeout = 30000;
      xhr.send(formData);
    });
  };

  return uploadBatchToEndpoint(`${BDIX_BASE_URL}/upload.php`, true);
}

/**
 * Deletes an image from BDIX hosting by its public URL or filename
 */
export async function deleteProductImage(urlOrFilename: string): Promise<boolean> {
  if (!urlOrFilename) return false;

  const token = await getAuthToken();
  let endpoint = `${BDIX_BASE_URL}/delete.php`;

  let response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify({ filename: urlOrFilename }),
  });

  if (response.status === 404) {
    endpoint = `${BDIX_BASE_URL}/api/delete.php`;
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ filename: urlOrFilename }),
    });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || `Failed to delete image (${response.status})`);
  }

  return true;
}
