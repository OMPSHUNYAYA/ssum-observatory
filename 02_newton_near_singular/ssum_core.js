// core/ssum_core.js
// Minimal SSUM core for the observatory.
// Plain ASCII formulas (conceptual):
//   x = (m, a, s)
//   phi((m,a,s)) = m
//   a = tanh(u_a), s = tanh(u_s)
//   u_a = atanh(a), u_s = atanh(s)

(function (global) {
  function clamp(x, eps) {
    var e = (eps == null) ? 1e-12 : eps;
    if (x >  1 - e) return  1 - e;
    if (x < -1 + e) return -1 + e;
    return x;
  }

  function atanh(x) {
    // atanh(x) = 0.5 * ln((1+x)/(1-x))
    var y = clamp(x, 1e-12);
    return 0.5 * Math.log((1 + y) / (1 - y));
  }

  function tanh(x) {
    // built-in Math.tanh exists; fallback for very old engines
    if (Math.tanh) return Math.tanh(x);
    var e2x = Math.exp(2 * x);
    return (e2x - 1) / (e2x + 1);
  }

  function make(m, a, s) {
    var aa = clamp((a == null) ? 0 : a, 1e-12);
    var ss = clamp((s == null) ? 0 : s, 1e-12);
    return { m: m, a: aa, s: ss };
  }

  function phi(x) { return x.m; }

  function band(a) {
    // Optional display bands (tune later)
    if (a >= +0.90) return "A++";
    if (a >= +0.60) return "A+";
    if (a >  -0.60) return "A0";
    if (a >  -0.90) return "A-";
    return "A--";
  }

  // A deterministic, bounded health update for alignment using progress ratio.
  // Inputs:
  //   u_prev: previous unbounded rapidity for alignment
  //   r: progress ratio in [0,1], where 1 is excellent progress, 0 is no progress
  // Update (plain ASCII):
  //   u_next = clamp_u( (1 - alpha)*u_prev + alpha * u_target )
  //   where u_target = gain * (2*r - 1)
  function update_alignment_u(u_prev, r, alpha, gain) {
    var a = (alpha == null) ? 0.35 : alpha;
    var g = (gain  == null) ? 2.20 : gain;
    var rr = Math.max(0, Math.min(1, r));
    var u_target = g * (2 * rr - 1); // maps r in [0,1] to [-g, +g]
    var u_next = (1 - a) * u_prev + a * u_target;
    // soft clamp in u-space (keeps a away from exact +/-1)
    var UMAX = 6.0;
    if (u_next >  UMAX) u_next =  UMAX;
    if (u_next < -UMAX) u_next = -UMAX;
    return u_next;
  }

  // A deterministic, bounded signature update based on normalized step magnitude.
  // Inputs:
  //   dx_norm: >= 0
  // Signature (plain ASCII):
  //   s = tanh( gain_s * dx_norm )
  // plus sign carry (direction of dx)
  function signature_from_step(dx, dx_scale, gain_s) {
    var scale = (dx_scale == null) ? 1.0 : dx_scale;
    var g = (gain_s == null) ? 1.40 : gain_s;
    var dn = Math.abs(dx) / Math.max(scale, 1e-12);
    var val = tanh(g * dn);
    return (dx >= 0) ? val : -val;
  }

  global.SSUM = {
    clamp: clamp,
    atanh: atanh,
    tanh: tanh,
    make: make,
    phi: phi,
    band: band,
    update_alignment_u: update_alignment_u,
    signature_from_step: signature_from_step
  };
})(window);
