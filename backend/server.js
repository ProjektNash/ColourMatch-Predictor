import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// --- Resolve current directory (for ES modules) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load environment variables (works even when run from root) ---
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

// --- CONNECT TO MONGODB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    console.log(`📦 Using database: ${mongoose.connection.name}`);
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// --- AUTO-LOAD ALL ROUTES (Windows-safe dynamic import) ---
const routesDir = path.join(__dirname, "routes");

if (fs.existsSync(routesDir)) {
  const routeFiles = fs.readdirSync(routesDir).filter((file) => file.endsWith(".js"));

  if (routeFiles.length === 0) {
    console.log("⚠️ No route files found in /routes");
  }

  for (const file of routeFiles) {
    const routePath = pathToFileURL(path.join(routesDir, file)).href;
    try {
      const routeModule = await import(routePath);
      const routeName = file.replace(/Routes\.js$/, "").toLowerCase();
      app.use(`/api/${routeName}`, routeModule.default);
      console.log(`🔗 Loaded route: /api/${routeName}`);
    } catch (err) {
      console.error(`❌ Error loading route ${file}:`, err.message);
    }
  }
} else {
  console.warn("⚠️ Routes directory not found — skipping route loading.");
}

// --- TEST ROUTE ---
app.get("/", (req, res) => {
  res.send("Asset Backend API Running");
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
