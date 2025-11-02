import pmsData from "../data/PMSReference_CLEAN.json" 
import dcDataRaw from "../data/DCInkSystem_CLEAN.json" 

// Helper: get DC ink name by code from DCInkSystem_CLEAN.json
function getDcName(code) {
  const row = dcDataRaw.find(
    (r) => String(r.Ink || "").trim().toUpperCase() === String(code).trim().toUpperCase()
  );
  return row && row.Name ? String(row.Name).trim() : "";
}


/* ==========================================
   ΔE00 (CIEDE2000)
   ========================================== */
function deltaE00(l1, l2) {
  const { L: L1, a: a1, b: b1 } = l1;
  const { L: L2, a: a2, b: b2 } = l2;
  const avgL = (L1 + L2) / 2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  const h1p = (Math.atan2(b1, a1p) * 180) / Math.PI + (Math.atan2(b1, a1p) >= 0 ? 0 : 360);
  const h2p = (Math.atan2(b2, a2p) * 180) / Math.PI + (Math.atan2(b2, a2p) >= 0 ? 0 : 360);
  const deltaLp = L2 - L1, deltaCp = C2p - C1p;
  const deltahp = (C1p * C2p === 0) ? 0 :
    (Math.abs(h2p - h1p) <= 180 ? h2p - h1p : (h2p <= h1p ? h2p - h1p + 360 : h2p - h1p - 360));
  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((deltahp / 2) * (Math.PI / 180));
  const avgHp = (C1p * C2p === 0) ? (h1p + h2p) :
    (Math.abs(h1p - h2p) <= 180 ? (h1p + h2p) / 2 : (h1p + h2p + 360) / 2);
  const T = 1 - 0.17 * Math.cos(((avgHp - 30) * Math.PI) / 180)
              + 0.24 * Math.cos(((2 * avgHp) * Math.PI) / 180)
              + 0.32 * Math.cos(((3 * avgHp + 6) * Math.PI) / 180)
              - 0.20 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);
  const SL = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const deltaTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin((2 * deltaTheta * Math.PI) / 180);
  return Math.sqrt(
    (deltaLp / SL) ** 2 + (deltaCp / SC) ** 2 + (deltaHp / SH) ** 2 +
    RT * (deltaCp / SC) * (deltaHp / SH)
  );
}

/* ==========================================
   LAB ↔ XYZ helpers
   ========================================== */
function labToXyz(lab) {
  const y = (lab.L + 16) / 116;
  const x = lab.a / 500 + y;
  const z = y - lab.b / 200;
  const xyz = [x, y, z].map((v) => (v > 0.206893 ? v ** 3 : (v - 16 / 116) / 7.787));
  return { X: xyz[0] * 95.047, Y: xyz[1] * 100, Z: xyz[2] * 108.883 };
}
function xyzToLab({ X, Y, Z }) {
  const refX = 95.047, refY = 100, refZ = 108.883;
  const x = X / refX, y = Y / refY, z = Z / refZ;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

/* ==========================================
   Linear regression utility
   y ≈ m*x + b, returns {m,b}. If <2 points → {m:0,b:y0}
   ========================================== */
function fitLinear(xs, ys) {
  if (xs.length < 2) return { m: 0, b: ys[0] ?? 0 };
  const n = xs.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i];
  }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return { m: 0, b: sy / n };
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  return { m, b };
}

/* ==========================================
   Convert LAB ladder → pseudo K/S + chroma fits
   - KS via Y/100 reflectance proxy: R ≈ Y/100
   - KS = (1 - R)^2 / (2R), then KS(c) ≈ m*c + b
   - a*(c), b*(c) each linear vs c
   ========================================== */
function labToReflectanceY(lab) {
  // treat Y tristimulus as relative reflectance proxy
  const { Y } = labToXyz(lab);
  return Math.min(0.999, Math.max(0.001, Y / 100)); // clamp
}
function RtoKS(R) {
  return (1 - R) * (1 - R) / (2 * R);
}
function KStoR(KS) {
  // Invert KS = (1-R)^2/(2R)
  // Solve quadratic in R: (1 - R)^2 = 2 R KS
  // R = 1 + KS - sqrt((1 + KS)^2 - 1)
  const term = 1 + KS;
  const disc = Math.max(0, term * term - 1);
  return Math.min(0.999, Math.max(0.001, term - Math.sqrt(disc)));
}

/* ==========================================
   Build base models from DC data
   For each baseInk:
     - fit KS(c) = mKS*c + bKS   where c ∈ [0,1] from "Conc %"
     - fit a(c), b(c) linear (captures hue shift with tint)
   ========================================== */
let whiteSubstrate = { L: 100, a: 0, b: 0 };

const baseModels = new Map(); // baseInk -> { mKS,bKS, ma,ba, mb,bb, hasFit }
const dcByBase = new Map();

