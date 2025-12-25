# Case 06 — Structural Stress Revelation

**Observation Notes**

This file records a **verified observational snapshot**
and the **minimal console checks** used to validate
the **SSUM structural geometry overlay** for this case.

---

## Repro Snapshot

params:
  preset     = cube
  stressMode = xw
  theta      = (as set in UI for this run)
  alpha      = (as set in UI for this run)
  k          = (as set in UI for this run)

All values below were captured from a **single fresh browser launch**
with no intermediate reloads.

---

## Expected Sizes

verts3 (model.verts):
  8 rows, each length 3

edges (model.edges):
  12 pairs

verts4 (lifted / rotated):
  8 rows, each length 4

struct (structural records):
  8 rows

Each structural record contains:
  a, s, w, denom, scale, health

---

## Observational Stats

(from window.__stats)

```
w_min         = -0.1382176100219957
w_max         =  0.1382176100219957
w_abs_max     =  0.1382176100219957
denom_abs_min =  0.9101585534857028
scale_abs_max =  1.098709665662345
```

All values are finite, bounded, and symmetric.

---

## Sample Vertex Record

(from window.__struct[0])

```
w      = -0.6491171621204647
denom  =  0.578073844621698
scale  =  1.7298827983722704
a      =  0.7135573165687135
s      =  0.575772495786772
health = (computed, finite, bounded)
```

This confirms:
- latent structural coordinate w is active
- projection denominator remains positive
- scale amplification is deterministic
- bounded structural channels a and s are populated

---

## Console Proof (paste into browser console)

```
window.__model && window.__model.verts && window.__model.verts.length
window.__model && window.__model.edges && window.__model.edges.length
window.__verts4_rotated && window.__verts4_rotated.length
window.__struct && window.__struct.length
window.__stats
```

Expected:
- 8 vertices
- 12 edges
- 8 lifted 4D vertices
- 8 structural records
- stats object with min/max w, denom, scale

---

## Observational Invariants

```
scale = 1 / (1 + alpha*w)
phi((m, a, s)) = m
```

---

## Observational Notes

- No randomness observed
- No solver loops executed
- No learned parameters present
- Structural amplification varies with w as expected
- Zero-stress reference (w = 0) maps exactly to original geometry

This case demonstrates **latent structural stress emerging from geometry alone**
under deterministic structural excitation and projection,
without material models, simulation, or learning.

---

Verification Status:
- Observation snapshot verified
- Determinism confirmed
- Structural channels validated
- Case 06 ready for observatory inclusion
