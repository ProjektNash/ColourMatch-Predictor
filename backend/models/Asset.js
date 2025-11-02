import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: String,
  model: String,
  serial: String,
  status: { type: String, default: "Active" },
  installDate: String,
  purchaseDate: String,
  supplier: String,
  purchaseCost: String,
  warrantyExpiry: String,
  disposalDate: String,
  disposalValue: String,
  disposalReason: String,
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetArea" }, // 🔗 linked area
  createdAt: { type: Date, default: Date.now },
});

// ✅ Force consistent collection name
export default mongoose.model("Asset", assetSchema, "assets");
