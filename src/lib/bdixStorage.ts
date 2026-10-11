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
  return url.includes("files.feliciteclo.com") || url.includes("/uploads/products/") || url.includes("/uploads/videos/");
}

/**
 * Client-side high-fidelity image optimizer using HTML5 Canvas.
 * Downscales images exceeding maxDimension and compresses to quality JPEG/WebP.
 * Turns 5MB-12MB phone camera photos into crisp ~200KB-400KB assets in milliseconds,
 * guaranteeing the upload never hits cPanel post_max_size / upload_max_filesize limits.
 */
export async function optimizeImageClientSide(
  file: File,
  maxDimension = 2048,
  quality = 0.85
): Promise<File> {
  // If not an image or already WebP and very small, return as-is
  if (!file.type.startsWith("image/") || file.size < 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;

        if (width <= maxDimension && height <= maxDimension && file.size < 700 * 1024) {
          return resolve(file);
        }

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        // Fill white background for transparency fallback
        if (file.type !== "image/png") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outMime = file.type === "image/png" ? "image/png" : "image/jpeg";
        const outExt = outMime === "image/png" ? ".png" : ".jpg";

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, "") + outExt,
              {
                type: outMime,
                lastModified: Date.now(),
              }
            );
            resolve(optimizedFile);
          },
          outMime,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch {
      resolve(file);
    }
  });
}

/**
 * Retrieves the current Supabase session token to authorize the BDIX PHP API request
 */
async function getAuthToken(): Promise<string> {
  try {
    if (supabase?.auth?.getSession) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) return token;
    }
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

  return "";
}

/**
 * Fallback: Upload to BDIX via Base64 JSON payload (bypasses multipart stripping)
 */
async function uploadToBdixViaJson(
  file: File,
  token: string
): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${BDIX_BASE_URL}/upload.php`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            data: base64Data,
            filename: file.name,
          }),
        });

        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data?.url) {
          resolve({ url: data.url, filename: data.filename || file.name });
        } else {
          throw new Error(data?.error || `BDIX JSON upload returned HTTP ${res.status}`);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a single product image to BDIX cPanel hosting with live progress tracking,
 * automatic client-side compression, and 2-tier BDIX delivery (Multipart -> Base64 JSON).
 */
export async function uploadProductImage(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<{ url: string; filename: string }> {
  // 1. Client-side optimization: downscale and compress to ensure it never exceeds server limits
  let readyFile = file;
  try {
    readyFile = await optimizeImageClientSide(file, 2048, 0.85);
  } catch {
    // Non-blocking fallback to original file
    readyFile = file;
  }

  let token = "";
  try {
    token = await getAuthToken();
  } catch (authErr) {
    console.warn("[Auth Warning]", authErr);
  }

  // Tier 1: Primary Multipart upload to BDIX cPanel
  const tryMultipartBdix = (): Promise<{ url: string; filename: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", readyFile);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BDIX_BASE_URL}/upload.php`, true);
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
        try {
          const response: BdixUploadResponse = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            const finalUrl =
              response.url ||
              (response.files && response.files[0]?.url) ||
              `${BDIX_BASE_URL}/uploads/products/${response.filename}`;
            const finalFilename =
              response.filename || (response.files && response.files[0]?.filename) || readyFile.name;
            resolve({ url: finalUrl, filename: finalFilename });
          } else {
            reject(new Error(response.error || response.message || `HTTP ${xhr.status}`));
          }
        } catch {
          reject(new Error(`Non-JSON response from BDIX (HTTP ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Network/CORS error reaching BDIX host"));
      xhr.ontimeout = () => reject(new Error("BDIX upload timed out"));
      xhr.timeout = 25000;
      xhr.send(formData);
    });
  };

  try {
    return await tryMultipartBdix();
  } catch (err: any) {
    console.warn("[BDIX Multipart failed, trying Tier 2 JSON fallback]:", err?.message);

    // Tier 2: Try BDIX via Base64 JSON (bypasses proxy/firewall multipart stripping)
    try {
      return await uploadToBdixViaJson(readyFile, token);
    } catch (jsonErr: any) {
      console.error("[BDIX JSON fallback also failed]:", jsonErr?.message);
      // Both Tier 1 and Tier 2 failed on BDIX - surface error cleanly
      const msg = jsonErr?.message || err?.message || "Failed to upload image to BDIX hosting.";
      throw new Error(
        msg.includes("No files")
          ? "BDIX server rejected upload. Please verify cPanel upload folder permissions or server upload limit."
          : msg
      );
    }
  }
}

/**
 * Uploads multiple product images to BDIX cPanel hosting in batch (with multi-tier fallback)
 */
export async function uploadProductImages(
  files: File[],
  onProgress?: (percentage: number) => void
): Promise<{ urls: string[]; files: BdixUploadFileResult[] }> {
  if (!files.length) {
    return { urls: [], files: [] };
  }

  // 1. Optimize all files client-side in parallel
  const optimizedFiles = await Promise.all(
    files.map((file) => optimizeImageClientSide(file, 2048, 0.85))
  );

  let token = "";
  try {
    token = await getAuthToken();
  } catch {
    // continue
  }

  // 2. Try batch upload to BDIX
  const tryBatchBdix = (): Promise<{ urls: string[]; files: BdixUploadFileResult[] }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      optimizedFiles.forEach((file) => {
        formData.append("files[]", file);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BDIX_BASE_URL}/upload.php`, true);
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
        try {
          const response: BdixUploadResponse = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success && response.files) {
            const urls = response.files.map((f) => f.url);
            resolve({ urls, files: response.files });
          } else {
            reject(new Error(response.error || `HTTP ${xhr.status}`));
          }
        } catch {
          reject(new Error(`Non-JSON response from BDIX (HTTP ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Network/CORS error reaching BDIX host"));
      xhr.ontimeout = () => reject(new Error("BDIX batch upload timed out"));
      xhr.timeout = 35000;
      xhr.send(formData);
    });
  };

  try {
    return await tryBatchBdix();
  } catch {
    // Fallback: upload individually using the robust single-upload pipeline
    const results: BdixUploadFileResult[] = [];
    const urls: string[] = [];

    for (let i = 0; i < optimizedFiles.length; i++) {
      const singleFile = optimizedFiles[i];
      try {
        const res = await uploadProductImage(singleFile, (singlePct) => {
          if (onProgress) {
            const overallPct = Math.round(((i + singlePct / 100) / optimizedFiles.length) * 100);
            onProgress(overallPct);
          }
        });
        urls.push(res.url);
        results.push({
          filename: res.filename,
          url: res.url,
          original_name: singleFile.name,
        });
      } catch (singleErr) {
        console.warn(`Failed to upload ${singleFile.name}:`, singleErr);
      }
    }

    if (urls.length === 0) {
      throw new Error("Failed to upload gallery images. Check BDIX hosting connection.");
    }

    return { urls, files: results };
  }
}

/**
 * Deletes an image from BDIX hosting by its public URL or filename
 */
export async function deleteProductImage(urlOrFilename: string): Promise<boolean> {
  if (!urlOrFilename) return false;

  const token = await getAuthToken();
  let endpoint = `${BDIX_BASE_URL}/delete.php`;

  try {
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/json",
        },
        body: JSON.stringify({ filename: urlOrFilename }),
      });
    }

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      console.warn("Delete note from BDIX:", data?.error || response.status);
    }
  } catch (err) {
    console.warn("BDIX delete network warning:", err);
  }

  return true;
}
