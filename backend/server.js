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

// --- Load environment variables ---
dotenv.config();  // Load environment variables from .env

// Connect to the Assets database (removing the userAuth database connection)
const assetsConnection = mongoose.createConnection(process.env.ASSETS_MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Debugging to ensure the database is connected
assetsConnection.once("open", () => {
  console.log("✅ Connected to Assets database");
});

// --- Define Models for Assets database ---
const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  cost: Number,
});

// Define model for the Assets database
const Asset = assetsConnection.model("Asset", assetSchema);

const app = express();
app.use(cors());
app.use(express.json());

// --- TEST ROUTE ---
app.get("/", (req, res) => {
  res.send("Backend API Running");
});

// --- Example Route for Assets ---
app.get("/assets", async (req, res) => {
  try {
    const assets = await Asset.find(); // Fetch all assets from the database
    res.status(200).json(assets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching assets", error: err.message });
  }
});

// --- ADD NEW ASSET ---
app.post("/assets", async (req, res) => {
  const { name, description, cost } = req.body;

  const newAsset = new Asset({
    name,
    description,
    cost,
  });

  try {
    await newAsset.save();
    res.status(201).json({ message: "Asset added successfully", asset: newAsset });
  } catch (err) {
    res.status(500).json({ message: "Error adding asset", error: err.message });
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
