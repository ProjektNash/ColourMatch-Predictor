import React, { useState, useMemo, useEffect } from "react";
import pmsData from "../data/PMSReference_CLEAN.json";
import LabPlot from "./LabPlot";
import { predictFormula } from "../backend/predictionEngine.js";
import { simulateLab } from "../backend/simulateEngine.js";

/* ---------- ΔE00 (CIEDE2000) ---------- */
function deltaE00(l1, l2) {
  const { L: L1, a: a1, b: b1 } = l1;
  const { L: L2, a: a2, b: b2 } = l2;
  const avgL = (L1 + L2) / 2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G =
    0.5 *
    (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  const h1p =
    (Math.atan2(b1, a1p) * 180) / Math.PI + (Math.atan2(b1, a1p) >= 0 ? 0 : 360);
  const h2p =
    (Math.atan2(b2, a2p) * 180) / Math.PI + (Math.atan2(b2, a2p) >= 0 ? 0 : 360);
  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;
  let deltahp;
  if (C1p * C2p === 0) deltahp = 0;
  else if (Math.abs(h2p - h1p) <= 180) deltahp = h2p - h1p;
  else deltahp = h2p <= h1p ? h2p - h1p + 360 : h2p - h1p - 360;
  const deltaHp =
    2 * Math.sqrt(C1p * C2p) * Math.sin((deltahp / 2) * (Math.PI / 180));
  const avgHp =
    C1p * C2p === 0
      ? h1p + h2p
      : Math.abs(h1p - h2p) <= 180
      ? (h1p + h2p) / 2
      : (h1p + h2p + 360) / 2;
  const T =
    1 - 
    0.17 * Math.cos(((avgHp - 30) * Math.PI) / 180) +
    0.24 * Math.cos(((2 * avgHp) * Math.PI) / 180) +
    0.32 * Math.cos(((3 * avgHp + 6) * Math.PI) / 180) - 
    0.2 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);
  const SL = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const deltaTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
  const RC =
    2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin((2 * deltaTheta * Math.PI) / 180);
  return Math.sqrt(
    (deltaLp / SL) ** 2 +
    (deltaCp / SC) ** 2 +
    (deltaHp / SH) ** 2 +
    RT * (deltaCp / SC) * (deltaHp / SH)
  );
}

/* ---------- LAB → sRGB ---------- */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function labToXYZ({ L, a, b }) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const f = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const Xn = 95.047,
    Yn = 100,
    Zn = 108.883;
  return { X: Xn * f(fx), Y: Yn * f(fy), Z: Zn * f(fz) };
}
function xyzToLinearRGB({ X, Y, Z }) {
  const x = X / 100,
    y = Y / 100,
    z = Z / 100;
  return {
    r: 3.2406 * x - 1.5372 * y - 0.4986 * z,
    g: -0.9689 * x + 1.8758 * y + 0.0415 * z,
    b: 0.0557 * x - 0.204 * y + 1.057 * z,
  };
}
function linearToSRGB(u) {
  return u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
}
function labToSRGB(lab) {
  const { r, g, b } = xyzToLinearRGB(labToXYZ(lab));
  const R = clamp(Math.round(linearToSRGB(r) * 255), 0, 255);
  const G = clamp(Math.round(linearToSRGB(g) * 255), 0, 255);
  const B = clamp(Math.round(linearToSRGB(b) * 255), 0, 255);
  return `rgb(${R}, ${G}, ${B})`;
}

/* ---------- PMS Helper ---------- */
function getClosestPMS(target, searchTerm = "", n = 8) {
  if (!target) return [];
  return [...pmsData]
    .filter(p => p.Pantone.toLowerCase().includes(searchTerm.toLowerCase()))  // Filter based on searchTerm
    .map((p) => ({
      ...p,
      dE: deltaE00(target, { L: +p.L, a: +p.a, b: +p.b }),
    }))
    .sort((a, b) => a.dE - b.dE)
    .slice(0, n);
}

/* ---------- Colour Patch ---------- */
function Patch({ label, lab }) {
  const safeL = parseFloat(lab?.L) || 0;
  const safeA = parseFloat(lab?.a) || 0;
  const safeB = parseFloat(lab?.b) || 0;
  const bg = useMemo(() => labToSRGB({ L: safeL, a: safeA, b: safeB }), [
    safeL,
    safeA,
    safeB,
  ]);
  return (
    <div className="text-center">
      <div
        className="rounded border shadow-sm mx-auto mb-2"
        style={{ width: "90px", height: "90px", background: bg }}
      />
      <small className="text-muted">
        {label}: L{safeL.toFixed(1)} a{safeA.toFixed(1)} b{safeB.toFixed(1)}
      </small>
    </div>
  );
}

