import mongoose from "mongoose";

const assetAreaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Force collection name to stay consistent
export default mongoose.model("AssetArea", assetAreaSchema, "assetareas");
