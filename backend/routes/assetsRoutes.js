import express from "express";
import Asset from "../models/Asset.js";

const router = express.Router();

/**
 * @route   GET /api/asset
 * @desc    Get all assets (optional filter by area)
 * @query   ?areaId=<id>
 */
router.get("/", async (req, res) => {
  try {
    const { areaId } = req.query;
    const query = areaId ? { areaId } : {};
    const assets = await Asset.find(query).populate("areaId", "name");
    res.status(200).json(assets);
  } catch (err) {
    console.error("❌ Error fetching assets:", err.message);
    res.status(500).json({ error: "Failed to fetch assets." });
  }
});

/**
 * @route   POST /api/asset
 * @desc    Add a new asset
 */
router.post("/", async (req, res) => {
  try {
    const asset = new Asset(req.body);
    const saved = await asset.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating asset:", err.message);
    res.status(400).json({ error: "Failed to create asset." });
  }
});

/**
 * @route   PUT /api/asset/:id
 * @desc    Update existing asset
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Asset not found." });
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating asset:", err.message);
    res.status(400).json({ error: "Failed to update asset." });
  }
});

/**
 * @route   DELETE /api/asset/:id
 * @desc    Delete an asset by ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Asset.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Asset not found." });
    res.json({ success: true, message: "Asset deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting asset:", err.message);
    res.status(400).json({ error: "Failed to delete asset." });
  }
});

export default router;
