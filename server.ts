import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route - useful for verifying if the server is actually reachable
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  // API Route for Gemini Stylist
  app.post("/api/stylist", async (req, res) => {
    console.log("Stylist API Request received at:", new Date().toISOString());
    try {
      const { prompt, inventory } = req.body;
      
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        console.error("Stylist API Error: Missing API Key");
        return res.status(500).json({ 
          error: "API_KEY_NOT_CONFIGURED",
          message: "The Gemini API key is not properly configured in the server environment."
        });
      }

      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `You are the "FELICITE™ AI Stylist". You are sophisticated, minimalist, and knowledgeable about streetwear.
            The user wants a style recommendation: "${prompt}".
            
            Our Inventory: ${JSON.stringify(inventory)}
            
            Rules:
            1. Be professional, chic, and encouraging. Use minimalist language.
            2. Recommend 2-4 products.
            3. Return JSON:
            {
              "analysis": "short vibe analysis",
              "recommended_ids": ["ids"],
              "chat_output": "the message to the user"
            }`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const response = result.response;
      const rawText = response.text();
      try {
        const cleanedText = rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        res.json(JSON.parse(cleanedText));
      } catch (parseError) {
        console.error("Parse Error. Raw text:", rawText);
        throw new Error(`Failed to parse AI response: ${rawText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error("Server AI Error:", error);
      res.status(500).json({ 
        error: "SERVER_ERROR",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Serve static files or Vite middleware
  const isProd = process.env.NODE_ENV === "production" || process.env.PROD === "true";
  
  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    console.log(`Starting server in PRODUCTION mode. Serving files from: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        // Only serve index.html for non-API routes
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: "API route not found" });
        }
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error("CRITICAL ERROR: dist directory not found! Ensure build script was run.");
      app.get("*", (req, res) => {
        res.status(500).send("Application dist directory not found. Please run build.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
