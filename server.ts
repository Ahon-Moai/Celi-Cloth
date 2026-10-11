import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import { execFile } from "child_process";
import util from "util";

const execFilePromise = util.promisify(execFile);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // Ensure public/uploads/products and public/uploads/videos exist
  const uploadsProductsDir = path.join(__dirname, "public", "uploads", "products");
  const uploadsVideosDir = path.join(__dirname, "public", "uploads", "videos");
  if (!fs.existsSync(uploadsProductsDir)) {
    fs.mkdirSync(uploadsProductsDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsVideosDir)) {
    fs.mkdirSync(uploadsVideosDir, { recursive: true });
  }

  // Serve static uploads directly
  app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  // Direct and fallback image upload route
  app.post("/api/upload-image", (req, res) => {
    try {
      const { data, filename } = req.body;
      if (!data) {
        return res.status(400).json({ error: "No image data received" });
      }

      const uploadsDir = path.join(__dirname, "public", "uploads", "products");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = (filename && path.extname(filename).replace(/^\./, "")) || "webp";
      const cleanName = `felicite_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const targetPath = path.join(uploadsDir, cleanName);

      const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(targetPath, Buffer.from(base64Data, "base64"));

      res.json({
        success: true,
        url: `/uploads/products/${cleanName}`,
        filename: cleanName,
      });
    } catch (err: any) {
      console.error("Failed to upload image locally:", err);
      res.status(500).json({ error: err.message || "Failed to save image" });
    }
  });

  // Optimized video upload route with FFmpeg compression & faststart streaming
  app.post("/api/upload-video", async (req, res) => {
    let tempFilePath = "";
    try {
      const { data, filename, clientPoster } = req.body;
      if (!data) {
        return res.status(400).json({ error: "No video data received" });
      }

      const videosDir = path.join(__dirname, "public", "uploads", "videos");
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }

      const originalExt = (filename && path.extname(filename).replace(/^\./, "").toLowerCase()) || "mp4";
      const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${originalExt}`;
      tempFilePath = path.join(videosDir, tempFileName);

      // Clean base64 header
      const base64Data = data
        .replace(/^data:video\/[\w-]+;base64,/, "")
        .replace(/^data:application\/octet-stream;base64,/, "");
      const rawBuffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(tempFilePath, rawBuffer);
      const originalSizeBytes = rawBuffer.length;

      const randomHash = Math.random().toString(36).substring(2, 7);
      const finalFileName = `felicite_video_${Date.now()}_${randomHash}.mp4`;
      const finalPosterName = `felicite_video_${Date.now()}_${randomHash}_poster.jpg`;
      const finalFilePath = path.join(videosDir, finalFileName);
      const finalPosterPath = path.join(videosDir, finalPosterName);

      let optimizationSucceeded = false;

      try {
        // Run FFmpeg: downscale to max 1080p, H.264 CRF 26 for high visual quality + small size, faststart for streaming
        await execFilePromise("ffmpeg", [
          "-y",
          "-i", tempFilePath,
          "-vf", "scale='min(1080,iw)':-2",
          "-c:v", "libx264",
          "-crf", "26",
          "-preset", "fast",
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          finalFilePath
        ]);

        // Generate poster frame at 0.8s
        await execFilePromise("ffmpeg", [
          "-y",
          "-ss", "00:00:00.800",
          "-i", finalFilePath,
          "-vframes", "1",
          "-q:v", "2",
          finalPosterPath
        ]);

        optimizationSucceeded = true;
      } catch (ffmpegErr: any) {
        console.warn("FFmpeg compression failed or partially succeeded, using fallback:", ffmpegErr?.message);
        // Fallback: move temp file to final file
        if (!fs.existsSync(finalFilePath) && fs.existsSync(tempFilePath)) {
          fs.copyFileSync(tempFilePath, finalFilePath);
        }
      }

      // If poster wasn't created by FFmpeg but client supplied a poster frame, save it
      if (!fs.existsSync(finalPosterPath) && clientPoster) {
        try {
          const posterBase64 = clientPoster.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFileSync(finalPosterPath, Buffer.from(posterBase64, "base64"));
        } catch (posterErr) {
          console.warn("Could not write client poster:", posterErr);
        }
      }

      // Check stats
      let finalSizeBytes = originalSizeBytes;
      if (fs.existsSync(finalFilePath)) {
        const stats = fs.statSync(finalFilePath);
        finalSizeBytes = stats.size;
      }

      const savingsPercent = originalSizeBytes > finalSizeBytes 
        ? Math.round(((originalSizeBytes - finalSizeBytes) / originalSizeBytes) * 100) 
        : 0;

      const hasThumbnail = fs.existsSync(finalPosterPath);

      res.json({
        success: true,
        url: `/uploads/videos/${finalFileName}`,
        thumbnail: hasThumbnail ? `/uploads/videos/${finalPosterName}` : undefined,
        originalSize: originalSizeBytes,
        optimizedSize: finalSizeBytes,
        savingsPercent,
        optimizedWithFfmpeg: optimizationSucceeded,
        message: optimizationSucceeded 
          ? `Video optimized with H.264 FastStart (${savingsPercent}% size reduction)`
          : "Video saved successfully"
      });
    } catch (err: any) {
      console.error("Failed to upload/optimize video:", err);
      res.status(500).json({ error: err.message || "Failed to process video" });
    } finally {
      // Clean up temporary uncompressed upload
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch {
          // ignore
        }
      }
    }
  });

  // Save products to JSON
  app.post("/api/products", (req, res) => {
    try {
      const products = req.body;
      const productsPath = path.join(__dirname, "src", "data", "products.json");
      
      // Ensure directory exists (though it should)
      const dir = path.dirname(productsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf8");
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to save products:", err);
      res.status(500).json({ error: "Failed to save products" });
    }
  });

  // Get products from JSON
  app.get("/api/products", (req, res) => {
    try {
      const productsPath = path.join(__dirname, "src", "data", "products.json");
      if (fs.existsSync(productsPath)) {
        const data = fs.readFileSync(productsPath, "utf8");
        res.json(JSON.parse(data));
      } else {
        // Fallback to empty array if file doesn't exist
        res.json([]);
      }
    } catch (err) {
      console.error("Failed to read products:", err);
      res.status(500).json({ error: "Failed to read products" });
    }
  });

  // Server-side Gemini AI Stylist endpoint
  app.post("/api/stylist", async (req, res) => {
    try {
      const { userText, inventory = [] } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        const sampleIds = inventory.slice(0, 3).map((p: any) => p.id);
        return res.json({
          analysis: "Curated contemporary streetwear selection tailored to your request.",
          recommended_ids: sampleIds,
          chat_output: `Based on your style preference "${userText || "contemporary"}", I recommend pairing these signature Felicite garments with minimal silhouette and structured drape.`,
        });
      }

      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are the "FELICITE™ AI Stylist". You are sophisticated, minimalist, and knowledgeable about streetwear. Your goal is to provide fashion styling advice based on the user's prompt and our current inventory. Our Inventory: ${JSON.stringify(inventory.slice(0, 30))} Rules: 1. Be professional, chic, and encouraging. 2. Recommend 2-4 products from the provided inventory. 3. Return ONLY a valid JSON object. 4. JSON Structure: { "analysis": "short vibe analysis", "recommended_ids": ["string array of product IDs"], "chat_output": "the message to the user" } User Request: ${userText}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              recommended_ids: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              chat_output: { type: Type.STRING },
            },
            required: ["analysis", "recommended_ids", "chat_output"],
          },
        },
      });

      if (!response.text) {
        throw new Error("Empty AI response");
      }
      res.json(JSON.parse(response.text));
    } catch (err: any) {
      console.error("AI Stylist error:", err);
      const inventory = req.body?.inventory || [];
      res.json({
        analysis: "Minimalist streetwear profile curated for modern urban drape.",
        recommended_ids: inventory.slice(0, 3).map((p: any) => p.id),
        chat_output: "Here are select essentials from the Felicite collection that match your contemporary profile.",
      });
    }
  });

  // Serve static files or Vite middleware
  const isProd = process.env.NODE_ENV === "production" || process.env.PROD === "true";
  
  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    console.log(`Starting server in PRODUCTION mode. Serving files from: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        // Handle SPA fallback for non-API routes
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: "API route not found" });
        }
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error("CRITICAL ERROR: dist directory not found!");
      app.get("*", (req, res) => {
        res.status(500).send("Application dist directory not found.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
