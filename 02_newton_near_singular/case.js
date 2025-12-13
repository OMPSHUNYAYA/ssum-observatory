// observatory/02_newton_near_singular/case.js
(function () {
  "use strict";

  // ---- Local helpers (do NOT depend on SSUM core) ----
  function sign(x) { return (x > 0) ? 1 : (x < 0) ? -1 : 0; }
  function is_finite_number(v) { return typeof v === "number" && Number.isFinite(v); }

  // ---- Status / Guards (Newton01-grade) ----
  function status_el() { return document.getElementById("status"); }

  function set_status_ok(msg) {
    var el = status_el();
    if (!el) return;
    el.className = "status-ok";
    el.textContent = msg || "ok";
  }

  function set_status_warn(msg) {
    var el = status_el();
    if (!el) return;
    el.className = "status-warn";
    el.textContent = msg || "warn";
  }

  function set_status_bad(msg) {
    var el = status_el();
    if (!el) return;
    el.className = "status-bad";
    el.textContent = msg || "bad";
  }

  // ---- Title / subtitle ----
  var TITLE = "SSUM Observatory — 02 Newton Near-Singular Derivative";
  var SUBTITLE = "Structured Numbers • Classical Correctness • Universal Behavioural Insight";

  // ---- What this demonstrates ----
  var what = [
    "Classical layer: Newton’s method computes the usual iterate x_k and residual f(x_k).",
    "SSUM layer: we attach structure to each step as x_k = (m_k, a_k, s_k) without changing m_k.",
    "Guarantee: phi((m_k,a_k,s_k)) = m_k at every step.",
    "This page runs two initializations: one “stable” start and one “near-singular” start, so you can see how identical math can behave differently across iterations.",
    "Note: this case intentionally uses a simpler custom rapidity-space update (vs Case 01 core update) to highlight SSUM flexibility under near-singular steps."
  ];

  // ---- Function under test ----
  function f(x) { return x * x * x - 2 * x - 5; }
  function fp(x) { return 3 * x * x - 2; }

  // ---- Runs: stable start vs near-singular derivative start ----
  var runs = [
    { name: "stable",        x0: 2.0,  a0: +0.70 },
    { name: "near_singular", x0: 0.82, a0: +0.70 }
  ];

  // ---- Parameters ----
  var max_iter = 12;
  var eps = 1e-12;

  // ---- SSUM structural update policy (simple + deterministic) ----
  // IMPORTANT: progress must compare f_prev (previous step's "after") to f_now (current step's "after").
  function step_update(a_prev, s_prev, f_prev_after, f_now_after, dx) {
    var denom = Math.max(Math.abs(f_prev_after), eps);
    var ratio = Math.abs(f_now_after) / denom; // < 1 is good
    var progress = 1.0 - ratio;                // > 0 is good

    // r in [0,1]
    var r = Math.max(0.0, Math.min(1.0, progress));

    // update a in rapidity space (bounded)
    var a_new = SSUM.tanh(
      SSUM.atanh(SSUM.clamp(a_prev)) + (2.0 * r - 1.0) * 0.15
    );

    // update s as incremental contrast (bounded)
    var s_new = SSUM.tanh(
      SSUM.atanh(SSUM.clamp(s_prev)) +
      sign(dx) * Math.min(1.0, Math.abs(dx)) * 0.05
    );

    return { a: a_new, s: s_new };
  }

  // ---- Newton step with near-singular derivative guard ----
  function newton_step(x, runName, k) {
    var fx = f(x);
    var dfx = fp(x);

    // Guard A: f or f' invalid
    if (!is_finite_number(fx) || !is_finite_number(dfx)) {
      set_status_bad("bad: NaN/Inf at run=" + runName + " k=" + k + " (fx/f')");
      return { ok: false };
    }

    // Guard B: protect against near-zero derivative
    // HIGH-IMPACT FIX: when dfx == 0, sign(dfx) would be 0 -> denom becomes 0 (bad).
    // Use (dfx >= 0 ? +1 : -1) to guarantee denom is non-zero.
    var denom = dfx;
    if (Math.abs(denom) < 1e-15) {
      denom = ((dfx >= 0 ? +1 : -1) * 1e-15);
      set_status_warn("warn: near-zero derivative clamped at run=" + runName + " k=" + k);
    }

    var dx = -fx / denom;
    if (!is_finite_number(dx)) {
      set_status_bad("bad: dx is NaN/Inf at run=" + runName + " k=" + k);
      return { ok: false };
    }

    var x1 = x + dx;
    if (!is_finite_number(x1)) {
      set_status_bad("bad: x_next is NaN/Inf at run=" + runName + " k=" + k);
      return { ok: false };
    }

    // compute residual AFTER the step (used for progress + displayed in row)
    var fx1 = f(x1);
    if (!is_finite_number(fx1)) {
      set_status_bad("bad: f(x_next) is NaN/Inf at run=" + runName + " k=" + k);
      return { ok: false };
    }

    return { ok: true, fx: fx, dfx: dfx, dx: dx, x1: x1, fx1: fx1 };
  }

  // ---- Render header ----
  function render_header() {
    document.getElementById("title").textContent = TITLE;
    document.getElementById("subtitle").textContent = SUBTITLE;

    var w = document.getElementById("what");
    w.innerHTML = "";
    what.forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      w.appendChild(p);
    });

    var inputLines = [];
    inputLines.push("function:");
    inputLines.push("  f(x)  = x^3 - 2*x - 5");
    inputLines.push("  f'(x) = 3*x^2 - 2");
    inputLines.push("");
    inputLines.push("newton:");
    inputLines.push("  x_{k+1} = x_k - f(x_k)/f'(x_k)");
    inputLines.push("");
    inputLines.push("ssum guarantee:");
    inputLines.push("  x_k = (m_k, a_k, s_k)");
    inputLines.push("  phi((m_k,a_k,s_k)) = m_k");
    inputLines.push("");
    inputLines.push("runs:");
    runs.forEach(function (r) {
      inputLines.push("  " + r.name + ": x0=" + r.x0 + ", a0=" + r.a0);
    });
    inputLines.push("");
    inputLines.push("params:");
    inputLines.push("  max_iter=" + max_iter);
    inputLines.push("  eps=" + eps);

    document.getElementById("inputs").textContent = inputLines.join("\n");
  }

  // ---- Band helper (use core band for consistency) ----
  function band(a) { return SSUM.band(a); }

  // ---- Build rows ----
  function run_one(run) {
    var rows = [];
    var m = run.x0;
    var a = run.a0;
    var s = 0.0;

    // progress baseline should be the residual AFTER the previous step.
    // At k=0, "previous after" is just f(x0).
    var f_prev_after = f(m);
    if (!is_finite_number(f_prev_after)) {
      set_status_bad("bad: f(x0) is NaN/Inf for run=" + run.name);
      return rows;
    }

    for (var k = 0; k < max_iter; k++) {
      var step = newton_step(m, run.name, k);
      if (!step.ok) break;

      // HIGH-IMPACT FIX: progress must compare f_prev_after to f_now_after (fx1)
      var upd = step_update(a, s, f_prev_after, step.fx1, step.dx);
      a = upd.a;
      s = upd.s;

      // SSUM object corresponds to the iterate AFTER applying the step
      var x_struct = SSUM.make(step.x1, a, s);
      var phi_ok = (SSUM.phi(x_struct) === step.x1);

      rows.push({
        run: run.name,
        k: k,
        m: step.x1,     // show the iterate after the step (same convention as Newton01)
        fx: step.fx1,   // show f(m) at that iterate
        dx: step.dx,
        a: a,
        s: s,
        phi_ok: phi_ok,
        band: band(a)
      });

      // advance
      m = step.x1;
      f_prev_after = step.fx1;
    }

    return rows;
  }

  // ---- Render table ----
  function render_table(allRows) {
    var tbody = document.getElementById("tbody");
    if (!tbody) {
      set_status_warn("warn: table body not found (#tbody). Output not rendered.");
      return;
    }

    tbody.innerHTML = "";

    allRows.forEach(function (r) {
      var tr = document.createElement("tr");

      tr.innerHTML = [
        "<td class='runCell'>" + r.run + " <span class='pill'>" + r.band + "</span></td>",
        "<td>" + r.k + "</td>",
        "<td>" + r.m.toFixed(10) + "</td>",
        "<td>" + r.fx.toExponential(6) + "</td>",
        "<td>" + r.dx.toExponential(6) + "</td>",
        "<td>" + ((r.a >= 0 ? "+" : "") + r.a.toFixed(6)) + "</td>",
        "<td>" + ((r.s >= 0 ? "+" : "") + r.s.toFixed(6)) + "</td>",
        "<td class='" + (r.phi_ok ? "ok" : "bad") + "'>" + (r.phi_ok ? "true" : "false") + "</td>"
      ].join("");

      tbody.appendChild(tr);
    });
  }

  // ---- Interpretation ----
  function render_interpretation() {
    var lines = [];
    lines.push("m is the classical iterate x_k (unchanged).");
    lines.push("a is bounded in (-1,+1) and tracks step “health” (good progress -> higher a, poor step -> lower a).");
    lines.push("s is bounded in (-1,+1) and tracks step “contrast” (large jumps / sharp changes -> higher |s|).");
    lines.push("phi_ok must remain true. If it ever becomes false, the SSUM implementation is invalid.");
    lines.push("SSUM here provides structural observability, not prediction. Any forecasting or inference is done above SSUM.");
    document.getElementById("interpretation").textContent = lines.join("\n");
  }

  // ---- Main ----
  function main() {
    render_header();

    // default status
    set_status_ok("ok");

    var all = [];
    runs.forEach(function (r) {
      all = all.concat(run_one(r));
    });

    render_table(all);
    render_interpretation();

    // If status is still "ok", keep it ok. If warn/bad happened earlier, preserve it.
    var st = status_el();
    if (st && st.textContent === "ok") set_status_ok("ok");
  }

  window.addEventListener("DOMContentLoaded", main);
})();
