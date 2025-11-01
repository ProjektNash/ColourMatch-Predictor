import React, { useRef, useEffect } from "react";

export default function LabPlot({ target, predicted }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 55;

    ctx.clearRect(0, 0, w, h);

    /* -----------------------------
       Draw CIELAB hue background
    ----------------------------- */
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

        if (0 <= H && H < 1) { R = 1; G = X; B = 0; }
        else if (1 <= H && H < 2) { R = X; G = 1; B = 0; }
        else if (2 <= H && H < 3) { R = 0; G = 1; B = X; }
        else if (3 <= H && H < 4) { R = 0; G = X; B = 1; }
        else if (4 <= H && H < 5) { R = X; G = 0; B = 1; }
        else if (5 <= H && H < 6) { R = 1; G = 0; B = X; }

        const gray = 0.7;
        R = gray * (1 - chroma) + R * chroma;
        G = gray * (1 - chroma) + G * chroma;
        B = gray * (1 - chroma) + B * chroma;

        const idx = (y * w + x) * 4;
        data[idx] = Math.round(R * 255);
        data[idx + 1] = Math.round(G * 255);
        data[idx + 2] = Math.round(B * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    /* -----------------------------
       Grid + rings
    ----------------------------- */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;

    for (let a = 0; a < 360; a += 45) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rad) * radius, -Math.sin(rad) * radius);
      ctx.stroke();
    }

    for (let r = radius / 4; r <= radius; r += radius / 4) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    /* -----------------------------
       Axis labels (outside circle)
    ----------------------------- */
    const offset = 35;
    ctx.fillStyle = "#bfbfbf";
    ctx.font = "bold 12px sans-serif";

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("+a* (Red)", cx + radius + offset, cy);

    ctx.textAlign = "right";
    ctx.fillText("−a* (Green)", cx - radius - offset, cy);

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("+b* (Yellow)", cx, cy - radius - offset);

    ctx.textBaseline = "top";
    ctx.fillText("−b* (Blue)", cx, cy + radius + offset);

    /* -----------------------------
       Dynamic Scaling + Points
    ----------------------------- */
    const maxAbs = Math.max(
      Math.abs(target.a), Math.abs(target.b),
      Math.abs(predicted.a), Math.abs(predicted.b), 100
    );
    const scale = radius / maxAbs; // adaptive radius mapping

    const mapX = (a) => cx + a * scale;
    const mapY = (b) => cy - b * scale;

    // Target
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mapX(target.a), mapY(target.b), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Predicted
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(mapX(predicted.a), mapY(predicted.b), 4, 0, Math.PI * 2);
    ctx.fill();

    // Connector
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(mapX(target.a), mapY(target.b));
    ctx.lineTo(mapX(predicted.a), mapY(predicted.b));
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Target", mapX(target.a) - 12, mapY(target.b) - 8);
    ctx.fillText("Predicted", mapX(predicted.a) + 12, mapY(predicted.b) + 12);
  }, [target, predicted]);

  return (
    <div
      style={{
        width: "360px",
        height: "280px",
        margin: "0 auto 0 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        width={340}
        height={260}
        style={{
          borderRadius: "12px",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.4)",
          background: "#1a1a1a",
        }}
      />
    </div>
  );
}
