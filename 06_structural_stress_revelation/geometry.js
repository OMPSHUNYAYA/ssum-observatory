(function () {
  "use strict";

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }

  function dist3(a, b) {
    var dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function tanh(x) {
    if (Math.tanh) return Math.tanh(x);
    var e2 = Math.exp(2 * x);
    return (e2 - 1) / (e2 + 1);
  }

  // ---------- Presets ----------
  function cubePreset(size) {
    var s = size;
    var verts = [
      [-s, -s, -s], [+s, -s, -s], [+s, +s, -s], [-s, +s, -s],
      [-s, -s, +s], [+s, -s, +s], [+s, +s, +s], [-s, +s, +s]
    ];
    var edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    return { verts3: verts, edges: edges, meta: { kind: "cube", fixedPlaneX: +s, corner: [+s, +s, 0] } };
  }

  function beamPreset() {
    var L = 1.15;
    var W = 0.35;
    var H = 0.25;
    var nx = 6; // slightly higher than v1 without heavy cost
    var verts = [];
    for (var i = 0; i <= nx; i++) {
      var t = i / nx;
      var x = -L + 2 * L * t;
      verts.push([x, -W, -H]);
      verts.push([x, +W, -H]);
      verts.push([x, +W, +H]);
      verts.push([x, -W, +H]);
    }

    var edges = [];
    for (var s0 = 0; s0 <= nx; s0++) {
      var base = s0 * 4;
      edges.push([base + 0, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base + 0]);
    }
    for (var s1 = 0; s1 < nx; s1++) {
      var a = s1 * 4;
      var b = (s1 + 1) * 4;
      edges.push([a + 0, b + 0], [a + 1, b + 1], [a + 2, b + 2], [a + 3, b + 3]);
    }

    var fixedSlice = nx;
    var fb = fixedSlice * 4;
    edges.push([fb + 0, fb - 4 + 2], [fb + 1, fb - 4 + 3]);

    return { verts3: verts, edges: edges, meta: { kind: "beam", fixedPlaneX: +L, corner: [+L, +W, +H] } };
  }

  function notchPreset() {
    var z0 = -0.22, z1 = +0.22;

    var P = [
      [-1.05, -1.05],
      [+1.05, -1.05],
      [+1.05, +0.55],
      [+0.55, +0.55],
      [+0.55, +1.05],
      [-1.05, +1.05]
    ];

    var notchCorner = [+0.55, +0.55, 0];

    var verts = [];
    for (var i = 0; i < P.length; i++) verts.push([P[i][0], P[i][1], z0]);
    for (var j = 0; j < P.length; j++) verts.push([P[j][0], P[j][1], z1]);

    var n = P.length;
    var edges = [];
    for (var k = 0; k < n; k++) {
      edges.push([k, (k + 1) % n]);
      edges.push([n + k, n + ((k + 1) % n)]);
      edges.push([k, n + k]);
    }

    edges.push([2, 4], [n + 2, n + 4]);
    edges.push([3, 4], [n + 3, n + 4]);

    return { verts3: verts, edges: edges, meta: { kind: "notch", fixedPlaneX: +1.05, corner: notchCorner } };
  }

  function holePlatePreset() {
    // Square plate wireframe + circular hole wireframe; connected by a few radial spokes.
    // This is a geometry-first analog of a canonical stress-concentration shape.
    var z0 = -0.18, z1 = +0.18;
    var S = 1.1;
    var r = 0.45;
    var seg = 18;

    var verts = [];
    // Outer square (bottom)
    var outer = [
      [-S, -S], [ S, -S], [ S,  S], [-S,  S]
    ];
    for (var i = 0; i < outer.length; i++) verts.push([outer[i][0], outer[i][1], z0]);

    // Outer square (top)
    for (var j = 0; j < outer.length; j++) verts.push([outer[j][0], outer[j][1], z1]);

    var baseHole0 = verts.length;
    for (var a = 0; a < seg; a++) {
      var t = (a / seg) * Math.PI * 2;
      verts.push([r * Math.cos(t), r * Math.sin(t), z0]);
    }
    var baseHole1 = verts.length;
    for (var b = 0; b < seg; b++) {
      var t2 = (b / seg) * Math.PI * 2;
      verts.push([r * Math.cos(t2), r * Math.sin(t2), z1]);
    }

    var edges = [];

    // Outer square edges bottom/top + verticals
    edges.push([0,1],[1,2],[2,3],[3,0]);
    edges.push([4,5],[5,6],[6,7],[7,4]);
    edges.push([0,4],[1,5],[2,6],[3,7]);

    // Hole ring edges bottom/top + verticals
    for (var k = 0; k < seg; k++) {
      var k2 = (k + 1) % seg;
      edges.push([baseHole0 + k, baseHole0 + k2]);
      edges.push([baseHole1 + k, baseHole1 + k2]);
      edges.push([baseHole0 + k, baseHole1 + k]);
    }

    // A few spokes from hole to outer boundary (bottom + top) to make interaction visible
    var spokeCount = 6;
    for (var s = 0; s < spokeCount; s++) {
      var ang = (s / spokeCount) * Math.PI * 2;
      var vx = Math.cos(ang), vy = Math.sin(ang);

      var bestOuter = 0, bestDot = -1e9;
      for (var oi = 0; oi < outer.length; oi++) {
        var dot = outer[oi][0] * vx + outer[oi][1] * vy;
        if (dot > bestDot) { bestDot = dot; bestOuter = oi; }
      }

      var holeIdx = Math.floor((s / spokeCount) * seg) % seg;
      edges.push([bestOuter, baseHole0 + holeIdx]);
      edges.push([4 + bestOuter, baseHole1 + holeIdx]);
    }

    // Canonical hotspot is near the right side of the hole
    var hotspot = [r, 0, 0];

    return { verts3: verts, edges: edges, meta: { kind: "hole", fixedPlaneX: +S, corner: hotspot } };
  }

  // ---------- Lift / rotate / project ----------
  function lift3to4(v3) { return [v3[0], v3[1], v3[2], 0.0]; }

  function rotXW(v4, theta) {
    var x = v4[0], y = v4[1], z = v4[2], w = v4[3];
    var c = Math.cos(theta), s = Math.sin(theta);
    return [x * c - w * s, y, z, x * s + w * c];
  }

  function project4to3(v4, alpha) {
    var x = v4[0], y = v4[1], z = v4[2], w = v4[3];
    var denom = 1.0 + alpha * w;
    var eps = 1e-9;
    if (Math.abs(denom) < eps) denom = (denom < 0 ? -1 : 1) * eps;
    var scale = 1.0 / denom;
    return { p3: [x * scale, y * scale, z * scale], denom: denom, w: w, scale: scale };
  }

  function structuralChannels(alpha, w, denom, scale, k) {
    var absaw = Math.abs(alpha * w);
    var health = 1.0 / (1.0 + absaw);
    var a_raw = 2.0 * health - 1.0;
    var s_raw = clamp01(Math.abs(w));
    var kk = (typeof k === "number" && isFinite(k)) ? k : 2.2;
    var a = tanh(kk * a_raw);
    var s = tanh(kk * (2.0 * s_raw - 1.0));
    return { a: a, s: s, w: w, denom: denom, scale: scale, health: health };
  }

  // Latent stress driver: deterministic seed per vertex, then w = seed * sin(theta)
  function stressSeedForVertex(v3, presetMeta, mode) {
    if (mode === "fixed") {
      var fx = (presetMeta && typeof presetMeta.fixedPlaneX === "number") ? presetMeta.fixedPlaneX : 1.0;
      var d = Math.abs(fx - v3[0]);
      var p = 1.0 / (1.0 + 2.0 * d);
      return clamp(p, 0.0, 1.0);
    }
    if (mode === "corner") {
      var c = (presetMeta && presetMeta.corner) ? presetMeta.corner : [1, 1, 0];
      var d2 = dist3(v3, c);
      var p2 = 1.0 / (1.0 + 4.0 * d2);
      return clamp(p2, 0.0, 1.0);
    }
    return v3[0];
  }

  function modelForPreset(preset) {
    if (preset === "beam") return beamPreset();
    if (preset === "notch") return notchPreset();
    if (preset === "hole") return holePlatePreset();
    return cubePreset(0.9);
  }

  function hyperRotateMesh(preset, theta, alpha, k, stressMode) {
    var model = modelForPreset(preset);
    var v3 = model.verts3;
    var edges = model.edges;
    var meta = model.meta || {};

    var verts3 = [];
    var verts4 = [];
    var struct = [];

    for (var i = 0; i < v3.length; i++) {
      var v4 = lift3to4(v3[i]);
      var v4r;

      if (stressMode === "xw") {
        v4r = rotXW(v4, theta);
      } else {
        var seed = stressSeedForVertex(v3[i], meta, stressMode);
        var w = seed * Math.sin(theta);
        v4r = [v4[0], v4[1], v4[2], w];
      }

      var pr = project4to3(v4r, alpha);

      verts4.push(v4r);
      verts3.push(pr.p3);
      struct.push(structuralChannels(alpha, pr.w, pr.denom, pr.scale, k));
    }

    return { preset: preset, stressMode: stressMode, verts: verts3, edges: edges, verts4: verts4, struct: struct, meta: meta };
  }

  window.HYPER = {
    cubePreset: cubePreset,
    beamPreset: beamPreset,
    notchPreset: notchPreset,
    holePlatePreset: holePlatePreset,
    hyperRotateMesh: hyperRotateMesh
  };
})();
