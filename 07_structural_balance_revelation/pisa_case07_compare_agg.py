import csv, argparse
from collections import defaultdict

def to_float(x):
    try:
        return float(x)
    except:
        return None

def read_csv(path):
    with open(path, "r", newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        rows = [row for row in r]
    return rows

def key_of_agg(row):
    # For case07_grid_agg.csv, grouping is by: mode, alpha, k, theta
    return (
        row.get("mode",""),
        row.get("alpha",""),
        row.get("k",""),
        row.get("theta",""),
    )

def key_of_results(row):
    # For case07_grid_results.csv (non-aggregated), these exist:
    # pass, mode, alpha, k, theta
    return (
        row.get("pass",""),
        row.get("mode",""),
        row.get("alpha",""),
        row.get("k",""),
        row.get("theta",""),
    )

def is_agg(rows):
    if not rows:
        return False
    # Agg CSV contains columns like "scale_max_abs_mean" etc.
    return ("scale_max_abs_mean" in rows[0]) or ("denom_min_abs_mean" in rows[0])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--a", required=True, help="First CSV (baseline) - agg or results")
    ap.add_argument("--b", required=True, help="Second CSV (rerun) - agg or results")
    args = ap.parse_args()

    A = read_csv(args.a)
    B = read_csv(args.b)

    print(f"Rows A: {len(A)} Rows B: {len(B)}")
    if not A or not B:
        print("One or both inputs are empty.")
        return

    A_is_agg = is_agg(A)
    B_is_agg = is_agg(B)

    if A_is_agg != B_is_agg:
        print("Mismatch: one file looks aggregated, the other looks non-aggregated.")
        print("Please compare agg-vs-agg OR results-vs-results.")
        return

    key_fn = key_of_agg if A_is_agg else key_of_results

    mapA = {key_fn(r): r for r in A}
    mapB = {key_fn(r): r for r in B}

    keys = sorted(set(mapA.keys()) & set(mapB.keys()))
    if not keys:
        print("No matching keys between A and B. Check CSV column names.")
        print("Example A columns:", list(A[0].keys()))
        print("Example B columns:", list(B[0].keys()))
        return

    # Metrics we expect in agg
    metrics_agg = [
        "scale_max_abs_mean",
        "denom_min_abs_mean",
        "a_avg_mean",
        "s_avg_mean",
    ]

    # Metrics we expect in results
    metrics_results = [
        "scale_max_abs",
        "denom_min_abs",
        "a_avg",
        "s_avg",
    ]

    metrics = metrics_agg if A_is_agg else metrics_results

    diffs = defaultdict(list)
    missing = defaultdict(int)

    for k in keys:
        ra = mapA[k]
        rb = mapB[k]
        for m in metrics:
            va = to_float(ra.get(m))
            vb = to_float(rb.get(m))
            if va is None or vb is None:
                missing[m] += 1
                continue
            diffs[m].append(abs(va - vb))

    print("\nMean absolute differences across matched rows:\n")
    for m in metrics:
        arr = diffs.get(m, [])
        if not arr:
            print(f"{m:24s}: n/a (missing in {missing[m]} rows)")
        else:
            mean = sum(arr) / len(arr)
            print(f"{m:24s}: {mean:.6f}  (n={len(arr)})")

if __name__ == "__main__":
    main()
