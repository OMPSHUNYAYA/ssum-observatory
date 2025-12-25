# pisa_case07_grid.py
# SSUM Observatory — Case 07 (Leaning Tower of Pisa)
# Case-07 demonstrates latent geometric balance in real-world LiDAR geometry.
# Observation-only: structural channels are informational and do not alter classical geometry.
# Not for critical decision making or safety-critical use. Shunyaya Structural Universal Mathematics (SSUM).

import os, json, time, argparse, math
import numpy as np
import pandas as pd

def tanh(x):
    return np.tanh(x)

def sample_points_pye57(path, n_points, seed=0):
    """
    Deterministic subsampling of an E57 point cloud.
    Uses numpy Generator for reproducibility: same (seed, file, n_points) => same sample.
    """
    from pye57 import E57

    rng = np.random.default_rng(int(seed))
    e57 = E57(path)

    # Try a conservative read signature; fall back for older pye57 versions.
    try:
        data = e57.read_scan(0, intensity=False, colors=False, row_column=False)
    except TypeError:
        try:
            data = e57.read_scan(0, intensity=True, colors=False, row_column=False)
        except Exception:
            data = e57.read_scan(0, intensity=False, colors=False, row_column=False)

    x = np.asarray(data["cartesianX"], dtype=np.float64)
    y = np.asarray(data["cartesianY"], dtype=np.float64)
    z = np.asarray(data["cartesianZ"], dtype=np.float64)

    N = int(x.shape[0])
    if n_points >= N:
        idx = np.arange(N, dtype=np.int64)
    else:
        idx = rng.choice(N, size=int(n_points), replace=False)

    P = np.stack([x[idx], y[idx], z[idx]], axis=1)
    return P

def normalize_points(P):
    """
    Center + scale to stable range.
    Q = (P - center) / scale, where scale = max ||P - center||.
    """
    c = P.mean(axis=0)
    Q = P - c
    s = np.linalg.norm(Q, axis=1).max()
    if not np.isfinite(s) or s <= 0.0:
        s = 1.0
    Q = Q / s
    return Q, c, float(s)

def stress_seed(Q, mode):
    """
    Deterministic seeds for latent w' (observation-only).
    - xw: use x directly
    - fixed: proximity to x=max boundary plane
    - corner: proximity to a far corner (x=max, y=max, z~0)
    """
    x, y, z = Q[:, 0], Q[:, 1], Q[:, 2]

    if mode == "fixed":
        fx = np.max(x)
        d = np.abs(fx - x)
        seed = 1.0 / (1.0 + 2.0 * d)
        return np.clip(seed, 0.0, 1.0)

    if mode == "corner":
        cx, cy, cz = np.max(x), np.max(y), 0.0
        d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
        seed = 1.0 / (1.0 + 4.0 * d)
        return np.clip(seed, 0.0, 1.0)

    return x

def safe_denom(denom, eps=1e-9):
    """
    Avoid division blow-ups if denom approaches 0.
    If |denom| < eps, replace with sign(denom)*eps, treating 0 as +eps.
    """
    denom = np.asarray(denom, dtype=np.float64)
    sgn = np.where(denom >= 0.0, 1.0, -1.0)  # denom==0 => +1
    return np.where(np.abs(denom) < eps, sgn * eps, denom)

def project_and_channels(Q, theta, alpha, k, mode):
    """
    Core probe:
    - Latent 4D excitation in (x,w) with w starting at 0
    - Projective scale: scale = 1 / (1 + alpha*w')
    - Observation-only SSUM channels:
      a_raw = 2*(1/(1+|alpha*w'|)) - 1
      s_raw = clip(|w'|, 0, 1)
      a = tanh(k*a_raw)
      s = tanh(k*(2*s_raw - 1))
    """
    x, y, z = Q[:, 0], Q[:, 1], Q[:, 2]

    if mode == "xw":
        # w' = x*sin(theta), x' = x*cos(theta) with w=0 initially
        w = x * math.sin(theta)
        x_p = x * math.cos(theta)
        y_p = y
        z_p = z
    else:
        seed = stress_seed(Q, mode)
        w = seed * math.sin(theta)
        x_p, y_p, z_p = x, y, z

    denom = safe_denom(1.0 + alpha * w, eps=1e-9)
    scale = 1.0 / denom

    # Observation-only channels (geometry is not altered by these channels)
    absaw = np.abs(alpha * w)
    health = 1.0 / (1.0 + absaw)
    a_raw = 2.0 * health - 1.0
    s_raw = np.clip(np.abs(w), 0.0, 1.0)

    a = tanh(k * a_raw)
    s = tanh(k * (2.0 * s_raw - 1.0))

    stats = {
        "w_min": float(np.min(w)),
        "w_max": float(np.max(w)),
        "w_max_abs": float(np.max(np.abs(w))),
        "denom_min_abs": float(np.min(np.abs(denom))),
        "scale_max_abs": float(np.max(np.abs(scale))),
        "a_avg": float(np.mean(a)),
        "s_avg": float(np.mean(s)),
    }
    return stats

