// observatory/01_newton_root/case.js
// Newton root finding with SSUM structural observability + tiny safeguards.
//
// Classical Newton step (plain ASCII):
//   x_{k+1} = x_k - f(x_k)/f'(x_k)
//
// SSUM representation (plain ASCII):
//   x_k = (m_k, a_k, s_k)
//   phi((m_k,a_k,s_k)) = m_k  (always)
//
// Structural update idea (deterministic, bounded):
//   r_k = clamp( 1 - |f(x_{k+1})| / max(|f(x_k)|, eps), 0, 1 )
//   u_a := update_alignment_u(u_a, r_k, alpha, gain)
//   a_k := tanh(u_a)
//   s_k := signature_from_step(dx, dx_scale, gain_s)
//
// Safeguards added (tiny, high impact):
//  1) NaN/Inf detection for dx, x_next, f(x_next)
//  2) Stronger near-zero derivative guard with explicit status reporting
//  3) Status box support (#status) if present; no-ops if absent
//  4) Table target support: writes to #rows (legacy) and also supports #tbody (newer pages)

(function () {
  "use strict";

  // ---- Problem definition (choose a smooth function with a real root) ----
  // Example: f(x) = x^3 - 2x - 5  (has a real root near x ~ 2.094...)
  function f(x)  { return x*x*x - 2*x - 5; }
  function fp(x) { return 3*x*x - 2; }

  // ---- Runs: one stable init, one unstable init ----
  var runs = [
    { name: "stable",   x0: 2.0,  a0: +0.70 },
    { name: "unstable", x0: -3.0, a0: +0.70 }
  ];

  // ---- Parameters ----
  var max_iter = 12;
  var eps = 1e-12;

  // Signature scaling: normalize dx by a typical magnitude.
  function dx_scale_for(x0) { return Math.abs(x0) + 1.0; }

  // ---- Tiny helpers ----
  function is_finite_number(v) { return typeof v === "number" && Number.isFinite(v); }

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

  // ---- Render Inputs ----
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

  var inputsEl = document.getElementById("inputs");
  if (inputsEl) inputsEl.textContent = inputLines.join("\n");

  // Default status
  set_status_ok("ok");

  // ---- Execute and collect results ----
  var allRows = [];

  runs.forEach(function (R) {
    var x = R.x0;
    var a = R.a0;
    var s = 0.0;

    // alignment rapidity state
    var u_a = SSUM.atanh(a);

    // previous residual magnitude
    var f_prev_abs = Math.abs(f(x));
    if (!is_finite_number(f_prev_abs)) {
      set_status_bad("bad: f(x0) is NaN/Inf for run=" + R.name);
      return;
    }

    var dx_scale = dx_scale_for(R.x0);

    for (var k = 0; k < max_iter; k++) {
      var fx = f(x);
      var fpx = fp(x);

      // Guard 1: If f or f' is NaN/Inf, stop this run.
      if (!is_finite_number(fx) || !is_finite_number(fpx)) {
        set_status_bad("bad: NaN/Inf at run=" + R.name + " k=" + k + " (fx/f') ");
        break;
      }

      // Guard 2: derivative too small -> clamp denom, but report it.
      var denom = fpx;
      if (Math.abs(denom) < eps) {
        denom = (denom >= 0 ? +eps : -eps);
        set_status_warn("warn: near-zero derivative clamped at run=" + R.name + " k=" + k);
      }

      var dx = -fx / denom;

      // Guard 3: dx must be finite
      if (!is_finite_number(dx)) {
        set_status_bad("bad: dx is NaN/Inf at run=" + R.name + " k=" + k);
        break;
      }

      var x_next = x + dx;

      // Guard 4: x_next must be finite
      if (!is_finite_number(x_next)) {
        set_status_bad("bad: x_next is NaN/Inf at run=" + R.name + " k=" + k);
        break;
      }

      var fx_next = f(x_next);
      if (!is_finite_number(fx_next)) {
        set_status_bad("bad: f(x_next) is NaN/Inf at run=" + R.name + " k=" + k);
        break;
      }

      var f_next_abs = Math.abs(fx_next);

      // progress ratio r in [0,1]
      // r = 1 - |f_next|/|f_prev|  (clamped)
      var r = 1.0 - (f_next_abs / Math.max(f_prev_abs, eps));
      if (r < 0) r = 0;
      if (r > 1) r = 1;

      // update structure deterministically
      u_a = SSUM.update_alignment_u(u_a, r, 0.35, 2.20);
      a = SSUM.tanh(u_a);
      s = SSUM.signature_from_step(dx, dx_scale, 1.40);

      // SSUM object for the iterate *after* applying the step
      var x_struct = SSUM.make(x_next, a, s);
      var phi_ok = (SSUM.phi(x_struct) === x_next);

      allRows.push({
        run: R.name,
        k: k,
        m: x_next,
        fx: fx_next,
        dx: dx,
        a: a,
        s: s,
        phi_ok: phi_ok,
        band: SSUM.band(a)
      });

      // advance
      x = x_next;
      f_prev_abs = Math.max(f_next_abs, eps);
    }
  });

  // ---- Render table ----
  // Support both ids:
  //  - NEWTON01 legacy: #rows
  //  - NEWTON02+ style: #tbody
  var tbody = document.getElementById("rows") || document.getElementById("tbody");
  if (!tbody) {
    set_status_warn("warn: table body not found (#rows or #tbody). Output not rendered.");
    return;
  }

  tbody.innerHTML = "";

  allRows.forEach(function (r) {
    var tr = document.createElement("tr");
    var pill = '<span class="pill">' + r.band + '</span>';

    tr.innerHTML = [
      "<td>" + r.run + " " + pill + "</td>",
      "<td>" + r.k + "</td>",
      "<td>" + r.m.toFixed(10) + "</td>",
      "<td>" + r.fx.toExponential(6) + "</td>",
      "<td>" + r.dx.toExponential(6) + "</td>",
      "<td>" + ((r.a >= 0) ? "+" : "") + r.a.toFixed(6) + "</td>",
      "<td>" + ((r.s >= 0) ? "+" : "") + r.s.toFixed(6) + "</td>",
      '<td class="' + (r.phi_ok ? "ok" : "bad") + '">' + (r.phi_ok ? "true" : "false") + "</td>"
    ].join("");

    tbody.appendChild(tr);
  });

  // If we didn’t hit any warnings/bads, keep status as ok.
  // (If there was a warn earlier, we keep it.)
  var st = status_el();
  if (st && st.textContent === "ok") set_status_ok("ok");
})();
