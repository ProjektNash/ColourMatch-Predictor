import React, { useState, useMemo } from "react";
import pmsData from "../data/PMSReference_CLEAN.json";
import LabPlot from "./LabPlot";


import { predictFormula } from "../backend/predictionEngine.js";

/* =============================
   ΔE00 (CIEDE2000)
   ============================= */
function deltaE00(l1, l2) {
  const { L: L1, a: a1, b: b1 } = l1;
  const { L: L2, a: a2, b: b2 } = l2;
  const avgL = (L1 + L2) / 2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  const h1p = (Math.atan2(b1, a1p) * 180) / Math.PI + (Math.atan2(b1, a1p) >= 0 ? 0 : 360);
  const h2p = (Math.atan2(b2, a2p) * 180) / Math.PI + (Math.atan2(b2, a2p) >= 0 ? 0 : 360);
  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;
  let deltahp;
  if (C1p * C2p === 0) deltahp = 0;
  else if (Math.abs(h2p - h1p) <= 180) deltahp = h2p - h1p;
  else deltahp = h2p <= h1p ? h2p - h1p + 360 : h2p - h1p - 360;
  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((deltahp / 2) * (Math.PI / 180));
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
    0.20 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);
  const SL = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const deltaTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin((2 * deltaTheta * Math.PI) / 180);
  return Math.sqrt(
    (deltaLp / SL) ** 2 +
      (deltaCp / SC) ** 2 +
      (deltaHp / SH) ** 2 +
      RT * (deltaCp / SC) * (deltaHp / SH)
  );
}

/* =============================
   Helper (LAB → sRGB)
   ============================= */
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
    b: 0.0557 * x - 0.2040 * y + 1.0570 * z,
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

/* =============================
   Subcomponent: Colour Patch
   ============================= */
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

/* =============================
   PMS Shade Lookup Component
   ============================= */
function PmsSelector({ onSelect }) {
  const [query, setQuery] = useState("");
  const filtered = pmsData.filter((p) =>
    p.Pantone.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">PMS Shade Lookup</label>
      <input
        type="text"
        className="form-control mb-2"
        placeholder="Search PMS (e.g. 186 C, Cool Gray 5)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div
        className="border rounded p-2"
        style={{
          maxHeight: "200px",
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {filtered.slice(0, 20).map((p, i) => {
          const color = labToSRGB({ L: +p.L, a: +p.a, b: +p.b });
          return (
            <div
              key={i}
              className="d-flex align-items-center p-1 hover-bg-light"
              role="button"
              onClick={() => onSelect(p)}
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
        {filtered.length === 0 && (
          <small className="text-muted">No matches found.</small>
        )}
      </div>
    </div>
  );
}

/* =============================
   Main ColourMatchModule
   ============================= */
export default function ColourMatchModule() {
  const [target, setTarget] = useState({ L: "75", a: "5", b: "65" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    const parsed = {
      L: parseFloat(target.L) || 0,
      a: parseFloat(target.a) || 0,
      b: parseFloat(target.b) || 0,
    };
    const data = await predictFormula(parsed);
    setResult(data);
    setLoading(false);
  };

  const handleSelectPMS = (p) => {
    setTarget({
      L: String(+p.L.toFixed(2)),
      a: String(+p.a.toFixed(2)),
      b: String(+p.b.toFixed(2)),
    });
  };

  const parsedTarget = {
    L: parseFloat(target.L) || 0,
    a: parseFloat(target.a) || 0,
    b: parseFloat(target.b) || 0,
  };
  const dE00 = useMemo(
    () => (result ? deltaE00(parsedTarget, result.predicted) : 0),
    [parsedTarget, result]
  );

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Predicted Colour Match</h2>
      <div className="row g-4">
        {/* Target LAB + PMS lookup */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Target LAB</h5>
              <PmsSelector onSelect={handleSelectPMS} />
              <div className="row g-2">
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
                      placeholder={axis === "L" ? "0–100" : "-128–128"}
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

        {/* Colour comparison */}
<div className="col-md-4">
  <div className="card shadow-sm">
    <div className="card-body">
      <h5 className="card-title mb-3">Visual Comparison</h5>

      {/* Colour patches */}
      <div className="d-flex justify-content-around align-items-center mb-3">
        <Patch label="Target" lab={parsedTarget} />
        {result && <Patch label="Predicted" lab={result.predicted} />}
      </div>

      {/* ΔE display */}
      {result && (
        <div className="mb-3">
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
      )}

      {/* LAB direction & L* comparison */}
      {result && (
        <div className="d-flex justify-content-center align-items-start mt-3 gap-3">
          {/* ab-plane plot */}
          <LabPlot target={parsedTarget} predicted={result.predicted} />

          {/* L-star vertical scale */}
          <div
            style={{
              width: "20px",
              height: "200px",
              background: "linear-gradient(white, black)",
              borderRadius: "6px",
              position: "relative",
            }}
          >
            {/* Target L* */}
            <div
              style={{
                position: "absolute",
                bottom: `${parsedTarget.L}%`,
                left: 0,
                width: "100%",
                height: "2px",
                backgroundColor: "black",
              }}
              title={`Target L*: ${parsedTarget.L}`}
            ></div>

            {/* Predicted L* */}
            <div
              style={{
                position: "absolute",
                bottom: `${result.predicted.L}%`,
                left: 0,
                width: "100%",
                height: "2px",
                backgroundColor: "red",
              }}
              title={`Predicted L*: ${result.predicted.L}`}
            ></div>
          </div>
        </div>
      )}

      <small className="text-muted d-block mt-3 text-center">
        a* (→ Red / ← Green) · b* (↑ Yellow / ↓ Blue) · L* (↑ lighter)
      </small>
    </div>
  </div>
</div>


        {/* Notes */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Notes</h5>
              <ul className="small text-muted mb-0 ps-3">
                <li>
                  Use the PMS lookup to prefill LAB values, then adjust manually.
                </li>
                <li>
                  Uses <code>PMSReference_CLEAN.json</code> and falls back to{" "}
                  <code>DCInkSystem_CLEAN.json</code> when needed.
                </li>
                <li>Displays ΔE₀₀, data source, and formula breakdown.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Formula output */}
      {result && (
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <h5 className="card-title mb-0">Predicted Formula</h5>
                {result.source && (
                  <span
                    className={`badge ${
                      String(result.source).toLowerCase().includes("pms")
                        ? "bg-primary"
                        : "bg-warning text-dark"
                    }`}
                  >
                    {result.source}
                  </span>
                )}
              </div>
              {result.nearestPantone && (
                <small className="text-muted">
                  Nearest PMS: <strong>{result.nearestPantone}</strong>
                </small>
              )}
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item Code</th>
                    <th className="text-end">%</th>
                  </tr>
                </thead>
                <tbody>
                  {result.formula.map((row, i) => (
                    <tr key={i}>
                      <td className="fw-semibold">{row.code}</td>
                      <td className="text-end">
                        {(row.pct || row.Percentage || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-light">
                    <td>Total</td>
                    <td className="text-end fw-bold">
                      {result.formula
                        .reduce(
                          (sum, r) => sum + (r.pct || r.Percentage || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
