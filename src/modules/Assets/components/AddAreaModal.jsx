import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function AddAreaModal({ show, onClose, onSave }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ id: uuidv4(), name, assets: [] });
    setName("");
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal d-block bg-dark bg-opacity-50">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content p-3">
          <h5>Add Area</h5>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="form-control my-2"
              placeholder="Area Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
