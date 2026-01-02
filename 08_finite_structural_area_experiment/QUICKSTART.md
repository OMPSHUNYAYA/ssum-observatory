# ⭐ Finite Structural Area Experiment (FSAE) — Quickstart

**Deterministic • Exact Geometry • Certified Counts • Browser-Verifiable**

---

## **1. What You Need**

FSAE is intentionally minimal.

**Requirements**
- A modern web browser
- No Python required for review
- No external libraries
- No network access (except local hosting, optional)

Everything is:
- deterministic
- offline
- reproducible
- identical across machines

---

## **2. Minimal Project Layout**

A minimal FSAE release contains:

/FSAE  
  index.html  
  observatory.js  
  axis_packing.csv  
  rotated_packing.csv  

  README.md  
  QUICKSTART.md  

No build step.  
No compilation.  
No dependencies.

---

## **3. One-Minute Mental Model**

FSAE evaluates a simple but strict rule:

**A square is valid only if all four of its corners lie inside the circle.**

Formally, for every square corner:

`x_corner^2 + y_corner^2 <= R^2`

There are:
- no approximations
- no sampling
- no probabilistic acceptance
- no visual inference

Every reported square count is **explicitly certified**.

---

## **4. Running the Browser Experiment**

### **Step 1 — Start a Local Server (Recommended)**

From the FSAE folder:

`python -m http.server 8000`

Then open in your browser:

`http://127.0.0.1:8000/index.html`

Manual file loading also works without a server, but demo datasets require local hosting.

---

### **Step 2 — Load a Demo Dataset**

In the left panel:

- Select `axis_packing.csv`  
  or  
- Select `rotated_packing.csv`

Each dataset contains **pre-certified square centers**.

---

### **Step 3 — Apply Recommended Parameters**

Click:

**Use recommended**

This automatically sets:
- rotation angle `theta`
- circle radius `R`
- square side length `s`

These parameters correspond to **certified configurations**.

---

### **Step 4 — Verify Geometry**

Click:

**Verify geometry**

The system checks every square corner and reports:

- `N_total` — total centers in the dataset  
- `N_inside` — squares fully inside the circle  
- `bad_corners` — number of violations  
- `worst_margin` — largest corner distance beyond `R^2` (if any)  
- `R_min_needed` — minimum radius required to fit all squares  
- **PASS** or **FAIL**

A **PASS** means the configuration is certified under the displayed parameters.

---

## **5. Certification Scope (Important)**

**PASS / FAIL is a certification result, not an error indicator.**

PASS or FAIL always refers to the **currently loaded square centers** evaluated under the **currently displayed parameters**.

The included demo datasets are certified only for their default parameters:

- `R = 10`
- `s = 1`
- and the dataset’s intended rotation setting

If you change any of the following:
- `R` (circle radius)
- `s` (square side length)
- `theta` (rotation angle)
- rotation toggle behavior

then the same square centers are **no longer a certified packing** for that geometry.

In that situation, **FAIL is expected** and means:

**Not certified for the modified parameters.**

This behavior is correct and intentional.

---

## **6. Interpreting the Canvas**

The canvas shows:
- the circle boundary
- squares rendered from the loaded dataset

You may notice gaps near the circle boundary.  
This is expected and geometrically unavoidable when packing squares inside a curved boundary.

**Visual density is not the metric.**  
The certified square count `N` is.

If visuals and verification disagree, **trust the verification output**.

---

## **7. Changing Parameters (Exploration)**

You may adjust:
- `R` (circle radius)
- `s` (square side length)
- `theta` (rotation angle)

After any change:
- the displayed geometry updates
- **Verify geometry** recomputes certification

If `R` is reduced below the minimum fit:
- `N_inside` decreases
- the configuration fails explicitly

There are **no silent degradations**.

---

## **8. Manual CSV Testing (Optional)**

You may upload your own CSV of square centers.

**Requirements**
- Each row: `x,y`
- One square center per row
- No headers required

The same strict geometry rule applies:

`x_corner^2 + y_corner^2 <= R^2`

for all four corners of every square.

---

## **9. Determinism Guarantee**

For identical inputs:

`(R, s, theta, rotation_mode, centers.csv)`

FSAE guarantees:
- identical square counts
- identical PASS / FAIL outcomes
- identical rendering
- identical results across machines

There is **no randomness** and **no execution-order dependence**.

---

## **10. What This Quickstart Does Not Do**

This quickstart does **not**:
- search for optimal configurations
- approximate packing limits
- infer results visually
- extrapolate beyond tested cases

It evaluates only what is **explicitly defined and certified**.

---

## **11. One-Line Summary**

**FSAE lets you independently verify, in a browser, how many squares can be placed inside a circle under exact geometric constraints — with no approximation and no ambiguity.**
