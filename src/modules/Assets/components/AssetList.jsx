import React, { useState } from "react";
import AddAssetModal from "./AddAssetModal";

export default function AssetList({ assets, onDelete, onEdit }) {
  const [editingAsset, setEditingAsset] = useState(null);

  const handleEditSave = (updatedAsset) => {
    onEdit(updatedAsset);
    setEditingAsset(null);
  };

  if (!assets || assets.length === 0) {
    return <p className="text-secondary">No assets added for this area yet.</p>;
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle shadow-sm">
          <thead className="table-light">
            <tr>
              <th>Asset Code</th>
              <th>Name / Description</th>
              <th>Category</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Purchase Cost (£)</th>
              <th>Warranty Expiry</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>{a.code}</td>
                <td>{a.name}</td>
                <td>{a.category}</td>
                <td>
                  <span
                    className={`badge ${
                      a.status === "Active"
                        ? "bg-success"
                        : a.status === "Out of Service"
                        ? "bg-warning text-dark"
                        : "bg-secondary"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td>{a.supplier || "-"}</td>
                <td>{a.purchaseCost ? `£${Number(a.purchaseCost).toFixed(2)}` : "-"}</td>
                <td>{a.warrantyExpiry || "-"}</td>
                <td className="text-center">
                  <button
                    className="btn btn-outline-primary btn-sm me-2"
                    onClick={() => setEditingAsset(a)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => onDelete(a.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <AddAssetModal
          show={true}
          onClose={() => setEditingAsset(null)}
          onSave={handleEditSave}
          existingAsset={editingAsset} // pass asset to prefill
        />
      )}
    </>
  );
}
