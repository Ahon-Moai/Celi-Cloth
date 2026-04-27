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

      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        console.error("Server Error: No API Key found in environment variables.");
        return res.status(500).json({ error: "API_KEY_NOT_CONFIGURED" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash", // Use a more stable model for production resilience if needed
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
        config: {
          responseMimeType: "application/json"
        }
      });

      if (!result.text) {
        // If text is missing, check if it was blocked
        const reason = result.candidates?.[0]?.finishReason || "UNKNOWN";
        throw new Error(`AI response was empty. Reason: ${reason}`);
      }

      const rawText = result.text;
      try {
        // Clean markdown code blocks if present
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
