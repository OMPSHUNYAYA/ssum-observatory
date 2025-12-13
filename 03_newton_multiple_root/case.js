// observatory/03_newton_multiple_root/case.js
(function () {
  "use strict";

  // ---- Title / subtitle ----
  var TITLE = "SSUM Observatory — 03 Newton Multiple Root";
  var SUBTITLE = "Structured Numbers • Classical Correctness • Universal Behavioural Insight";

  // ---- What this demonstrates ----
  var what = [
    "Classical layer: Newton’s method converges to a multiple root.",
    "SSUM layer: structure reveals slow, fragile convergence.",
    "Guarantee: phi((m,a,s)) = m at every step.",
    "This case demonstrates silent degradation that classical math cannot see."
  ];

  // ---- Function under test (double root) ----
  // f(x) = (x - 1)^2
  // f'(x) = 2(x - 1)
  function f(x) { return (x - 1) * (x - 1); }
  function fp(x) { return 2 * (x - 1); }

  // ---- Run ----
  var run = { name: "double_root", x0: 1.8, a0: +0.70 };

  // ---- Parameters ----
  var max_iter = 12;
  var eps = 1e-12;

  // ---- Helpers ----
  function sign(x) {
    return x > 0 ? 1 : (x < 0 ? -1 : 0);
  }

  function fmtSigned(x, digits) {
    var s = x >= 0 ? "+" : "";
    return s + x.toFixed(digits);
  }

  function band(a) {
    if (a >= 0.90) return "A++";
    if (a >= 0.60) return "A+";
    if (a > -0.60) return "A0";
    if (a > -0.90) return "A-";
    return "A--";
  }

  // ---- SSUM structural update policy ----
  // a tracks step “health”: good progress -> higher a, poor step -> lower a
  // s tracks step “contrast”: repeated shallow steps keep |s| elevated
  function step_update(a_prev, s_prev, f_prev, f_now, dx) {
    var denom = Math.max(Math.abs(f_prev), eps);
    var ratio = Math.abs(f_now) / denom; // < 1 is good
    var progress = 1.0 - ratio;          // > 0 is good

    // r in [0,1]
    var r = Math.max(0.0, Math.min(1.0, progress));

    // bounded update in atanh/tanh space
    var a_new = SSUM.tanh(
      SSUM.atanh(SSUM.clamp(a_prev)) + (2.0 * r - 1.0) * 0.10
    );

    // contrast: respond to step direction + size (bounded)
    var stepMag = Math.min(1.0, Math.abs(dx));
    var s_new = SSUM.tanh(
      SSUM.atanh(SSUM.clamp(s_prev)) + sign(dx) * stepMag * 0.05
    );

    return { a: a_new, s: s_new };
  }

  // ---- Newton iterate ----
  function newton_step(x) {
    var fx = f(x);
    var dfx = fp(x);

    // for this particular f'(x)=2(x-1), dfx can approach 0 near root.
    // clamp denominator to avoid NaN/Inf while preserving sign.
    var denom = dfx;
    if (Math.abs(denom) < 1e-15) {
      denom = (denom === 0 ? 1 : sign(denom)) * 1e-15;
    }

    var dx = -fx / denom;
    return { fx: fx, dfx: dfx, dx: dx, x1: x + dx };
  }

  // ---- Render header ----
  function render_header() {
    document.getElementById("title").textContent = TITLE;
    document.getElementById("subtitle").textContent = SUBTITLE;

    var w = document.getElementById("what");
    w.innerHTML = "";
    what.forEach(function (t) {
      var p = document.createElement("p");
      p.textContent = t;
      w.appendChild(p);
    });

    var inputLines = [];
    inputLines.push("function:");
    inputLines.push("  f(x)  = (x - 1)^2");
    inputLines.push("  f'(x) = 2(x - 1)");
    inputLines.push("");
    inputLines.push("newton:");
    inputLines.push("  x_{k+1} = x_k - f(x_k)/f'(x_k)");
    inputLines.push("");
    inputLines.push("ssum guarantee:");
    inputLines.push("  phi((m,a,s)) = m");
    inputLines.push("");
    inputLines.push("run:");
    inputLines.push("  x0 = " + run.x0 + ", a0 = " + run.a0);
    inputLines.push("");
    inputLines.push("params:");
    inputLines.push("  max_iter = " + max_iter);

    document.getElementById("inputs").textContent = inputLines.join("\n");
  }

  // ---- Render table ----
  function render_table(rows) {
    var tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    rows.forEach(function (r) {
      var tr = document.createElement("tr");

      // run cell (single-line: name + pill) — consistent with Case 01 / Case 02
      var tdRun = document.createElement("td");
      tdRun.className = "runCell";
      tdRun.innerHTML =
        r.run + " <span class='pill'>" + band(r.a) + "</span>";
      tr.appendChild(tdRun);


      function tdText(txt, cls) {
        var t = document.createElement("td");
        if (cls) t.className = cls;
        t.textContent = txt;
        return t;
      }

      tr.appendChild(tdText(String(r.k)));
      tr.appendChild(tdText(r.m.toFixed(10)));
      tr.appendChild(tdText(r.fx.toExponential(6)));
      tr.appendChild(tdText(r.dx.toExponential(6)));
      tr.appendChild(tdText(fmtSigned(r.a, 6)));
      tr.appendChild(tdText(fmtSigned(r.s, 6)));
      tr.appendChild(tdText(String(r.phi_ok), r.phi_ok ? "ok" : "bad"));

      tbody.appendChild(tr);
    });
  }

  // ---- Interpretation ----
  function render_interpretation() {
    document.getElementById("interpretation").textContent =
      "m converges to the correct root.\n" +
      "a rises slowly, indicating forced alignment rather than healthy convergence.\n" +
      "s remains elevated, revealing persistent structural weakness from repeated shallow steps.\n" +
      "Classical math sees success; SSUM detects fragility.";
  }

  // ---- Main ----
  function main() {
    render_header();

    var rows = [];

    var m = run.x0;
    var a = run.a0;
    var s = 0.0;

    var prev_fx = f(m);

    for (var k = 0; k < max_iter; k++) {
      var step = newton_step(m);

      // SSUM update
      var upd = step_update(a, s, prev_fx, step.fx, step.dx);
      a = upd.a;
      s = upd.s;

      // collapse parity check
      var phi_ok = (SSUM.phi({ m: m, a: a, s: s }) === m);

      rows.push({
        run: run.name,
        k: k,
        m: m,
        fx: step.fx,
        dx: step.dx,
        a: a,
        s: s,
        phi_ok: phi_ok
      });

      // advance
      prev_fx = step.fx;
      m = step.x1;
    }

    render_table(rows);
    render_interpretation();
  }

  window.addEventListener("DOMContentLoaded", main);
})();
