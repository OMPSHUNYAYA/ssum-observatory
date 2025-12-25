import time
import json
import numpy as np
import pye57

# -------------------------------
# CONFIG (single-run sanity test)
# -------------------------------
E57_FILE = "Italy_Pisa.e57"
POINTS = 500_000
SEED = 7
ALPHA = 0.65
K = 2.2
THETA = np.pi / 6  # single fixed structural excitation

np.random.seed(SEED)

t0 = time.time()

# -------------------------------
# LOAD E57 (geometry only)
# -------------------------------
e57 = pye57.E57(E57_FILE)

data = e57.read_scan(
    0,
    intensity=False,
    colors=False,
    row_column=False
)

X = np.vstack((data["cartesianX"],
               data["cartesianY"],
               data["cartesianZ"])).T

# -------------------------------
# SAMPLE POINTS (deterministic via SEED)
# -------------------------------
idx = np.random.choice(len(X), POINTS, replace=False)
P = X[idx]

# -------------------------------
# NORMALIZE (center + scale)
# -------------------------------
center = P.mean(axis=0)
scale0 = np.linalg.norm(P - center, axis=1).max()
if scale0 <= 0:
    scale0 = 1.0
Pn = (P - center) / scale0

# -------------------------------
# SSUM LIFT + ROTATION (x–w)
# w starts at 0; in xw mode:
#   w' = x*sin(theta)
#   x' = x*cos(theta)
# -------------------------------
x = Pn[:, 0]
w2 = np.sin(THETA) * x

denom = 1.0 + ALPHA * w2

# denom safety (avoid near-zero blowups)
eps = 1e-9
denom = np.where(np.abs(denom) < eps, np.sign(denom) * eps, denom)

scale_p = 1.0 / denom

# -------------------------------
# STRUCTURAL CHANNELS (CANONICAL)
# Observation-only: channels do not alter geometry.
#
# health = 1/(1+|alpha*w'|)
# a_raw  = 2*health - 1          in [-1, +1]
# s_raw  = clip(|w'|, 0, 1)      in [0, 1]
# a      = tanh(k*a_raw)
# s      = tanh(k*(2*s_raw-1))
# -------------------------------
absaw = np.abs(ALPHA * w2)
health = 1.0 / (1.0 + absaw)
a_raw = 2.0 * health - 1.0
s_raw = np.clip(np.abs(w2), 0.0, 1.0)

a = np.tanh(K * a_raw)
s = np.tanh(K * (2.0 * s_raw - 1.0))

# -------------------------------
# STATS
# -------------------------------
stats = {
    "points_used": int(POINTS),
    "minW": float(w2.min()),
    "maxW": float(w2.max()),
    "maxAbsW": float(np.abs(w2).max()),
    "denom_min_abs": float(np.abs(denom).min()),
    "scale_max_abs": float(np.abs(scale_p).max()),
    "a_avg": float(a.mean()),
    "s_avg": float(s.mean()),
    "elapsed_sec": round(time.time() - t0, 2),
    "note": (
        "Observation-only demo. Structural channels are informational and do not alter classical geometry. "
        "Not for critical decision-making or safety-critical use. Shunyaya Structural Universal Mathematics (SSUM)."
    ),
    "canonical_channels": {
        "health": "1/(1+|alpha*w'|)",
        "a_raw": "2*health-1",
        "s_raw": "clip(|w'|,0,1)",
        "a": "tanh(k*a_raw)",
        "s": "tanh(k*(2*s_raw-1))"
    }
}

# -------------------------------
# WRITE OUTPUT
# -------------------------------
with open("pisa_case07_stats.json", "w", encoding="utf-8") as f:
    json.dump(stats, f, indent=2)

print("DONE — Case 07 Sanity Test (Canonical Channels)")
print(json.dumps(stats, indent=2))
