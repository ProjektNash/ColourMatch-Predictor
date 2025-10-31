import React, { useState } from "react";
import AssetList from "../components/AssetList";
import AddAssetModal from "../components/AddAssetModal";
import { saveAreas } from "../utils/assetHelpers";

export default function AreaAssets({ area, goBack, updateAreas }) {
  const [assets, setAssets] = useState(area.assets || []);
  const [showModal, setShowModal] = useState(false);

  const handleAddAsset = (newAsset) => {
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);

    // Update this area's asset list
    const updatedArea = { ...area, assets: updatedAssets };
    updateAreas(updatedArea);
    saveAreas(null, updatedArea);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this asset?")) {
      const updatedAssets = assets.filter((a) => a.id !== id);
      setAssets(updatedAssets);

      const updatedArea = { ...area, assets: updatedAssets };
      updateAreas(updatedArea);
      saveAreas(null, updatedArea);
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

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Asset
        </button>
      </div>

      {/* Assets Table */}
      <AssetList
  assets={assets}
  onDelete={handleDelete}
  onEdit={(updatedAsset) => {
    // Update the asset list
    const updatedAssets = assets.map((a) =>
      a.id === updatedAsset.id ? updatedAsset : a
    );

    // Update local state and storage
    setAssets(updatedAssets);

    const updatedArea = { ...area, assets: updatedAssets };
    updateAreas(updatedArea);
    saveAreas(null, updatedArea);
  }}
/>

      {/* Add Asset Modal */}
      <AddAssetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddAsset}
      />
    </div>
  );
}
