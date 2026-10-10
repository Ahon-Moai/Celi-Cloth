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
 * Uploads a single product image to BDIX cPanel hosting with live progress tracking
 */
export async function uploadProductImage(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<{ url: string; filename: string }> {
  const token = await getAuthToken();

  const uploadToEndpoint = (endpoint: string, allowFallback: boolean): Promise<{ url: string; filename: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
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
            const errMsg =
              response.error ||
              response.message ||
              `Upload failed with HTTP status ${xhr.status}`;
            reject(new Error(errMsg));
          }
        } catch (e) {
          reject(
            new Error(
              `Invalid server response from BDIX host (${xhr.status}). Ensure PHP upload API is installed at ${BDIX_BASE_URL}.`,
            ),
          );
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            `Network error connecting to BDIX hosting at ${BDIX_BASE_URL}. Check CORS settings and cPanel availability.`,
          ),
        );
      };

      xhr.ontimeout = () => {
        reject(new Error("Upload timed out. Check your internet connection."));
      };

      xhr.timeout = 60000; // 60 seconds
      xhr.send(formData);
    });
  };

  return uploadToEndpoint(`${BDIX_BASE_URL}/upload.php`, true);
}

/**
 * Uploads multiple product images to BDIX cPanel hosting in batch
 */
export async function uploadProductImages(
  files: File[],
  onProgress?: (percentage: number) => void,
): Promise<{ urls: string[]; files: BdixUploadFileResult[] }> {
  if (!files.length) {
    return { urls: [], files: [] };
  }

  const token = await getAuthToken();

  const uploadBatchToEndpoint = (endpoint: string, allowFallback: boolean): Promise<{ urls: string[]; files: BdixUploadFileResult[] }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files[]", file);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
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

        try {
          const response: BdixUploadResponse = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && response.success) {
            const uploadedFiles = response.files || [];
            const urls = uploadedFiles.map((f) => f.url);
            resolve({ urls, files: uploadedFiles });
          } else {
            const errMsg = response.error || `Upload failed (HTTP ${xhr.status})`;
            reject(new Error(errMsg));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response from BDIX host (${xhr.status}).`));
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            `Could not reach BDIX hosting at ${BDIX_BASE_URL}. Verify cPanel setup and domain DNS.`,
          ),
        );
      };

      xhr.timeout = 120000; // 2 minutes for bulk upload
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