for (const r of dcDataRaw) {
  const ink = String(r.Ink || "").trim();
  const concPct = parseFloat(r["Conc %"]);
  const L = parseFloat(r["L*"]), a = parseFloat(r["a*"]), b = parseFloat(r["b*"]);
  if (!ink || !Number.isFinite(concPct) || !Number.isFinite(L) || !Number.isFinite(a) || !Number.isFinite(b)) continue;

  if (/white\s*substrate/i.test(ink)) {
    whiteSubstrate = { L, a, b };
    continue;
  }
  if (ink.toUpperCase().includes("DC21-002")) continue; // ignore extender rows as pigments

  const c = concPct / 100;
  const arr = dcByBase.get(ink) || [];
  arr.push({ c, L, a, b });
  dcByBase.set(ink, arr);
}

// Fit per base
for (const [baseInk, rows] of dcByBase.entries()) {
  // sort by concentration
  rows.sort((p, q) => p.c - q.c);

  // KS from L via reflectance proxy
  const xs = [], ksYs = [], aYs = [], bYs = [];
  for (const row of rows) {
    const R = labToReflectanceY({ L: row.L, a: row.a, b: row.b });
    const KS = RtoKS(R);
    xs.push(row.c);
    ksYs.push(KS);
    aYs.push(row.a);
    bYs.push(row.b);
  }

  const { m: mKS, b: bKS } = fitLinear(xs, ksYs);
  const { m: ma, b: ba } = fitLinear(xs, aYs);
  const { m: mb, b: bb } = fitLinear(xs, bYs);

  baseModels.set(baseInk, { mKS, bKS, ma, ba, mb, bb, hasFit: xs.length >= 2 });
}

/* ==========================================
   Pseudo-KM mixer using base fits
   Inputs:
     chosenBases: [{baseInk, ...}]
     pureWeights: weights per base (sum=1 over pigments only)
     pigmentTotalPct: 70..95 (overall pigment % of the ink)
   Steps:
     - For each base, c_i = pureWeight_i * (pigmentTotalPct/100)
     - KS_i = mKS*c_i + bKS
     - KS_mix = Σ KS_i
     - R_mix from KS_mix
     - L_mix from R_mix; a_mix, b_mix = weighted (by pureWeight) a_i(c_i)
     - Blend in substrate by extender fraction for a/b/L
   ========================================== */
function predictMixLAB_PseudoKS(chosenBases, pureWeights, pigmentTotalPct) {
  const t = Math.min(0.99, Math.max(0.0, (pigmentTotalPct || 85) / 100)); // pigment fraction
  let KSsum = 0;
  let aAccum = 0, bAccum = 0;

  for (let i = 0; i < chosenBases.length; i++) {
    const base = chosenBases[i].baseInk;
    const w = pureWeights[i];
    const model = baseModels.get(base);

    // If a base has no fit (not enough points), fallback: zero contribution.
    if (!model) continue;

    const c_i = w * t; // effective concentration fraction in final ink
    const KS_i = model.mKS * c_i + model.bKS;
    KSsum += Math.max(0, KS_i);

    const a_i = model.ma * c_i + model.ba;
    const b_i = model.mb * c_i + model.bb;
    aAccum += w * a_i;
    bAccum += w * b_i;
  }

  // Convert mixed KS → reflectance → Y → L*
  const Rmix = KStoR(KSsum);
  const Y = Rmix * 100;

  // Build Lab: L from Y via XYZ inverse mapping; a/b from fitted chroma, then blend substrate
  // Create XYZ with this Y and neutral X,Z to get consistent L (approx).
  const L_fromY = xyzToLab({ X: Y, Y, Z: Y }).L;

  // Substrate blend by extender fraction (1 - t)
  const L = (t * L_fromY) + ((1 - t) * whiteSubstrate.L);
  const a = (t * aAccum) + ((1 - t) * whiteSubstrate.a);
  const b = (t * bAccum) + ((1 - t) * whiteSubstrate.b);

  return { L, a, b };
}

/* ==========================================
   Find Closest PMS (ΔE00)
   ========================================== */
function findClosestPMS(targetLAB) {
  let closest = null, minDeltaE = Infinity;
  for (const p of pmsData) {
    const L = parseFloat(p.L), a = parseFloat(p.a), b = parseFloat(p.b);
    if (!Number.isFinite(L) || !Number.isFinite(a) || !Number.isFinite(b)) continue;
    const dE = deltaE00(targetLAB, { L, a, b });
    if (dE < minDeltaE) { minDeltaE = dE; closest = p; }
  }
  return { closest, minDeltaE };
}

/* ==========================================
   Optimiser (Monte-Carlo) now using Pseudo-KS mixer
   ========================================== */
function optimiseFormulaKS(target, chosenBases, maxIter = 8000, pigmentTotalPct = 85) {
  // start with equal weights over chosen pigments
  let weights = chosenBases.map(() => 1 / chosenBases.length);
  let bestWeights = [...weights];
  let bestPred = predictMixLAB_PseudoKS(chosenBases, weights, pigmentTotalPct);
  let bestDE = deltaE00(target, bestPred);

  const step = 0.03;

  for (let i = 0; i < maxIter; i++) {
    const newW = weights.map((w) => Math.max(0, w + (Math.random() - 0.5) * step));
    const total = newW.reduce((a, b) => a + b, 0) || 1;
    const normalised = newW.map((v) => v / total);

    const pred = predictMixLAB_PseudoKS(chosenBases, normalised, pigmentTotalPct);
    const dE = deltaE00(target, pred);
    if (Number.isFinite(dE) && dE < bestDE) {
      bestDE = dE;
      bestWeights = [...normalised];
      weights = [...normalised];
      bestPred = pred;
      if (dE < 1.0) break;
    }
  }
  return { bestWeights, bestDE: bestDE, predicted: bestPred };
}

