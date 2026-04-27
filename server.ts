import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Stylist
  app.post("/api/stylist", async (req, res) => {
    try {
      const { prompt, inventory } = req.body;
      
      // Try multiple env variable names for resilience
      const apiKey = 
        process.env.VITE_GEMINI_API_KEY || 
        process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("Server Error: No API Key found in environment variables.");
        return res.status(500).json({ error: "API_KEY_NOT_CONFIGURED" });
      }

      const genAI = new GoogleGenAI({ apiKey });
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

      const responseText = result.response.text();
      res.json(JSON.parse(responseText));
    } catch (error) {
      console.error("Server AI Error:", error);
      res.status(500).json({ error: "Failed to generate styling advice." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Correctly serve the dist folder in production/shared preview
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
