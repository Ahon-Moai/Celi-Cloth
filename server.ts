import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
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
