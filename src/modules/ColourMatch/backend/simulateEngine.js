import dcData from "../data/DCInkSystem_CLEAN.json";

/* -------------------------------------------------
   Helper: Get pigment LAB by code from database
------------------------------------------------- */
function getPigmentLAB(code) {
  const upper = String(code || "").trim().toUpperCase();

  const candidates = dcData.filter((r) => {
    const ink = String(r.Ink || "").trim().toUpperCase();
    const name = String(r.Name || "").trim().toUpperCase();
    const combined = `${ink} ${name}`.trim();
    return (
      upper === ink ||
      upper === name ||
      upper === combined ||
      upper.includes(ink) ||
      upper.includes(name)
    );
  });

  if (candidates.length === 0) {
    console.warn("⚠️ No pigment match for", code);
    return { L: 70, a: 0, b: 0, name: "Unknown" };
  }

  const selected =
    candidates.find((r) => Number(r["Conc %"]) === 100) ||
    candidates[candidates.length - 1];

  return {
    L: parseFloat(selected["L*"]) || 70,
    a: parseFloat(selected["a*"]) || 0,
    b: parseFloat(selected["b*"]) || 0,
    name: String(selected.Name || ""),
  };
}

/* -------------------------------------------------
   Strength factors for different pigment families
------------------------------------------------- */
const STRENGTH_MAP = {
  RED: 1.2,
  YELLOW: 1.1,
  BLUE: 1.3,
  GREEN: 1.0,
  VIOLET: 1.25,
  BLACK: 0.8,
  WHITE: 0.6,
  ORANGE: 1.15,
  MAGENTA: 1.25,
  EXTENDER: 0.4,
  BASE: 0.5,
};

/* -------------------------------------------------
   Simulate LAB shift after formula edit
------------------------------------------------- */
export function simulateLab(baseLab, newFormula, oldFormula) {
  let dL = 0,
    da = 0,
    db = 0;

  // global tweak sensitivity
  const kBase = 0.5; // slightly stronger (was 0.35)

  newFormula.forEach((p) => {
    const code = String(p.code || "").trim();
    const newPct = parseFloat(p.pct || p.Percentage || 0) || 0;
    const oldPct =
      (oldFormula.find((x) => x.code === code)?.pct ||
        oldFormula.find((x) => x.code === code)?.Percentage ||
        0) ?? 0;
    const diff = newPct - oldPct;
    if (diff === 0) return;

    const ref = getPigmentLAB(code);
    if (!ref) return;

    // find strength weight from pigment family
    const key = Object.keys(STRENGTH_MAP).find((k) =>
      ref.name.toUpperCase().includes(k)
    );
    const kStrength = key ? STRENGTH_MAP[key] : 1.0;

    // estimate pigment chroma magnitude
    const chroma = Math.sqrt(ref.a ** 2 + ref.b ** 2);
    const chromaFactor = 1 + chroma / 80; // boosts vivid pigments (reds/blues)

    // direction factor (scaled by % change, strength, and chroma)
    const factor = (diff / 100) * kBase * kStrength * chromaFactor;

    // Apply influence — dark colours reduce L, bright lift it
    dL += (ref.L - 70) * factor;
    da += ref.a * factor;
    db += ref.b * factor;

    console.log(
      `→ ${code} (${ref.name}) changed ${diff.toFixed(2)}% | ΔL=${dL.toFixed(
        2
      )}, Δa=${da.toFixed(2)}, Δb=${db.toFixed(2)}`
    );
  });

  return {
    L: +(baseLab.L + dL).toFixed(2),
    a: +(baseLab.a + da).toFixed(2),
    b: +(baseLab.b + db).toFixed(2),
  };
}