/* ==========================================
   Candidate pool from DC data
   ========================================== */
const dcAll = [];
for (const [baseInk, rows] of dcByBase.entries()) {
  // pick the row closest to 100% conc for initial ranking display
  const mt = rows.reduce((best, r) => (!best || r.c > best.c ? r : best), null);
  if (mt) dcAll.push({ baseInk, conc: mt.c * 100, L: mt.L, a: mt.a, b: mt.b });
}

/* ==========================================
   Predict Using DC Ink System (Pseudo-KS)
   ========================================== */
function predictUsingDCSystem(targetLAB) {
  // rank bases by their best (mass-tone proxy) closeness
  const ranked = dcAll
    .map((p) => ({ ...p, dE: deltaE00(targetLAB, { L: p.L, a: p.a, b: p.b }) }))
    .sort((a, b) => a.dE - b.dE);

  // pool of unique bases
  const pool = [];
  const seen = new Set();
  for (const c of ranked) {
    if (pool.length >= 40) break;
    if (seen.has(c.baseInk)) continue;
    if (!baseModels.get(c.baseInk)) continue; // skip if no fit
    pool.push(c);
    seen.add(c.baseInk);
  }

  let best = { deltaE: Infinity };

  for (let count = 2; count <= 10; count++) {
    // choose top-N unique bases
    const chosen = pool.slice(0, count);

    // try several overall pigment totals (tint levels)
    const pigmentTotals = [70, 75, 80, 85, 90, 95];

    for (const pt of pigmentTotals) {
      const { bestWeights, bestDE, predicted } = optimiseFormulaKS(targetLAB, chosen, 6000, pt);

      if (bestDE < (best.deltaE ?? Infinity)) {
        best = { deltaE: bestDE, total: pt, weights: bestWeights, predicted, selected: chosen };
      }
      if (bestDE <= 1.0) break;
    }
    if (best.deltaE <= 1.0) break;
  }

  // If nothing viable, return substrate
  if (!best.selected) {
    return {
      formula: [{ code: "DC21-002 Extender", Percentage: 100 }],
      predicted: whiteSubstrate,
      nearestPantone: "Predicted via DC Ink System (Pseudo-KS)",
      deltaE: deltaE00(targetLAB, whiteSubstrate),
      source: "DC Ink System",
    };
  }

  // Convert resulting pseudo-KS weights to 100% concentrate formula
  const pigmentTotal = best.total ?? 85;
  let extenderTotal = 100 - pigmentTotal;
  const merged = new Map();

  best.selected.forEach((p, i) => {
    const base = p.baseInk;
    const pureSharePct = best.weights[i] * pigmentTotal;
    const purePigment = pureSharePct;
    merged.set(base, +((merged.get(base) || 0) + purePigment).toFixed(4));
  });

  // Build formula with ink names
  const formula = Array.from(merged.entries())
    .map(([code, pct]) => {
      const match = dcDataRaw.find(
        (r) => String(r.Ink || "").trim().toUpperCase() === code.toUpperCase()
      );
      const name = match && match.Name ? match.Name.trim() : "";
      const codeDisplay = name ? `${code} ${name}` : code;
      return { code: codeDisplay, name, Percentage: +pct.toFixed(2) };
    })
    .filter((x) => x.Percentage >= 0.25);

  // Add extender (always show with name)
  formula.push({
    code: "DC21-002 Extender",
    name: "Extender",
    Percentage: +extenderTotal.toFixed(2),
  });

  return {
    formula,
    predicted: best.predicted,
    nearestPantone: "Predicted via DC Ink System (Pseudo-KS)",
    deltaE: best.deltaE,
    source: "DC Ink System",
  };
}


/* ==========================================
   Main export with PMS shortcut
   ========================================== */
export async function predictFormula(targetLAB) {
  if (!targetLAB) return null;

  const { closest, minDeltaE } = findClosestPMS(targetLAB);
  if (closest && minDeltaE <= 2) {
    const formula = [];
    for (let i = 1; i <= 4; i++) {
      const code =
        closest[`Item Code ${i}`] ||
        closest[`Item Code ${i} `] ||
        closest[`ItemCode${i}`];
      const pct = parseFloat(
        closest[`Percentage ${i}`] ||
          closest[`Percentage ${i} `] ||
          closest[`Percent ${i}`]
      );
      if (code && Number.isFinite(pct)) formula.push({ code, Percentage: pct });
    }
    return {
      formula,
      predicted: { L: +closest.L, a: +closest.a, b: +closest.b },
      nearestPantone: closest.Pantone || "Unknown",
      deltaE: minDeltaE,
      source: "PMS Database (ΔE00)",
    };
  }

  return predictUsingDCSystem(targetLAB);
}

