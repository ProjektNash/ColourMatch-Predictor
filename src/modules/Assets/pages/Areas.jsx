import React, { useState, useEffect } from "react";
import axios from "axios";
import AddAreaModal from "../components/AddAreaModal";
import AreaAssets from "./AreaAssets";

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [assetCounts, setAssetCounts] = useState({}); // store count per area

  useEffect(() => {
    fetchAreas();
  }, []);

  // 🔹 Fetch all areas
  const fetchAreas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/assetareas");
      setAreas(res.data);
      fetchAssetCounts(res.data);
    } catch (err) {
      console.error("❌ Error fetching areas:", err.message);
    }
  };

  // 🔹 Fetch asset counts per area
  const fetchAssetCounts = async (areasList) => {
    try {
      const counts = {};
      await Promise.all(
        areasList.map(async (a) => {
          const res = await axios.get(
            `http://localhost:5000/api/assets?areaId=${a._id}`
          );
          counts[a._id] = res.data.length;
        })
      );
      setAssetCounts(counts);
    } catch (err) {
      console.error("❌ Error fetching asset counts:", err.message);
    }
  };

  // 🔹 Handle area added
  const handleAreaAdded = (newArea) => {
    setAreas((prev) => [...prev, newArea]);
    setAssetCounts((prev) => ({ ...prev, [newArea._id]: 0 }));
  };

  // 🔹 Delete area
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this area?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/assetareas/${id}`);
      setAreas((prev) => prev.filter((a) => a._id !== id));
      setAssetCounts((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch {
      alert("Error deleting area");
    }
  };

  // 🔹 Switch to AreaAssets view
  if (selectedArea) {
    return (
      <AreaAssets
        area={selectedArea}
        goBack={() => {
          setSelectedArea(null);
          fetchAreas(); // refresh counts when returning
        }}
      />
    );
  }

  // 🔹 Main table view
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 fw-semibold">Asset Areas</h4>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Area
        </button>
      </div>

      {areas.length === 0 ? (
        <p className="text-secondary">No areas added yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle shadow-sm">
            <thead className="table-light">
              <tr>
                <th style={{ width: "50%" }}>Area Name</th>
                <th style={{ width: "20%" }} className="text-center">
                  Assets
                </th>
                <th style={{ width: "30%" }} className="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area._id}>
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedArea(area)}
                  >
                    {area.name}
                  </td>
                  <td className="text-center">
                    {assetCounts[area._id] ?? "-"}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(area._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Area Modal */}
      <AddAreaModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleAreaAdded}
      />
    </div>
  );
}
