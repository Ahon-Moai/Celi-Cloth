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
