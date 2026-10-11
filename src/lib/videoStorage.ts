/**
 * Product Video Optimization and Upload Engine
 * 
 * Provides:
 * 1. Client-side video poster frame extraction via Canvas
 * 2. Real-time upload progress tracking
 * 3. Server-side FFmpeg H.264 CRF compression with FastStart streaming
 * 4. Automatic video poster generation to eliminate customer bandwidth drain
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
 * Extracts a crisp snapshot frame from a video File using HTML5 Video + Canvas
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
 * Uploads a video file to the server with real-time progress and FFmpeg optimization
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

  // 100MB max limit to avoid exceeding system memory
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

  // 3. Read video file into base64
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read video file from your device.'));
    reader.readAsDataURL(file);
  });

  // 4. Send upload with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-video', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Live progress: allocation: 0-80% for network transfer, 80-100% for server compression
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const networkPct = Math.round((event.loaded / event.total) * 80);
          onProgress(networkPct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          if (onProgress) onProgress(100);
          const response = JSON.parse(xhr.responseText) as VideoUploadResult;
          resolve(response);
        } catch {
          reject(new Error('Invalid response from video optimization server.'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || `Server returned error (${xhr.status})`));
        } catch {
          reject(new Error(`Failed to upload video (HTTP ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during video upload. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Video upload timed out. File may be too large.'));
    };

    // 120s timeout for large uploads + ffmpeg processing
    xhr.timeout = 120000;

    const payload = JSON.stringify({
      data: dataUrl,
      filename: file.name,
      clientPoster: clientPoster || undefined,
    });

    xhr.send(payload);
  });
}
