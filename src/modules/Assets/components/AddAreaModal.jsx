import React, { useState } from "react";
import axios from "axios";

export default function AddAreaModal({ show, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // ✅ Correct route (matches backend log: /api/asset-area)
      const res = await axios.post("http://localhost:5000/api/asset-area", { name });

      if (onSaved) onSaved(res.data); // notify parent to refresh list
      setName("");
      onClose();
    } catch (err) {
      console.error("❌ Error saving area:", err);
      alert(err.response?.data?.error || "Error saving area");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block bg-dark bg-opacity-50">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content p-3">
          <h5 className="fw-bold mb-3">Add Area</h5>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="form-control my-2"
              placeholder="Enter Area Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
