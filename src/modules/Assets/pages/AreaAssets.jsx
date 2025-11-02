import React, { useState, useEffect } from "react";
import axios from "axios";
import AssetList from "../components/AssetList";
import AddAssetModal from "../components/AddAssetModal";

export default function AreaAssets({ area, goBack }) {
  const [assets, setAssets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // 🔹 Load all assets for this area
  useEffect(() => {
    fetchAssets();
  }, [area]);

  const fetchAssets = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/assets?areaId=${area._id}`
      );
      setAssets(res.data);
    } catch (err) {
      console.error("❌ Error fetching assets:", err.message);
    }
  };

  // 🔹 Add new asset
  const handleAddAsset = async (newAsset) => {
    try {
      const payload = { ...newAsset, areaId: area._id };
      const res = await axios.post("http://localhost:5000/api/assets", payload);
      setAssets((prev) => [...prev, res.data]);
    } catch (err) {
      alert(err.response?.data?.error || "Error adding asset");
    }
  };

  // 🔹 Edit existing asset
  const handleEditAsset = async (updatedAsset) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/assets/${updatedAsset._id}`,
        updatedAsset
      );
      setAssets((prev) =>
        prev.map((a) => (a._id === updatedAsset._id ? res.data : a))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Error updating asset");
    }
  };

  // 🔹 Delete asset
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/assets/${id}`);
      setAssets((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert("Error deleting asset");
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-primary" onClick={goBack}>
          ← Back to Areas
        </button>

        <h4 className="mb-0 text-center flex-grow-1">{area.name}</h4>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingAsset(null);
            setShowModal(true);
          }}
        >
          + Add Asset
        </button>
      </div>

      {/* Assets Table */}
      <AssetList
        assets={assets}
        onDelete={handleDelete}
        onEdit={(asset) => {
          setEditingAsset(asset);
          setShowModal(true);
        }}
      />

      {/* Add/Edit Asset Modal */}
      <AddAssetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={editingAsset ? handleEditAsset : handleAddAsset}
        existingAsset={editingAsset}
      />
    </div>
  );
}
