import React, { useState, useEffect } from "react";
import AddAreaModal from "../components/AddAreaModal";
import { getAreas, saveAreas } from "../utils/assetHelpers";

export default function Areas({ setSelectedArea }) {
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setAreas(getAreas());
  }, []);

  const handleAddArea = (newArea) => {
    const updated = [...areas, newArea];
    setAreas(updated);
    saveAreas(updated);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this area and all its assets?")) {
      const updated = areas.filter((a) => a.id !== id);
      setAreas(updated);
      saveAreas(updated);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Asset Areas</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Area
        </button>
      </div>

      {areas.length === 0 ? (
        <p className="text-secondary">No areas defined yet.</p>
      ) : (
        <div className="row g-3">
          {areas.map((area) => (
            <div className="col-md-4" key={area.id}>
              <div
                className="card shadow-sm h-100 border-0 cursor-pointer"
                onClick={() => setSelectedArea(area)}
              >
                <div className="card-body">
                  <h5 className="card-title">{area.name}</h5>
                  <p className="text-secondary small mb-3">
                    {area.assets?.length || 0} assets
                  </p>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(area.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddAreaModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddArea}
      />
    </div>
  );
}
