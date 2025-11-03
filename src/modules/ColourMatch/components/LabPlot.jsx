import React, { useRef, useEffect } from "react";

export default function LabPlot({ target, predicted }) {
  const wheelRef = useRef(null);
  const zoomRef = useRef(null);
  const lightRef = useRef(null);

  /* ---------------------------
     GLOBAL LAB WHEEL
  --------------------------- */
  useEffect(() => {
    const canvas = wheelRef.current;
    const ctx = canvas.getContext("2d");

    const w = 300;
    const h = 300;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 20;

    ctx.clearRect(0, 0, w, h);

    // Background colour wheel
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = cy - y;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > radius) continue;

        const hue = (Math.atan2(dy, dx) * 180) / Math.PI;
        const chroma = r / radius;
        const H = ((hue + 360) % 360) / 60;
        const X = 1 - Math.abs((H % 2) - 1);
        let R = 0, G = 0, B = 0;

        if (0 <= H && H < 1) { R = 1; G = X; }
        else if (1 <= H && H < 2) { R = X; G = 1; }
        else if (2 <= H && H < 3) { G = 1; B = X; }
        else if (3 <= H && H < 4) { G = X; B = 1; }
        else if (4 <= H && H < 5) { R = X; B = 1; }
        else if (5 <= H && H < 6) { R = 1; B = X; }

        const gray = 0.7;
        R = gray * (1 - chroma) + R * chroma;
        G = gray * (1 - chroma) + G * chroma;
        B = gray * (1 - chroma) + B * chroma;

        const i = (y * w + x) * 4;
        data[i] = Math.round(R * 255);
        data[i + 1] = Math.round(G * 255);
        data[i + 2] = Math.round(B * 255);
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Rings
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    for (let r = radius / 4; r <= radius; r += radius / 4) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Points
    const scale = radius / 100;
    const mapX = (a) => cx + a * scale;
    const mapY = (b) => cy - b * scale;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(mapX(target.a), mapY(target.b), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(mapX(predicted.a), mapY(predicted.b), 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(mapX(target.a), mapY(target.b));
    ctx.lineTo(mapX(predicted.a), mapY(predicted.b));
    ctx.stroke();
  }, [target, predicted]);

  /* ---------------------------
     LIGHTNESS BAR
  --------------------------- */
  useEffect(() => {
    const canvas = lightRef.current;
    const ctx = canvas.getContext("2d");
    const w = 25;
    const h = 300;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "white");
    grad.addColorStop(1, "black");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const tY = h - (target.L / 100) * h;
    const pY = h - (predicted.L / 100) * h;

    ctx.fillStyle = "black";
    ctx.fillRect(0, tY - 2, w, 4);
    ctx.fillStyle = "red";
    ctx.fillRect(0, pY - 2, w, 4);

    ctx.strokeStyle = "#777";
    ctx.strokeRect(0, 0, w, h);
  }, [target, predicted]);

  /* ---------------------------
     ZOOMED CROSSHAIR
  --------------------------- */
  useEffect(() => {
    const canvas = zoomRef.current;
    const ctx = canvas.getContext("2d");

    const w = 300;
    const h = 300;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    const step = 30;
    for (let i = step; i < w; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = step; i < h; i += step) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    // 🔍 Increased zoom factor for subtle changes
    const diffA = predicted.a - target.a;
    const diffB = predicted.b - target.b;
    const scale = 20; // was 8 → now zoomed 2.5x

    const px = cx + diffA * scale;
    const py = cy - diffB * scale;

    // Target (center)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Predicted (offset)
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Connector line
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Optional labels for Δa, Δb
    ctx.fillStyle = "#ccc";
    ctx.font = "12px monospace";
    ctx.fillText(`Δa: ${(diffA).toFixed(2)}`, 10, 20);
    ctx.fillText(`Δb: ${(diffB).toFixed(2)}`, 10, 40);
  }, [target, predicted]);

  /* ---------------------------
     RENDER LAYOUT
  --------------------------- */
  return (
    <div
      className="d-flex justify-content-center align-items-start"
      style={{
        width: "100%",
        gap: "2rem",
        flexWrap: "nowrap",
        marginTop: "-20px",
      }}
    >
      {/* Colour Wheel */}
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "8px",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        <canvas ref={wheelRef} width={300} height={300} />
        <p className="text-center text-light mt-2 small mb-0">
          Global LAB Wheel
        </p>
      </div>

      {/* Lightness Bar */}
      <canvas
        ref={lightRef}
        width={25}
        height={300}
        style={{
          borderRadius: "8px",
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.4)",
        }}
      />

      {/* Zoomed Crosshair */}
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "8px",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        <canvas ref={zoomRef} width={300} height={300} />
        <p className="text-center text-light mt-2 small mb-0">
          Zoomed Crosshair (High Sensitivity)
        </p>
      </div>
    </div>
  );
}