def build_thetas(theta_steps, theta_min, theta_max):
    if theta_steps <= 0:
        raise ValueError("theta_steps must be > 0")
    if theta_max <= theta_min:
        raise ValueError("theta_max must be > theta_min")
    return np.linspace(theta_min, theta_max, int(theta_steps), endpoint=False, dtype=np.float64)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True, help="Path to E57 file")
    ap.add_argument("--outdir", default="case07_out")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--points", type=int, default=2000000)
    ap.add_argument("--passes", type=int, default=3)
    ap.add_argument("--modes", nargs="+", default=["xw", "fixed", "corner"])
    ap.add_argument("--alpha", nargs="+", type=float, default=[0.65])
    ap.add_argument("--k", nargs="+", type=float, default=[2.2])
    ap.add_argument("--theta_steps", type=int, default=64)
    ap.add_argument("--theta_min", type=float, default=0.0)
    ap.add_argument("--theta_max", type=float, default=2.0 * math.pi)
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    t0 = time.time()

    thetas = build_thetas(args.theta_steps, args.theta_min, args.theta_max)

    all_rows = []
    norm_meta = []

    # Deterministic repeated passes (different subsamples) to check stability of stats
    for p in range(int(args.passes)):
        P = sample_points_pye57(args.inp, int(args.points), seed=int(args.seed) + p)
        Q, c, s = normalize_points(P)
        norm_meta.append({"pass": p, "center": c.tolist(), "scale": float(s)})

        for mode in args.modes:
            for alpha in args.alpha:
                for k in args.k:
                    for th in thetas:
                        st = project_and_channels(Q, float(th), float(alpha), float(k), mode)
                        row = {
                            "pass": p,
                            "mode": str(mode),
                            "alpha": float(alpha),
                            "k": float(k),
                            "theta": float(th),
                            **st,
                        }
                        all_rows.append(row)

    df = pd.DataFrame(all_rows)
    csv_path = os.path.join(args.outdir, "case07_grid_results.csv")
    df.to_csv(csv_path, index=False)

    # Aggregate summary: mean+std over passes per (mode,alpha,k,theta)
    g = df.groupby(["mode", "alpha", "k", "theta"], as_index=False).agg({
        "w_max_abs": ["mean", "std"],
        "denom_min_abs": ["mean", "std"],
        "scale_max_abs": ["mean", "std"],
        "a_avg": ["mean", "std"],
        "s_avg": ["mean", "std"],
    })
    g.columns = ["_".join([c for c in col if c]) for col in g.columns.values]
    agg_path = os.path.join(args.outdir, "case07_grid_agg.csv")
    g.to_csv(agg_path, index=False)

    meta = {
        "input": args.inp,
        "points_used_per_pass": int(args.points),
        "passes": int(args.passes),
        "modes": list(args.modes),
        "alpha": [float(x) for x in args.alpha],
        "k": [float(x) for x in args.k],
        "theta_steps": int(args.theta_steps),
        "theta_min": float(args.theta_min),
        "theta_max": float(args.theta_max),
        "normalization_per_pass": norm_meta,
        "elapsed_sec": round(time.time() - t0, 3),
        "note": (
            "Observation-only. Structural channels are informational and do not alter classical geometry. "
            "Not for critical decision-making or safety-critical use. SSUM."
        ),
    }
    meta_path = os.path.join(args.outdir, "case07_run_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print("DONE")
    print("Wrote:", csv_path)
    print("Wrote:", agg_path)
    print("Wrote:", meta_path)
    print("Elapsed sec:", round(time.time() - t0, 2))

if __name__ == "__main__":
    main()
