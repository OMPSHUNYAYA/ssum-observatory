# **Case 08 — Finite Structural Area Experiment (FSAE)**

## **Observation Notes**

This file records a verified observational snapshot for  
**Case 08 — Finite Structural Area Experiment (Squaring the Circle)**.

This case is **certification-first**, **geometry-only**, and **deterministic**.
No optimization, learning, or approximation is performed.

---

## **Certified Reference Snapshot**

**Execution context (browser-based verification):**
- **Circle radius:** `R = 10`
- **Square side length:** `s = 1`
- **Datasets:** `axis_packing.csv`, `rotated_packing.csv`
- **Certification rule:** strict 4-corner containment
- **apply_theta:** `0` (datasets already in world coordinates)

---

## **Observed Certified Results**

For both datasets under their intended parameters:

- `N_total = 279`
- `N_inside = 279`
- `N_outside = 0`
- `bad_corners = 0`
- `worst_margin < 0`
- `R_min_needed < R`
- **Result:** `PASS`

Area utilization (descriptive only):

`U = (N * s^2) / (pi * R^2) = 0.888085`

---

## **Determinism Check**

Repeated verification runs with identical inputs produced:
- identical counts
- identical margins
- identical PASS status

This confirms **full determinism** of the certification logic.

---

## **Certification Scope (Important)**

The `PASS / FAIL` result applies **only** to the exact parameter tuple:

`(R, s, theta, dx, dy)`

If any of the following are changed:
- `R`
- `s`
- `theta`
- rotation toggle behavior

then the same square centers are **no longer certified** for that geometry.

In such cases, `FAIL` is **expected** and correct.

---

## **Structural Observations**

- Certified square counts change **only at discrete geometric alignments**
- Many nearby translations or rotations yield identical certified counts
- Improvements occur as **structural plateaus**, not smooth curves
- Translation effects are bounded and periodic
- Rotation acts as a structural parameter, not an optimizer

This confirms that the problem exhibits **finite structural geometry**, not continuous optimization behavior.

---

## **Verification Status**

- ✔ Certification rule enforced exactly
- ✔ 4-corner containment verified
- ✔ Determinism confirmed
- ✔ No approximation or tolerance relaxation
- ✔ Browser output is authoritative
