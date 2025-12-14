(function () {
  "use strict";

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  function proj3to2(p3, w, h) {
    var x = p3[0], y = p3[1], z = p3[2];
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

  function drawWire(ctx, model, w, h, overlay) {
    var verts2 = [];
    for (var i = 0; i < model.verts.length; i++) verts2.push(proj3to2(model.verts[i], w, h));

    for (var e = 0; e < model.edges.length; e++) {
      var ia = model.edges[e][0], ib = model.edges[e][1];
      var p = verts2[ia], q = verts2[ib];

      if (overlay && model.struct && model.struct[ia] && model.struct[ib]) {
        var wa = Math.abs(model.struct[ia].w), wb = Math.abs(model.struct[ib].w);
        var v = clamp((wa + wb) * 0.5, 0.0, 1.0);
        ctx.globalAlpha = 0.25 + 0.75 * v;
        ctx.lineWidth = 1.0 + 2.0 * v;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 2;
      }

      ctx.strokeStyle = "#111";
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#111";
    for (var vtx = 0; vtx < verts2.length; vtx++) {
      var t = verts2[vtx];
      var r = 3;
      if (overlay && model.struct && model.struct[vtx]) {
        var ww = clamp(Math.abs(model.struct[vtx].w), 0.0, 1.0);
        r = 2 + 3 * ww;
      }
      ctx.beginPath();
      ctx.arc(t[0], t[1], r, 0, Math.PI * 2);
      ctx.fill();
    }

    return verts2;
  }

  function setMathBlock() {
    var lines = [];
    lines.push("Lift: (x,y,z) -> (x,y,z,w=0)");
    lines.push("");
    lines.push("4D rotation in x-w plane:");
    lines.push("  x' = x*cos(theta) - w*sin(theta)");
    lines.push("  w' = x*sin(theta) + w*cos(theta)");
    lines.push("");
    lines.push("Projection back to 3D (w-scaled):");
    lines.push("  scale = 1 / (1 + alpha*w')");
    lines.push("  (x_p,y_p,z_p) = scale*(x',y',z')");
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

  function main() {
    var cv = document.getElementById("cv");
    var ctx = cv.getContext("2d");

    var theta = document.getElementById("theta");
    var alpha = document.getElementById("alpha");
    var k = document.getElementById("k");
    var auto = document.getElementById("auto");
    var overlay = document.getElementById("overlay");

    var thetaLabel = document.getElementById("thetaLabel");
    var alphaLabel = document.getElementById("alphaLabel");
    var kLabel = document.getElementById("kLabel");
    var autoLabel = document.getElementById("autoLabel");

    var wLabel = document.getElementById("wLabel");
    var wAbsLabel = document.getElementById("wAbsLabel");
    var denomLabel = document.getElementById("denomLabel");
    var scaleLabel = document.getElementById("scaleLabel");
    var aLabel = document.getElementById("aLabel");
    var sLabel = document.getElementById("sLabel");

    var exportBtn = document.getElementById("exportBtn");
    var hoverTip = document.getElementById("hoverTip");

    setMathBlock();

    var t = parseFloat(theta.value);
    var a = parseFloat(alpha.value);
    var kk = parseFloat(k.value);
    var last = performance.now();

    var lastModel = null;
    var lastVerts2 = null;

    function syncLabels(st) {
      if (thetaLabel) thetaLabel.textContent = t.toFixed(2) + " rad";
      if (alphaLabel) alphaLabel.textContent = a.toFixed(2);
      if (kLabel) kLabel.textContent = kk.toFixed(2);
      if (autoLabel) autoLabel.textContent = auto && auto.checked ? "ON" : "OFF";

      if (st) {
        if (wLabel) wLabel.textContent = "w:[" + fmt(st.minW) + "," + fmt(st.maxW) + "]";
        if (wAbsLabel) wAbsLabel.textContent = "|w|_max=" + st.maxAbsW.toFixed(3);
        if (denomLabel) denomLabel.textContent = "denom_min=" + (isFinite(st.minDenomAbs) ? st.minDenomAbs.toExponential(2) : "n/a");
        if (scaleLabel) scaleLabel.textContent = "scale_max=" + (isFinite(st.maxScaleAbs) ? st.maxScaleAbs.toExponential(2) : "n/a");
        if (aLabel) aLabel.textContent = "a_avg=" + st.aAvg.toFixed(3);
        if (sLabel) sLabel.textContent = "s_avg=" + st.sAvg.toFixed(3);
      } else {
        if (wLabel) wLabel.textContent = "w:[n/a]";
        if (wAbsLabel) wAbsLabel.textContent = "|w|_max=n/a";
        if (denomLabel) denomLabel.textContent = "denom_min=n/a";
        if (scaleLabel) scaleLabel.textContent = "scale_max=n/a";
        if (aLabel) aLabel.textContent = "a_avg=n/a";
        if (sLabel) sLabel.textContent = "s_avg=n/a";
      }
    }

    function frame(now) {
      var dt = (now - last) / 1000.0;
      last = now;

      if (auto && auto.checked) {
        t += dt * 0.65;
        if (t > Math.PI * 2) t -= Math.PI * 2;
        theta.value = String(t);
      } else {
        t = parseFloat(theta.value);
      }

      a = clamp(parseFloat(alpha.value), 0.0, 1.5);
      kk = clamp(parseFloat(k.value), 0.6, 4.0);

      clear(ctx, cv.width, cv.height);

      var model = window.HYPER.hyperRotateCube(0.9, t, a, kk);

      window.__verts4_rotated = model.verts4;
      window.__struct = model.struct;

      lastModel = model;

      var st = stats(model);
      syncLabels(st);

      lastVerts2 = drawWire(ctx, model, cv.width, cv.height, !!(overlay && overlay.checked));

      requestAnimationFrame(frame);
    }

    cv.addEventListener("mousemove", function (ev) {
      if (!hoverTip || !lastModel || !lastVerts2) return;
      var rect = cv.getBoundingClientRect();
      var mx = (ev.clientX - rect.left) * (cv.width / rect.width);
      var my = (ev.clientY - rect.top) * (cv.height / rect.height);
      var idx = nearestVertexIndex(mx, my, lastVerts2, 18);
      if (idx < 0) {
        hoverTip.style.display = "none";
        return;
      }
      var v4 = lastModel.verts4[idx];
      var p3 = lastModel.verts[idx];
      var st = lastModel.struct[idx];
      var text = "";
      text += "vertex " + idx + "\n";
      text += "p3: (" + p3[0].toFixed(4) + ", " + p3[1].toFixed(4) + ", " + p3[2].toFixed(4) + ")\n";
      text += "v4: (" + v4[0].toFixed(4) + ", " + v4[1].toFixed(4) + ", " + v4[2].toFixed(4) + ", " + v4[3].toFixed(4) + ")\n";
      text += "w=" + st.w.toFixed(4) + "  denom=" + st.denom.toExponential(3) + "  scale=" + st.scale.toExponential(3) + "\n";
      text += "a=" + st.a.toFixed(4) + "  s=" + st.s.toFixed(4) + "  health=" + st.health.toFixed(4);
      hoverTip.textContent = text;
      hoverTip.style.display = "inline-block";
    });

    cv.addEventListener("mouseleave", function () {
      if (hoverTip) hoverTip.style.display = "none";
    });

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        if (!lastModel) return;

        var st = stats(lastModel) || null;

        downloadJSON({
          case: "SSUM Observatory 04 Hyper-Rotation",
          params: { theta: t, alpha: a, k: kk },
          stats: st ? {
            w_min: st.minW,
            w_max: st.maxW,
            w_abs_max: st.maxAbsW,
            denom_abs_min: st.minDenomAbs,
            scale_abs_max: st.maxScaleAbs,
            a_avg: st.aAvg,
            s_avg: st.sAvg
          } : null,
          verts4: lastModel.verts4,
          verts3: lastModel.verts,
          struct: lastModel.struct
        }, "ssum_observatory_case04_snapshot.json");
      });
    }

    theta.addEventListener("input", function () { t = parseFloat(theta.value); });
    alpha.addEventListener("input", function () { a = parseFloat(alpha.value); });
    k.addEventListener("input", function () { kk = parseFloat(k.value); });

    syncLabels(null);
    requestAnimationFrame(frame);
  }

  window.addEventListener("DOMContentLoaded", main);
})();
