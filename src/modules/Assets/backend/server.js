import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ Connection error:", err));

// --- Define schema inline (no separate model folder) ---
const assetSchema = new mongoose.Schema({
  areaId: String,
  code: String,
  name: String,
  category: String,
  model: String,
  serial: String,
  status: String,
  installDate: String,
  purchaseDate: String,
  supplier: String,
  purchaseCost: Number,
  warrantyExpiry: String,
  disposalDate: String,
  disposalValue: Number,
  disposalReason: String,
});
const Asset = mongoose.model("Asset", assetSchema);

// --- CRUD Routes ---
app.get("/api/assets", async (req, res) => {
  const assets = await Asset.find();
  res.json(assets);
});

app.post("/api/assets", async (req, res) => {
  const asset = new Asset(req.body);
  await asset.save();
  res.json(asset);
});

app.put("/api/assets/:id", async (req, res) => {
  const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/assets/:id", async (req, res) => {
  await Asset.findByIdAndDelete(req.params.id);
  res.json({ message: "Asset deleted" });
});

// Default route
app.get("/", (req, res) => res.send("ProjektNash Assets Backend running ✅"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
