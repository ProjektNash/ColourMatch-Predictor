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
   Simulate LAB shift after formula edit (with extender effect)
------------------------------------------------- */
export function simulateLab(baseLab, newFormula, oldFormula) {
  let dL = 0, da = 0, db = 0;
  const kBase = 0.5; // global tweak sensitivity

  // Identify extender rows (anything containing "EXT" etc.)
  const extenderRow = newFormula.find(
    (p) => String(p.code || "").toUpperCase().includes("EXT")
  );
  const oldExtRow = oldFormula.find(
    (p) => String(p.code || "").toUpperCase().includes("EXT")
  );

  const newExt = parseFloat(extenderRow?.pct || extenderRow?.Percentage || 0) || 0;
  const oldExt = parseFloat(oldExtRow?.pct || oldExtRow?.Percentage || 0) || 0;
  const diffExt = newExt - oldExt;

  // Base substrate colour (acts as white background)
  const substrateLab = { L: 95, a: 0, b: 2 };

  /* --------------------------
     1️⃣ Handle extender first
  -------------------------- */
  if (diffExt !== 0) {
    // positive = added extender → lighten
    // negative = removed extender → darken
    const extStrength = STRENGTH_MAP.EXTENDER || 0.4;
    const factor = (diffExt / 100) * kBase * extStrength;

    dL += (substrateLab.L - baseLab.L) * factor;
    da += (substrateLab.a - baseLab.a) * factor;
    db += (substrateLab.b - baseLab.b) * factor;

    console.log(
      `→ Extender changed ${diffExt.toFixed(2)}% | ΔL=${dL.toFixed(
        2
      )}, Δa=${da.toFixed(2)}, Δb=${db.toFixed(2)}`
    );
  }

  /* --------------------------
     2️⃣ Handle pigment changes
  -------------------------- */
  newFormula.forEach((p) => {
    const code = String(p.code || "").trim().toUpperCase();
    if (code.includes("EXT")) return; // skip extender (already handled)

    const newPct = parseFloat(p.pct || p.Percentage || 0) || 0;
    const oldPct =
      (oldFormula.find((x) => x.code?.toUpperCase() === code)?.pct ||
        oldFormula.find((x) => x.code?.toUpperCase() === code)?.Percentage ||
        0) ?? 0;

    const diff = newPct - oldPct;
    if (diff === 0) return;

    const ref = getPigmentLAB(code);
    if (!ref) return;

    // Determine pigment strength from its family
    const key = Object.keys(STRENGTH_MAP).find((k) =>
      ref.name.toUpperCase().includes(k)
    );
    const kStrength = key ? STRENGTH_MAP[key] : 1.0;

    // Boost vivid pigments slightly
    const chroma = Math.sqrt(ref.a ** 2 + ref.b ** 2);
    const chromaFactor = 1 + chroma / 80;

    // Compute influence factor
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

  /* --------------------------
     3️⃣ Return adjusted LAB
  -------------------------- */
  return {
    L: +(baseLab.L + dL).toFixed(2),
    a: +(baseLab.a + da).toFixed(2),
    b: +(baseLab.b + db).toFixed(2),
  };
}
