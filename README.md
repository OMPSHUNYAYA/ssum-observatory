# SSUM Observatory

**Structured Numbers • Classical Correctness • Universal Behavioural Insight**

![License](https://img.shields.io/badge/license-Open%20Standard-brightgreen)

The SSUM Observatory contains a growing collection of **self-contained,
browser-only observatories** that demonstrate how  
**Shunyaya Structural Universal Mathematics (SSUM)** reveals structural
behaviour in classical numerical methods — **without altering any
classical results**.

Each observatory is designed to be:
- deterministic
- dependency-free
- reproducible
- readable by inspection
- executable in any modern browser

No build tools. No servers. No installation.

---

## **How to Read These Observatories**

Each case in this repository is **not a visualization of results**, but an **observability instrument**.

Classical outputs remain **exact, correct, and unchanged** at all times.  
The purpose of each observatory is to reveal **how structure, stability, and stress evolve during computation or transformation**, even when classical results appear normal.

If a case appears *simple* or *visual*, this is intentional.  
The depth lies in the **deterministic invariants, bounded structural signals, and reproducible behaviour**, not in visual complexity.

Each case folder may include brief **observation notes** explaining **what to look for**, **why it matters**, and **which structural properties are being revealed**.

---

## ▶ Live Browser Observatories (GitHub Pages)

Each case below is directly executable in the browser via GitHub Pages.
No installation. No build. No dependencies.

- **01 — Newton Root Finding (Baseline)**  
  https://ompshunyaya.github.io/ssum-observatory/01_newton_root/

- **02 — Newton Near-Singular Derivative**  
  https://ompshunyaya.github.io/ssum-observatory/02_newton_near_singular/

- **03 — Newton Multiple Root**  
  https://ompshunyaya.github.io/ssum-observatory/03_newton_multiple_root/

- **04 — Hyper-Rotation Geometry (3D ↔ 4D)**  
  https://ompshunyaya.github.io/ssum-observatory/04_hyper_rotation_geometry/

- **05 — Structural Attention (Deterministic, No Training)**  
  https://ompshunyaya.github.io/ssum-observatory/05_structural_attention/

- **06 — Structural Stress Revelation (Geometry-First, No Simulation)**  
  https://ompshunyaya.github.io/ssum-observatory/06_structural_stress_revelation/

- **07 — Structural Balance Revelation (Real-World Monument Geometry — Leaning Tower of Pisa)**  
  https://ompshunyaya.github.io/ssum-observatory/07_structural_balance_revelation/

- **08 — Finite Structural Area Experiment (Squaring the Circle)**  
  https://ompshunyaya.github.io/ssum-observatory/08_finite_structural_area_experiment/

---

## What the Observatory Shows

Classical mathematics answers **what** the result is.

SSUM reveals **how the result structurally evolves** during computation,
while always preserving exact classical correctness.

SSUM enables geometric transformations to be observed
by their structural behaviour,
not just by their final outcomes.

At every step, the core SSUM guarantee holds:

`phi((m, a, s)) = m`

Structural channels are **observational only**.
If ignored, all computations behave exactly like classical mathematics.

---

## Structure

Each case lives in its own folder and is fully standalone.

Open the case artifacts directly (browser or script-based, depending on the case).

```
ssum-observatory/
├── 01_newton_root/
│   ├── index.html
│   ├── case.js
│   └── ssum_core.js
│
├── 02_newton_near_singular/
│   ├── index.html
│   ├── case.js
│   └── ssum_core.js
│
├── 03_newton_multiple_root/
│   ├── index.html
│   ├── case.js
│   └── ssum_core.js
│
├── 04_hyper_rotation_geometry/
│   ├── index.html
│   ├── geometry.js
│   ├── render.js
│   └── OBSERVATION_NOTES.md
│
├── 05_structural_attention/
│   └── Structural_Attention_ssum_observatory_05.html
│
├── 06_structural_stress_revelation/
│   ├── index.html
│   ├── geometry.js
│   ├── render.js
│   └── OBSERVATION_NOTES.md
│
├── 07_structural_balance_revelation/
│   ├── pisa_case07_test.py
│   ├── pisa_case07_grid.py
│   ├── pisa_case07_compare_agg.py
│   ├── pisa_case07_stats.json
│   └── OBSERVATION_NOTES.md
│
├── 08_finite_structural_area_experiment/
│   ├── index.html
│   ├── observatory.js
│   ├── axis_packing.csv
│   ├── rotated_packing.csv
│   ├── QUICKSTART.md
│   └── OBSERVATION_NOTES.md

```

---

## Current Cases

### 01 — Newton Root Finding (Baseline)
Demonstrates classical Newton convergence with healthy structural behaviour.

### 02 — Newton Near-Singular Derivative
Shows how SSUM detects instability and stress when derivatives approach zero,
even when classical convergence still succeeds.

### 03 — Newton Multiple Root
Reveals silent convergence degradation for multiple roots —
a known numerical pathology invisible to classical results alone.

### 04 — Hyper-Rotation Geometry (3D ↔ 4D)

Demonstrates how **hidden dimensions introduce structural behaviour**
during geometric transformation, while preserving exact classical geometry.

A 3D cube is lifted to 4D, rotated in the x–w plane, and projected back to 3D.
SSUM structural channels observe dimensional drift and edge amplification
without altering any classical coordinates.

Key observational invariant:
`scale = 1 / (1 + alpha*w)`

### 05 — Structural Attention (Deterministic, No Training)

Demonstrates **attention as a structural compatibility law**, not a learned heuristic.

Each token is represented as a structured triple `(m, a, s)`, and attention scores
are computed deterministically using explicit, inspectable lane interactions.

Key properties:
- no training
- no gradients
- no probability
- no hidden state
- fully explainable score decomposition
- explicit safety gates
- closed under structural composition

Structural Attention preserves classical correctness at all times via:

`phi((m, a, s)) = m`

This case establishes attention as a **first-class structural operator**
suitable for deterministic selection, auditability, and structural field networks.

### 06 — Structural Stress Revelation (Mechanical Geometry)

Demonstrates **geometry-first structural stress observability**
without material models, solvers, learning, or simulation.

A 3D geometry is lifted into a latent structural dimension,
subjected to controlled structural excitation,
and projected back to 3D to reveal **hidden stress concentration,
instability, and amplification patterns**.

This case exposes **where geometry is structurally vulnerable**
before any physical deformation occurs.

Key properties:
- no material assumptions
- no finite element analysis
- no numerical solvers
- no training or data
- deterministic and reproducible
- exact classical geometry preserved

Structural amplification emerges through a controlled projection law:

`scale = 1 / (1 + alpha*w)`

Structural channels observe latent stress behaviour
while always preserving classical correctness via:

`phi((m, a, s)) = m`

This case establishes **latent structural observability**
as a first-class SSUM capability,
bridging geometry, mechanics, and explainable design diagnostics.

This case extends the geometric lifting and projection principles
introduced in Case 04 from dimensional exploration into
mechanical stress observability.

---

### 07 — Structural Balance Revelation (Leaning Tower of Pisa)

Demonstrates that **structural balance is a geometric property before it is an engineering outcome**.

A real terrestrial LiDAR scan of the Leaning Tower of Pisa is examined using
**deterministic, geometry-first SSUM probes** to test whether visible asymmetry
corresponds to latent structural instability.

Despite its pronounced tilt, the geometry exhibits:
- bounded projective scaling
- stable denominators under excitation
- seed-invariant structural observables
- no divergence or amplification collapse

This case shows that **visible tilt does not imply geometric imbalance**.

Key properties:
- real-world data (LiDAR point cloud)
- no material assumptions
- no FEM / FEA
- no solvers or simulation
- no training or optimization
- deterministic and reproducible
- classical geometry preserved exactly

Structural balance is observed through a controlled projection law:

`scale = 1 / (1 + alpha*w)`

Structural channels remain **purely observational**, preserving classical correctness at all times via:

`phi((m, a, s)) = m`

This case establishes **geometry-first structural balance observability**
and serves as a real-world validation of SSUM beyond synthetic or idealized models.

A detailed narrative study and full PDF for this case are provided
in a **separate dedicated repository**, linked from this observatory.

**Data Source Note (Case 07)**  
This case uses an external, publicly available terrestrial LiDAR dataset of the Piazza del Duomo in Pisa.
Due to dataset size and external licensing terms, the raw data is not redistributed in this repository.
Full dataset citation, license information, and acknowledgments are provided in the dedicated Case-07 study repository.

---

### 08 — Finite Structural Area Experiment (Squaring the Circle)

Demonstrates **finite, exact, and fully certified square packing inside a circle**
using strict geometric containment rules.

Unlike heuristic or asymptotic packing approaches, this case evaluates
**explicit square lattices** under a **corner-exact analytic invariant**:

`x_corner^2 + y_corner^2 <= R^2`

Key properties:
- finite enumeration (no infinite limits)
- strict 4-corner containment
- deterministic certification (PASS / FAIL)
- no approximation or tolerance relaxation
- translation fairness enforced
- rotation treated as a bounded structural parameter

Both axis-aligned and rotated lattice families are evaluated
under identical certification rules.
Improvements occur only at discrete geometric plateaus,
revealing **structural alignment effects rather than smooth optimization**.

This case reframes “squaring the circle” as a **finite structural geometry problem**,
fully verifiable in the browser and reproducible by inspection.

---

## What Makes This Different

- Classical values **never change**
- Structural insight is **deterministic and bounded**
- No probability, no statistics, no heuristics
- No forecasting, inference, or prediction
- Structural signals may be used by downstream systems,
  but SSUM itself is purely observational

SSUM provides **structural observability**, not control.

---

### **Clarification: SSUM, Structural Signals, and Forecasting**

Classical arithmetic treats numbers as **memoryless magnitudes**.  
Forecasting tools build **models and expectations** to estimate what may happen next.

SSUM operates at a different layer.

SSUM itself is **not a forecasting engine** and does **not perform probabilistic inference**.

SSUM **never replaces numbers**, **never estimates outcomes**, and **never alters classical results**.  
It exposes a **deterministic structural layer** that measures stability, coherence, and accumulated stress alongside each value — while always collapsing exactly to the original magnitude:

```
phi((m, a, s)) = m
```

---

## Intended Use

The Observatory is provided for:

- mathematical exploration
- numerical analysis insight
- education and review
- algorithm behaviour diagnostics
- research and discussion

It is **not** a production numerical library
and **not** intended for safety-critical or regulated use.

---

## Relationship to SSUM

This repository demonstrates SSUM in action.

The full SSUM specification, proofs, demos, and documentation live in the
main repository:

**Shunyaya Structural Universal Mathematics (SSUM)**  
https://github.com/OMPSHUNYAYA/Structural-Mathematics

The Observatory should be read as **evidence and illustration**,
not as a replacement for the formal SSUM documentation.

---

## Core Principle (Non-Negotiable)

Any implementation claiming SSUM compatibility must preserve:

`phi((m, a, s)) = m`

If classical magnitudes change, the implementation is **not SSUM**.

---

## 📄 License / Usage

**Open Standard**

Shunyaya Structural Universal Mathematics (SSUM) is provided *as-is*, without any warranty, express or implied, including suitability or fitness for any purpose.

You may use, study, modify, extend, integrate, and redistribute SSUM concepts and implementations freely in accordance with this open standard.

This release is intended for research, mathematical exploration, educational use, and structural experimentation.  
It is **not** intended for financial decision-making, operational control, medical systems, or safety-critical or regulated environments.

Independent verification and domain-specific validation are required before any real-world deployment.

Optional attribution (recommended but not mandatory):  
"Implements concepts from Shunyaya Structural Universal Mathematics (SSUM)."

---

## Conformance & Compatibility Notice

Implementations claiming compatibility with Shunyaya Structural Universal Mathematics (SSUM) must preserve the core mathematical guarantee:

```
phi((m, a, s)) = m
```

This ensures:
- classical magnitudes remain exact and unchanged
- structural channels are observational only
- no approximation, bias, or numerical drift is introduced

Implementations that alter classical results, violate boundedness, or introduce hidden logic must not be represented as SSUM-compatible.

---

## Topics

SSUM, Structural Mathematics, Structured Arithmetic, Deterministic Mathematics, Bounded Arithmetic, Classical Compatible Math, Numerical Stability, Structural Numbers, Behavioural Mathematics, Behaviour-Aware Computing, Structural Geometry, Stress Observability, Explainable Geometry, Open Standard Mathematics, Shunyaya