/* ---------- Main ---------- */
export default function ColourMatchModule() {
  const [target, setTarget] = useState({ L: "75", a: "5", b: "65" });
  const [result, setResult] = useState(null);
  const [original, setOriginal] = useState(null);
  const [closestPMS, setClosestPMS] = useState([]);
  const [selectedPMS, setSelectedPMS] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedOffsets, setSelectedOffsets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");  // Add searchTerm state

  const parsedTarget = {
    L: parseFloat(target.L) || 0,
    a: parseFloat(target.a) || 0,
    b: parseFloat(target.b) || 0,
  };

  useEffect(() => {
    setClosestPMS(getClosestPMS(parsedTarget, searchTerm));  // Include searchTerm
  }, [target, searchTerm]);  // Recalculate when either target or searchTerm changes

  const handleSelectPMS = (p) => {
    setSelectedPMS(p);
    setTarget({
      L: String(+p.L.toFixed(2)),
      a: String(+p.a.toFixed(2)),
      b: String(+p.b.toFixed(2)),
    });
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const parsed = {
        L: parseFloat(target.L) || 0,
        a: parseFloat(target.a) || 0,
        b: parseFloat(target.b) || 0,
      };

      const data = await predictFormula(parsed);
      const formulaList =
        data?.output?.formula || data?.formula || data?.output || [];

      const cleanFormula = formulaList.map((f, i) => ({
        code: f.code || f.Code || f.ItemCode || `Pigment-${i + 1}`,
        pct: parseFloat(f.pct ?? f.Percentage ?? f.percent ?? 0),
      }));

      const predictedLab =
        data?.predicted ||
        data?.output?.predicted ||
        data?.result?.predicted ||
        parsed;

      const closestPMSData = getClosestPMS(parsedTarget)[0];
      const cleanResult = {
        ...data,
        predicted: predictedLab,
        formula: cleanFormula,
        source: closestPMSData?.dE <= 2
          ? `PMS ${closestPMSData.Pantone}`
          : "Predicted Formula",
      };

      setResult(cleanResult);
      setOriginal(cleanResult);
    } catch (err) {
      console.error("Predict error:", err);
      alert("Prediction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPct = (i, val) => {
    if (!mode) {
      alert("Please select a mode first.");
      return;
    }

    const newValue = parseFloat(val) || 0;
    const newFormula = [...result.formula];
    const oldValue = newFormula[i].pct || 0;
    const diff = newValue - oldValue;
    newFormula[i] = { ...newFormula[i], pct: newValue };

    if (mode === "offset") {
      if (selectedOffsets.length !== 2) {
        alert("Select exactly two pigments for Smart Offset mode.");
        return;
      }
      const otherIndex = selectedOffsets.find((idx) => idx !== i);
      if (otherIndex !== undefined) {
        newFormula[otherIndex].pct = parseFloat(
          (newFormula[otherIndex].pct - diff).toFixed(2)
        );
      }
    } else if (mode === "proportional") {
      const totalBefore = newFormula.reduce((s, x) => s + (x.pct || 0), 0);
      const diffTotal = totalBefore - 100;
      const others = newFormula.filter((_, idx) => idx !== i);
      const totalOthers = others.reduce((s, x) => s + (x.pct || 0), 0);
      if (Math.abs(diffTotal) > 0.0001 && totalOthers > 0) {
        newFormula.forEach((pig, idx) => {
          if (idx !== i) {
            const share = pig.pct / totalOthers;
            pig.pct = parseFloat((pig.pct - diffTotal * share).toFixed(2));
          }
        });
      }
    }

    const total = newFormula.reduce((s, x) => s + (x.pct || 0), 0);
    const correction = 100 - total;
    newFormula[i].pct = parseFloat((newFormula[i].pct + correction).toFixed(2));
    const newPredicted = simulateLab(result.predicted, newFormula, result.formula);
    setResult({ ...result, formula: newFormula, predicted: newPredicted });
  };

  const handleReset = () => setResult(original);

  const dE00 = useMemo(
    () => (result ? deltaE00(parsedTarget, result.predicted) : 0),
    [parsedTarget, result]
  );

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Predicted Colour Match</h2>

      <div className="row g-4 align-items-stretch">
        {/* ---------- Left Side ---------- */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Target LAB</h5>

              {/* PMS and Closest */}
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fw-semibold">PMS Database</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Search PMS Reference"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}  // Update search term
                  />
                  <div
                    className="border rounded p-2"
                    style={{ maxHeight: 200, overflowY: "auto", background: "#fafafa" }}
                  >
                    {pmsData
                      .filter((p) => p.Pantone.toLowerCase().includes(searchTerm.toLowerCase()))  // Filter based on searchTerm
                      .slice(0, 20)
                      .map((p, i) => {
                        const color = labToSRGB({ L: +p.L, a: +p.a, b: +p.b });
                        return (
                          <div
                            key={i}
                            className="d-flex align-items-center p-1 hover-bg-light"
                            role="button"
                            onClick={() => handleSelectPMS(p)}
                          >
                            <div
                              className="me-2 border rounded"
                              style={{
                                width: 20,
                                height: 20,
                                background: color,
                                border: "1px solid #ccc",
                              }}
                            ></div>
                            <span className="small">{p.Pantone}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="col-6">
                  <label className="form-label fw-semibold">Closest 8 PMS Shades</label>
                  <div
                    className="border rounded p-2"
                    style={{ maxHeight: 200, overflowY: "auto", background: "#fafafa" }}
                  >
                    {closestPMS.map((p, i) => {
                      const color = labToSRGB({ L: +p.L, a: +p.a, b: +p.b });
                      return (
                        <div
                          key={i}
                          className="d-flex align-items-center justify-content-between p-1"
                        >
                          <div className="d-flex align-items-center">
                            <div
                              className="me-2 border rounded"
                              style={{
                                width: 20,
                                height: 20,
                                background: color,
                                border: "1px solid #ccc",
                              }}
                            ></div>
                            <span className="small">{p.Pantone}</span>
                          </div>
                          <small className="text-muted">ΔE={p.dE.toFixed(2)}</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* LAB Values and Predict Button */}
              <div className="row g-2 mt-3">
                {["L", "a", "b"].map((axis) => (
                  <div className="col-4" key={axis}>
                    <label className="form-label mb-1 fw-semibold">{axis}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={target[axis]}
                      onChange={(e) =>
                        setTarget({ ...target, [axis]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                className="btn btn-dark w-100 mt-3"
                onClick={handlePredict}
                disabled={loading}
              >
                {loading ? "Predicting..." : "Predict Formula"}
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Formula Section ---------- */}
        {result && (
          <div className="col-md-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="card-title mb-0">Editable Formula</h5>
                    {result.source && (
                      <span
                        className={`badge ${
                          result.source.toLowerCase().includes("pms")
                            ? "bg-primary"
                            : "bg-warning text-dark"
                        }`}
                        style={{ marginRight: "8px" }}
                      >
                        {result.source}
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="btn-group">
                      <button
                        className={`btn btn-sm ${
                          mode === "proportional" ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => {
                          setMode("proportional");
                          setSelectedOffsets([]);
                        }}
                      >
                        Proportional Mode
                      </button>
                      <button
                        className={`btn btn-sm ${
                          mode === "offset" ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => {
                          setMode("offset");
                          setSelectedOffsets([]);
                        }}
                      >
                        Smart Offset Mode
                      </button>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>
                </div>
                {/* Formula Table */}
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        {mode === "offset" && <th style={{ width: "40px" }}></th>}
                        <th>Item Code</th>
                        <th className="text-end">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.formula.map((row, i) => {
                        const isEditable =
                          mode === "proportional" ||
                          (mode === "offset" && selectedOffsets.includes(i));
                        return (
                          <tr key={i}>
                            {mode === "offset" && (
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedOffsets.includes(i)}
                                  onChange={(e) => {
                                    const updated = e.target.checked
                                      ? [...selectedOffsets, i]
                                      : selectedOffsets.filter((idx) => idx !== i);
                                    setSelectedOffsets(updated.slice(-2));
                                  }}
                                />
                              </td>
                            )}
                            <td className="fw-semibold">{row.code}</td>
                            <td className="text-end">
                              <input
                                type="number"
                                className="form-control text-end"
                                style={{ width: "80px", display: "inline-block" }}
                                value={row.pct || 0}
                                onChange={(e) => handleEditPct(i, e.target.value)}
                                disabled={ 
                                  !mode ||
                                  (mode === "offset" && 
                                    (selectedOffsets.length !== 2 || !selectedOffsets.includes(i)))
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="table-light">
                        <td colSpan={mode === "offset" ? 2 : 1}>Total</td>
                        <td className="text-end fw-bold">
                          {result.formula
                            .reduce((s, r) => s + (r.pct || 0), 0)
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Visual Comparison */}
      {result && (
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Visual Comparison</h5>
            <div className="d-flex align-items-center justify-content-center flex-wrap gap-5">
              <div className="text-center">
                <div className="d-flex justify-content-center align-items-start gap-4 mb-2">
                  <Patch label="Target" lab={parsedTarget} />
                  <Patch label="Predicted" lab={result.predicted} />
                </div>
                <div className="mt-2">
                  <span className="text-muted me-2">ΔE₀₀:</span>
                  <span
                    className={
                      dE00 < 2
                        ? "text-success fw-bold"
                        : dE00 < 5
                        ? "text-warning fw-bold"
                        : "text-danger fw-bold"
                    }
                  >
                    {dE00.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <LabPlot target={parsedTarget} predicted={result.predicted} />
                <div
                  style={{
                    width: "20px",
                    height: "200px",
                    background: "linear-gradient(white, black)",
                    borderRadius: "6px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${parsedTarget.L}%`,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      backgroundColor: "black",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${result.predicted.L}%`,
                      left: 0,
                      width: "100%",
                      height: "2px",
                      backgroundColor: "red",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
