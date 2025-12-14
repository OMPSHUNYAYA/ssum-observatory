(function () {
  "use strict";

  function cubeVertices(size) {
    var s = size;
    return [
      [-s, -s, -s],
      [+s, -s, -s],
      [+s, +s, -s],
      [-s, +s, -s],
      [-s, -s, +s],
      [+s, -s, +s],
      [+s, +s, +s],
      [-s, +s, +s]
    ];
  }

  function cubeEdges() {
    return [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
  }

  function lift3to4(v3) {
    return [v3[0], v3[1], v3[2], 0.0];
  }

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

  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }

  function tanh(x) {
    if (Math.tanh) return Math.tanh(x);
    var e2 = Math.exp(2 * x);
    return (e2 - 1) / (e2 + 1);
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

  function hyperRotateCube(size, theta, alpha, k) {
    var v3 = cubeVertices(size);
    var edges = cubeEdges();

    var verts3 = [];
    var verts4 = [];
    var struct = [];

    for (var i = 0; i < v3.length; i++) {
      var v4 = lift3to4(v3[i]);
      var v4r = rotXW(v4, theta);
      var pr = project4to3(v4r, alpha);
      verts4.push(v4r);
      verts3.push(pr.p3);
      struct.push(structuralChannels(alpha, pr.w, pr.denom, pr.scale, k));
    }

    return { verts: verts3, edges: edges, verts4: verts4, struct: struct };
  }

  window.HYPER = { cubeVertices: cubeVertices, cubeEdges: cubeEdges, hyperRotateCube: hyperRotateCube };
})();
