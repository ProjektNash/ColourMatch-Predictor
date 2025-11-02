import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function AddAssetModal({ show, onClose, onSave, existingAsset }) {
  const blankState = {
    code: "",
    name: "",
    category: "",
    model: "",
    serial: "",
    status: "Active",
    installDate: "",
    purchaseDate: "",
    supplier: "",
    purchaseCost: "",
    warrantyExpiry: "",
    disposalDate: "",
    disposalValue: "",
    disposalReason: "",
  };

  const [form, setForm] = useState(blankState);

  // ✅ Auto-fill fields if editing
  useEffect(() => {
    if (existingAsset) {
      setForm(existingAsset);
    } else {
      setForm(blankState);
    }
  }, [existingAsset]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      alert("Please enter at least Asset Code and Name.");
      return;
    }

    const assetToSave = existingAsset
  ? { ...existingAsset, ...form }
  : { ...form }; // backend will assign _id


    onSave(assetToSave);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal d-block bg-dark bg-opacity-50">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content p-3">
          <h5 className="mb-3">
            {existingAsset ? "Edit Asset" : "Add Asset"}
          </h5>

          <form onSubmit={handleSubmit}>
            {/* ===== Core Operations ===== */}
            <h6 className="fw-bold text-primary mt-2 mb-2">1. Core Operations</h6>
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <label className="form-label small">Asset Code / ID</label>
                <input
                  type="text"
                  className="form-control"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-8">
                <label className="form-label small">Asset Name / Description</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small">Category / Type</label>
                <input
                  type="text"
                  className="form-control"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Model</label>
                <input
                  type="text"
                  className="form-control"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Serial Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="serial"
                  value={form.serial}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option>Active</option>
                  <option>Out of Service</option>
                  <option>Scrapped</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small">
                  Installation / Commission Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="installDate"
                  value={form.installDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ===== Finullce & Lifecycle ===== */}
            <h6 className="fw-bold text-primary mt-3 mb-2">
              2. Finance & Lifecycle
            </h6>
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <label className="form-label small">Purchase Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="purchaseDate"
                  value={form.purchaseDate}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Supplier</label>
                <input
                  type="text"
                  className="form-control"
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Purchase Cost (£)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="purchaseCost"
                  value={form.purchaseCost}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Warranty Expiry</label>
                <input
                  type="date"
                  className="form-control"
                  name="warrantyExpiry"
                  value={form.warrantyExpiry}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">
                  Disposal / Write-Off Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="disposalDate"
                  value={form.disposalDate}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Disposal Value (£)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="disposalValue"
                  value={form.disposalValue}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label small">
                  Disposal / Write-Off Reason
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="disposalReason"
                  value={form.disposalReason}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* ===== Footer ===== */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className={`btn ${existingAsset ? "btn-warning" : "btn-primary"}`}>
                {existingAsset ? "Update Asset" : "Save Asset"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
