# Case 04 — Hyper-Rotation Geometry  
**Observation Notes**

This file records a **verified observational snapshot**
and the **minimal console checks** used to validate
the **SSUM structural overlay** for this case.

---

## **Repro Snapshot**

**params:**
  theta = 1.5871396928204535  
  alpha = 0.55  
  k     = 2.2  

**expected sizes:**
  verts4: 8 rows, each length 4  
  verts3: 8 rows, each length 3  
  struct: 8 rows, each with keys: **a,s,w,denom,scale,health**

**observational stats:**
  w_min          = -0.8998798051495587  
  w_max          =  0.8998798051495587  
  w_abs_max      =  0.8998798051495587  
  denom_abs_min  =  0.5050661071677427  
  scale_abs_max  =  1.9799388353490917  
  a_avg          =  0.6311191381528546  
  s_avg          =  0.9424439116348731  

**sample vertex:**
  w      = -0.8998798051495587  
  denom  =  0.5050661071677427  
  scale  =  1.9799388353490917  
  a      =  0.6311191381528547  
  s      =  0.9424439116348730  
  health =  0.6689259001984561  

---

## **Console Proof (paste into browser console)**

window.__verts4_rotated && window.__verts4_rotated.length  
window.__verts4_rotated[0] && window.__verts4_rotated[0].length  
window.__struct && window.__struct.length  
window.__struct[0]  
window.__struct && window.__struct.map(function (x) { return x.scale; })

**Expected:**
- **8 vertices**
- **4D coordinates** per vertex
- **8 structural records**
- per-vertex fields: **a, s, w, denom, scale, health**
- **array of 8 scale values**

---

## **Observational invariants**

```
scale = 1 / (1 + alpha*w)  
phi((m,a,s)) = m
```
