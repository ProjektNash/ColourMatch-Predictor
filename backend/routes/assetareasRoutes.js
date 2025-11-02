import express from "express";
import AssetArea from "../models/AssetArea.js";

const router = express.Router();

/**
 * @route   GET /api/assetareas
 * @desc    Get all asset areas
 */
router.get("/", async (req, res) => {
  try {
    const areas = await AssetArea.find().sort({ name: 1 });
    res.status(200).json(areas);
  } catch (err) {
    console.error("❌ Error fetching asset areas:", err.message);
    res.status(500).json({ error: "Failed to fetch asset areas." });
  }
});

/**
 * @route   POST /api/assetareas
 * @desc    Add a new asset area (name only)
 */
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Area name is required." });
    }

    // Prevent duplicates (case insensitive)
    const existing = await AssetArea.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "An area with this name already exists." });
    }

    const area = new AssetArea({ name });
    const saved = await area.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating asset area:", err.message);
    res.status(400).json({ error: "Failed to create asset area." });
  }
});

/**
 * @route   DELETE /api/assetareas/:id
 * @desc    Delete an asset area by ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await AssetArea.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Asset area not found." });
    res.json({ success: true, message: "Asset area deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting asset area:", err.message);
    res.status(400).json({ error: "Failed to delete asset area." });
  }
});

export default router;
