import { BDIX_BASE_URL } from "./bdixStorage";

/**
 * Product Video Optimization and Upload Engine
 * 
 * Provides:
 * 1. Client-side video poster frame extraction via Canvas
 * 2. Real-time upload progress tracking
 * 3. Direct upload to BDIX cPanel hosting
 */

export interface VideoUploadResult {
  url: string;
  thumbnail?: string;
  originalSize: number;
  optimizedSize: number;
  savingsPercent: number;
  optimizedWithFfmpeg?: boolean;
  message?: string;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.includes('/uploads/videos/') ||
    clean.includes('/video/upload/') ||
    clean.includes('youtube.com/embed') ||
    clean.includes('player.vimeo.com')
  );
}

/**
 * Extracts a crisp snapshot frame from a video File using HTML5 Video + Canvas.
 * Used for instant poster thumbnails so the browser doesn't have to load
 * video frames over cellular/slow connections.
 */
export async function generateVideoPosterFromClient(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.remove();
      };

      // Seek to 0.5s or 10% into the video
      video.onloadedmetadata = () => {
        const targetTime = Math.min(1.0, video.duration > 0.5 ? 0.5 : 0);
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const posterData = canvas.toDataURL('image/jpeg', 0.85);
            cleanup();
            return resolve(posterData);
          }
        } catch {
          // Canvas tainted or not allowed
        }
        cleanup();
        resolve('');
      };

      video.onerror = () => {
        cleanup();
        resolve('');
      };

      // Safety timeout: resolve empty if video fails to seek within 3 seconds
      setTimeout(() => {
        cleanup();
        resolve('');
      }, 3000);
    } catch {
      resolve('');
    }
  });
}

/**
 * Upload video directly to BDIX cPanel hosting endpoint
 */
async function uploadVideoToBdix(
  file: File,
  clientPoster: string,
  onProgress?: (percentage: number) => void
): Promise<VideoUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BDIX_BASE_URL}/upload.php`, true);
    xhr.setRequestHeader("Accept", "application/json");

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 95);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.success) {
          if (onProgress) onProgress(100);
          const finalUrl =
            res.url ||
            (res.files && res.files[0]?.url) ||
            `${BDIX_BASE_URL}/uploads/videos/${res.filename}`;
          resolve({
            url: finalUrl,
            thumbnail: clientPoster,
            originalSize: file.size,
            optimizedSize: res.size || file.size,
            savingsPercent: 0,
            optimizedWithFfmpeg: false,
            message: "Hosted on BDIX cPanel CDN",
          });
        } else {
          reject(new Error(res.error || `BDIX upload returned HTTP ${xhr.status}`));
        }
      } catch {
        reject(new Error(`Failed to parse BDIX response (HTTP ${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error connecting to BDIX hosting"));
    xhr.ontimeout = () => reject(new Error("BDIX video upload timed out"));
    xhr.timeout = 60000;
    xhr.send(formData);
  });
}

/**
 * Uploads a video file directly to BDIX cPanel hosting with real-time progress
 * and client-side poster extraction.
 */
export async function uploadAndOptimizeProductVideo(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<VideoUploadResult> {
  // 1. File verification
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = ['mp4', 'webm', 'mov', 'm4v'].includes(ext || '');

  if (!validTypes.includes(file.type) && !isValidExtension) {
    throw new Error('Unsupported video format. Please upload MP4, WebM, or MOV files.');
  }

  // 100MB max limit
  const maxBytes = 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Video file too large (${formatBytes(file.size)}). Maximum supported file size is 100MB.`);
  }

  // 2. Generate client-side poster thumbnail
  let clientPoster = '';
  try {
    clientPoster = await generateVideoPosterFromClient(file);
  } catch {
    // Non-blocking
  }

  // 3. Upload directly to BDIX cPanel Media Hosting
  try {
    return await uploadVideoToBdix(file, clientPoster, onProgress);
  } catch (err: any) {
    const errorMsg = err?.message || 'Failed to upload video to BDIX hosting.';
    throw new Error(
      errorMsg.includes('No files')
        ? 'BDIX server rejected upload. Please verify cPanel upload folder permissions (chmod 755 on uploads/videos/) or check https://files.feliciteclo.com/health.php.'
        : errorMsg
    );
  }
}
