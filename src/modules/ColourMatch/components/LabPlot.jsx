import React, { useRef, useEffect } from "react";

export default function LabPlot({ target, predicted }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw crosshair axes
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#666";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("+a* (Red)", w - 25, h / 2 - 4);
    ctx.fillText("−a* (Green)", 30, h / 2 - 4);
    ctx.save();
    ctx.translate(w / 2 + 10, 15);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("+b* (Yellow)", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(w / 2 - 10, h - 5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("−b* (Blue)", 0, 0);
    ctx.restore();

    // Convert LAB to 2D coords (a,b range: roughly -100 to +100)
    const scale = 1.2;
    const mapX = (a) => w / 2 + a * (w / 250) * scale;
    const mapY = (b) => h / 2 - b * (h / 250) * scale;

    // Draw target point
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(mapX(target.a), mapY(target.b), 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw predicted point
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(mapX(predicted.a), mapY(predicted.b), 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw vector line between them
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mapX(target.a), mapY(target.b));
    ctx.lineTo(mapX(predicted.a), mapY(predicted.b));
    ctx.stroke();
  }, [target, predicted]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{
        border: "1px solid #ccc",
        borderRadius: "6px",
        background: "#fff",
      }}
    />
  );
}
