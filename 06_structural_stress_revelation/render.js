(function () {
  "use strict";

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  // Provide compatibility even if someone calls RENDER.* from HTML
  window.RENDER = window.RENDER || {};

  function setMathBlock() {
    var lines = [];
    lines.push("Lift: (x,y,z) -> (x,y,z,w=0)");
    lines.push("");
    lines.push("Pure 4D rotation in x-w plane (mode: x–w rotation):");
    lines.push("  x' = x*cos(theta) - w*sin(theta)");
    lines.push("  w' = x*sin(theta) + w*cos(theta)");
    lines.push("");
    lines.push("Projection back to 3D (w-scaled):");
    lines.push("  scale = 1 / (1 + alpha*w')");
    lines.push("  (x_p,y_p,z_p) = scale*(x',y',z')");
    lines.push("");
    lines.push("Latent stress axis modes (deterministic, observational):");
    lines.push("  fixed:  w' = seed_fixed(x)*sin(theta)        # proximity to a fixed boundary");
    lines.push("  corner: w' = seed_corner(x,y,z)*sin(theta)   # proximity to a corner/notch");
    lines.push("");
    lines.push("Structural channels (observational only):");
    lines.push("  a = tanh(k * a_raw)");
    lines.push("  s = tanh(k * (2*s_raw - 1))");
    var el = document.getElementById("math");
    if (el) el.textContent = lines.join("\n");
  }

  function fmt(x) { return (x >= 0 ? "+" : "") + x.toFixed(3); }

  function stats(model) {
    var minW = 1e9, maxW = -1e9, maxAbsW = 0.0;
    var minDenom = 1e9, maxScaleAbs = 0.0;
    var sumA = 0, sumS = 0, n = 0;

    if (!model || !model.struct) return null;

    for (var i = 0; i < model.struct.length; i++) {
      var st = model.struct[i];
      if (!st) continue;

      if (typeof st.w === "number" && isFinite(st.w)) {
        if (st.w < minW) minW = st.w;
        if (st.w > maxW) maxW = st.w;
        var aw = Math.abs(st.w);
        if (aw > maxAbsW) maxAbsW = aw;
      }

      if (typeof st.denom === "number" && isFinite(st.denom)) {
        var ad = Math.abs(st.denom);
        if (ad < minDenom) minDenom = ad;
      }

      if (typeof st.scale === "number" && isFinite(st.scale)) {
        var ascale = Math.abs(st.scale);
        if (ascale > maxScaleAbs) maxScaleAbs = ascale;
      }

      if (typeof st.a === "number" && isFinite(st.a)) sumA += st.a;
      if (typeof st.s === "number" && isFinite(st.s)) sumS += st.s;
      n++;
    }

    if (n === 0) return null;

    return {
      minW: minW,
      maxW: maxW,
      maxAbsW: maxAbsW,
      minDenomAbs: minDenom,
      maxScaleAbs: maxScaleAbs,
      aAvg: sumA / n,
      sAvg: sumS / n
    };
  }

  function proj3to2(p3, w, h, ortho) {
    var x = p3[0], y = p3[1], z = p3[2];

    if (ortho) {
      var sx = w * 0.35;
      var sy = h * 0.35;
      return [w * 0.5 + x * sx, h * 0.5 - y * sy];
    }

    var camZ = 3.2;
    var fov = 1.2;
    var denom = (camZ - z);
    if (Math.abs(denom) < 1e-6) denom = (denom < 0 ? -1 : 1) * 1e-6;
    var px = (x * fov) / denom;
    var py = (y * fov) / denom;
    return [w * 0.5 + px * (w * 0.35), h * 0.5 - py * (h * 0.35)];
  }

  function clear(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#f3f3f3";
    for (var i = 0; i <= 12; i++) {
      var x = (w * i) / 12;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (var j = 0; j <= 8; j++) {
      var y = (h * j) / 8;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  function nearestVertexIndex(mx, my, verts2, pxRadius) {
    if (!verts2 || verts2.length === 0) return -1;
    var r2 = pxRadius * pxRadius;
    var best = -1;
    var bestD2 = 1e18;
    for (var i = 0; i < verts2.length; i++) {
      var dx = verts2[i][0] - mx;
      var dy = verts2[i][1] - my;
      var d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = i; }
    }
    return (bestD2 <= r2) ? best : -1;
  }

  function downloadJSON(obj, filename) {
    var json = JSON.stringify(obj, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function snapshotPNG(canvas, filename) {
    var url = canvas.toDataURL("image/png");
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function drawWire(ctx, model, w, h, overlay, ortho, style) {
    var verts2 = [];
    for (var i = 0; i < model.verts.length; i++) verts2.push(proj3to2(model.verts[i], w, h, ortho));

    var stroke = (style && style.stroke) ? style.stroke : "#111";
    var baseAlpha = (style && typeof style.alpha === "number") ? style.alpha : 1.0;
    var baseWidth = (style && typeof style.width === "number") ? style.width : 2.0;

    // edges
    for (var e = 0; e < model.edges.length; e++) {
      var ia = model.edges[e][0], ib = model.edges[e][1];
      var p = verts2[ia], q = verts2[ib];

      if (overlay && model.struct && model.struct[ia] && model.struct[ib]) {
        var wa = Math.abs(model.struct[ia].w), wb = Math.abs(model.struct[ib].w);
        var v = clamp((wa + wb) * 0.5, 0.0, 1.0);
        ctx.globalAlpha = baseAlpha * (0.22 + 0.78 * v);
        ctx.lineWidth = baseWidth + 2.6 * v;
      } else {
        ctx.globalAlpha = baseAlpha;
        ctx.lineWidth = baseWidth;
      }

      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    }

    // vertices
    ctx.fillStyle = stroke;
    ctx.globalAlpha = baseAlpha;
    for (var vtx = 0; vtx < verts2.length; vtx++) {
      var t = verts2[vtx];
      var r = 3;
      if (overlay && model.struct && model.struct[vtx]) {
        var ww = clamp(Math.abs(model.struct[vtx].w), 0.0, 1.0);
        r = 2 + 3.2 * ww;
      }
      ctx.beginPath();
      ctx.arc(t[0], t[1], r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    return verts2;
  }

  function main() {
    setMathBlock();

    var cv = document.getElementById("cv");
    if (!cv) return;
    var ctx = cv.getContext("2d");

    var presetSel = document.getElementById("preset");
    var stressSel = document.getElementById("stressMode");

    var theta = document.getElementById("theta");
    var alpha = document.getElementById("alpha");
    var k = document.getElementById("k");
    var auto = document.getElementById("auto");
    var overlay = document.getElementById("overlay");
    var ghost = document.getElementById("ghost");
    var ortho = document.getElementById("ortho");

    var thetaLabel = document.getElementById("thetaLabel");
    var alphaLabel = document.getElementById("alphaLabel");
    var kLabel = document.getElementById("kLabel");
    var autoLabel = document.getElementById("autoLabel");
    var ghostLabel = document.getElementById("ghostLabel");
    var projLabel = document.getElementById("projLabel");

    var wLabel = document.getElementById("wLabel");
    var wAbsLabel = document.getElementById("wAbsLabel");
    var denomLabel = document.getElementById("denomLabel");
    var scaleLabel = document.getElementById("scaleLabel");
    var aLabel = document.getElementById("aLabel");
    var sLabel = document.getElementById("sLabel");

    var exportBtn = document.getElementById("exportBtn");
    var resetThetaBtn = document.getElementById("resetThetaBtn");
    var snapshotBtn = document.getElementById("snapshotBtn");
    var hoverTip = document.getElementById("hoverTip");

    var lastT = 0;
    var verts2 = null;
    var model = null;
    var ghostModel = null;

    function safeValue(el, fallback) {
      if (!el) return fallback;
      var v = parseFloat(el.value);
      return isFinite(v) ? v : fallback;
    }

    function updateLabels() {
      var thv = safeValue(theta, 0);
      var alv = safeValue(alpha, 0.65);
      var kv = safeValue(k, 2.2);

      if (thetaLabel) thetaLabel.textContent = thv.toFixed(2) + " rad";
      if (alphaLabel) alphaLabel.textContent = alv.toFixed(2);
      if (kLabel) kLabel.textContent = kv.toFixed(2);

      if (autoLabel) autoLabel.textContent = (auto && auto.checked) ? "ON" : "OFF";
      if (ghostLabel) ghostLabel.textContent = (ghost && ghost.checked) ? "ON" : "OFF";
      if (projLabel) projLabel.textContent = (ortho && ortho.checked) ? "ORTHOGRAPHIC" : "PERSPECTIVE";
    }

    function recompute() {
      updateLabels();

      var th = safeValue(theta, 0);
      var al = safeValue(alpha, 0.65);
      var kk = safeValue(k, 2.2);

      var preset = presetSel ? presetSel.value : "cube";
      var sm = stressSel ? stressSel.value : "xw";

      model = window.HYPER.hyperRotateMesh(preset, th, al, kk, sm);
      ghostModel = window.HYPER.hyperRotateMesh(preset, 0.0, al, kk, sm);

      // Expose for console checks
      window.__model = model;
      window.__verts4_rotated = model.verts4;
      window.__struct = model.struct;

      clear(ctx, cv.width, cv.height);

      var doOrtho = !!(ortho && ortho.checked);
      var doOverlay = !!(overlay && overlay.checked);

      // Ghost reference behind
      if (ghost && ghost.checked && ghostModel) {
        drawWire(ctx, ghostModel, cv.width, cv.height, false, doOrtho, { stroke: "#b8b8b8", alpha: 0.55, width: 1.5 });
      }

      verts2 = drawWire(ctx, model, cv.width, cv.height, doOverlay, doOrtho, { stroke: "#111", alpha: 1.0, width: 2.0 });

      var st = stats(model);
      window.__stats = st;

      if (st) {
        if (wLabel) wLabel.textContent = "w:[" + fmt(st.minW) + "," + fmt(st.maxW) + "]";
        if (wAbsLabel) wAbsLabel.textContent = "|w|_max=" + st.maxAbsW.toFixed(3);
        if (denomLabel) denomLabel.textContent = "denom_min=" + st.minDenomAbs.toFixed(3);
        if (scaleLabel) scaleLabel.textContent = "scale_max=" + st.maxScaleAbs.toFixed(3);
        if (aLabel) aLabel.textContent = "a_avg=" + st.aAvg.toFixed(3);
        if (sLabel) sLabel.textContent = "s_avg=" + st.sAvg.toFixed(3);
      }
    }

    function step(ts) {
      var dt = (ts - lastT) / 1000;
      lastT = ts;

      if (auto && auto.checked && theta) {
        var v = safeValue(theta, 0);
        v += dt * 0.85;
        if (v > 6.283185307) v -= 6.283185307;
        theta.value = v.toFixed(3);
      }

      recompute();
      requestAnimationFrame(step);
    }

    // Hover inspector (safe even if hoverTip missing)
    cv.addEventListener("mousemove", function (ev) {
      if (!model || !verts2 || !hoverTip) return;

      var rect = cv.getBoundingClientRect();
      var mx = (ev.clientX - rect.left) * (cv.width / rect.width);
      var my = (ev.clientY - rect.top) * (cv.height / rect.height);

      var idx = nearestVertexIndex(mx, my, verts2, 14);
      if (idx < 0) { hoverTip.style.display = "none"; return; }

      var v4 = model.verts4[idx];
      var st = model.struct[idx];
      var p3 = model.verts[idx];

      var lines = [];
      lines.push("vertex #" + idx);
      lines.push("  p3 = (" + fmt(p3[0]) + "," + fmt(p3[1]) + "," + fmt(p3[2]) + ")");
      lines.push("  v4 = (" + fmt(v4[0]) + "," + fmt(v4[1]) + "," + fmt(v4[2]) + "," + fmt(v4[3]) + ")");
      lines.push("  w=" + fmt(st.w) + "  denom=" + fmt(st.denom) + "  scale=" + fmt(st.scale));
      lines.push("  a=" + fmt(st.a) + "  s=" + fmt(st.s) + "  health=" + st.health.toFixed(3));
      lines.push("  preset=" + (model.preset || "") + "  stressMode=" + (model.stressMode || ""));
      hoverTip.textContent = lines.join("\n");
      hoverTip.style.display = "block";
    });

    cv.addEventListener("mouseleave", function () {
      if (hoverTip) hoverTip.style.display = "none";
    });

    // Events
    if (presetSel) presetSel.addEventListener("change", recompute);
    if (stressSel) stressSel.addEventListener("change", recompute);

    if (theta) theta.addEventListener("input", recompute);
    if (alpha) alpha.addEventListener("input", recompute);
    if (k) k.addEventListener("input", recompute);
    if (auto) auto.addEventListener("change", recompute);
    if (overlay) overlay.addEventListener("change", recompute);
    if (ghost) ghost.addEventListener("change", recompute);
    if (ortho) ortho.addEventListener("change", recompute);

    if (resetThetaBtn) {
      resetThetaBtn.onclick = function () {
        if (theta) theta.value = "0";
        if (auto) auto.checked = false;
        recompute();
      };
    }

    if (snapshotBtn) {
      snapshotBtn.onclick = function () {
        snapshotPNG(cv, "ssum_case06_stress_revelation.png");
      };
    }

    if (exportBtn) {
      exportBtn.onclick = function () {
        if (!model) recompute();
        var st = window.__stats || null;

        var payload = {
          title: "SSUM Observatory — 06 Structural Stress Revelation",
          disclaimer: "Observation-only geometric analog; not a physics-based stress/strain analysis method; not a substitute for FEA.",
          preset: model.preset,
          stressMode: model.stressMode,
          theta: safeValue(theta, 0),
          alpha: safeValue(alpha, 0.65),
          k: safeValue(k, 2.2),
          stats: st,
          verts3_projected: model.verts,
          edges: model.edges,
          verts4: model.verts4,
          struct: model.struct,
          meta: model.meta || {}
        };
        downloadJSON(payload, "ssum_case06_stress_revelation.json");
      };
    }

    // Start animation
    updateLabels();
    requestAnimationFrame(step);
  }

  // Public start hook (optional)
  window.RENDER.start = main;

  if (document.readyState === "complete" || document.readyState === "interactive") main();
  else document.addEventListener("DOMContentLoaded", main);
})();
