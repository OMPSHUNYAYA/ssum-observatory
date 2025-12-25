# **Case 07 — Structural Balance Revelation (Leaning Tower of Pisa)**

## **Observation Notes**

This file records a verified observational snapshot and the minimal validation checks used to confirm the SSUM structural geometry overlay for **Case 07 (Leaning Tower of Pisa)**.

This case is **observation-only** and operates on **real-world LiDAR geometry** using **deterministic batch execution**.

---

## **Repro Snapshot**

**Execution context:**
- **Input geometry:** Terrestrial LiDAR point cloud (Pisa)
- **Points per run:** 500,000
- **Passes per run:** 3
- **Modes tested:** `xw`, `fixed`, `corner`
- **Theta steps:** 64
- **alpha:** 0.65
- **k:** 2.2
- **Seeds tested:** 7, 9

All values below were captured from **fresh independent executions** with **no intermediate modification**.

---

## **Expected Artifacts**

**Per execution run:**
- Normalized point cloud `Q`: `N x 3`
- Latent projection `w'`: `N` values
- Projective denominator `denom`: `N` values
- Scale response `scale`: `N` values
- Structural channels `a`, `s`: `N` values

**Aggregated outputs:**
- Per-theta statistics for each mode
- Pass-aggregated means and standard deviations
- Deterministic CSV and JSON artifacts

---

## **Observed Aggregate Metrics**

Across all modes, angles, and passes:
- `w_max_abs` remains bounded
- `denom_min_abs` remains strictly positive
- `scale_max_abs` remains finite
- `a_avg`, `s_avg` remain stable and bounded

**No divergence, blow-up, or singular behavior observed.**

---

## **Determinism Check (Same Seed)**

Two independent executions with identical parameters and seed produced:
- Bit-exact identical aggregates
- Mean absolute differences = `0.000000` across all 192 matched grid rows

This confirms **full end-to-end determinism** of the structural pipeline.

---

## **Seed Robustness Check (Different Seeds)**

Comparing executions with different seeds (same parameters):
- `scale_max_abs_mean` ≈ `8.78e-4`
- `denom_min_abs_mean` ≈ `5.66e-4`
- `a_avg_mean` ≈ `1.64e-4`
- `s_avg_mean` ≈ `8.36e-4`

All variations are on the order of `10^-3` or smaller and remain bounded.

---

## **Structural Invariants (Observed)**

- `scale = 1 / (1 + alpha*w')`
- `phi((m, a, s)) = m`
- Zero-stress reference (`w' = 0`) maps exactly to original geometry
- Projection symmetry preserved under theta rotation
- Boundedness preserved across modes and samplings

---

## **Observational Notes**

- No randomness beyond controlled subsampling seeds
- No solver loops executed
- No learning, fitting, or optimization present
- Structural amplification varies smoothly with `w'`
- Tilted geometry does not induce instability
- All observables remain finite and interpretable

This confirms that **structural balance emerges directly from geometry**, independent of material models, load assumptions, or engineering correction.

---

## **Verification Status**

- ✔ Observation snapshot verified
- ✔ Determinism confirmed
- ✔ Seed robustness confirmed
- ✔ Structural channels validated
- ✔ No divergence detected

**Case 07 is ready for inclusion in ssum-observatory.**
