(() => {
'use strict';

const $ = (id) => document.getElementById(id);

const cv = $('cv');
const plotCv = $('plotCv');

const ctx = cv ? cv.getContext('2d') : null;
const pctx = plotCv ? plotCv.getContext('2d') : null;

let centers = [];
let activeMode = 'none';          // 'demo' | 'manual' | 'none'
let activeSource = '';
let activeFileName = '';

let view = { R: 10, s: 1, theta: 0, applyTheta: false };
let render = { scale: 1, cx: 0, cy: 0, R: 10, s: 1 };

const DEFAULTS = {
  R: 10,
  s: 1,
  theta: 0,
  applyTheta: false,
  plotMin: -30,
  plotMax: 30,
  plotSteps: 241,
  plotU: true
};

function setPill(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove('good', 'bad', 'warn');
  if (kind) el.classList.add(kind);
}

function setQuickStatus(text, kind) {
  setPill($('quickStatus'), text, kind);
}

function setActiveBadge() {
  const badge = $('activeBadge');
  if (!badge) return;

  if (activeMode === 'demo') {
    setPill(badge, `Active: Demo — ${activeSource || activeFileName || 'unknown'}`, 'warn');
  } else if (activeMode === 'manual') {
    setPill(badge, `Active: Manual — ${activeFileName || 'file'}`, 'warn');
  } else {
    setPill(badge, 'Active: none', 'warn');
  }
}

function setDemoButtons(which) {
  const a = $('btnDemoA');
  const b = $('btnDemoB');
  if (a) a.classList.remove('primary');
  if (b) b.classList.remove('primary');
  if (which === 'A' && a) a.classList.add('primary');
  if (which === 'B' && b) b.classList.add('primary');
}

function showManualPanel(on) {
  const panel = $('panelManual');
  if (!panel) return;
  if (on) panel.classList.remove('hidden');
  else panel.classList.add('hidden');
}

function pressedFeel() {
  const btns = Array.from(document.querySelectorAll('button.btn'));
  for (const b of btns) {
    const down = () => b.classList.add('pressed');
    const up = () => b.classList.remove('pressed');
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
  }
}

function resizeCanvases() {
  if (!cv || !plotCv || !ctx || !pctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const rect = cv.getBoundingClientRect();
  cv.width = Math.max(1, Math.floor(rect.width * dpr));
  cv.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const prect = plotCv.getBoundingClientRect();
  plotCv.width = Math.max(1, Math.floor(prect.width * dpr));
  plotCv.height = Math.max(1, Math.floor(prect.height * dpr));
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  computeRender();
  drawAll();
  computePlot();
}

function computeRender() {
  if (!cv) return;
  const w = cv.clientWidth || 600;
  const h = cv.clientHeight || 600;
  const R = Math.max(1e-12, view.R);
  const s = Math.max(1e-12, view.s);

  const margin = 0.08;
  const minDim = Math.max(1, Math.min(w, h));
  const scale = (minDim * (0.5 - margin)) / R;

  render.scale = scale;
  render.cx = w * 0.5;
  render.cy = h * 0.5;
  render.R = R;
  render.s = s;
}

function worldToScreen(x, y) {
  return [render.cx + x * render.scale, render.cy - y * render.scale];
}

function clearCanvas() {
  if (!ctx || !cv) return;
  ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
}

function drawCircle() {
  if (!ctx) return;
  const rp = render.R * render.scale;
  ctx.beginPath();
  ctx.arc(render.cx, render.cy, rp, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(231,238,252,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function rotatePt(x, y, thetaRad) {
  const c = Math.cos(thetaRad), s = Math.sin(thetaRad);
  return [c * x - s * y, s * x + c * y];
}

function effectiveCenters() {
  if (!view.applyTheta) return centers;
  const th = view.theta * Math.PI / 180;
  const out = new Array(centers.length);
  for (let i = 0; i < centers.length; i++) {
    const p = centers[i];
    const r = rotatePt(p[0], p[1], th);
    out[i] = [r[0], r[1]];
  }
  return out;
}

function drawSquares() {
  if (!ctx) return;
  const pts = effectiveCenters();
  const half = render.s * 0.5;
  const size = render.s * render.scale;

  ctx.strokeStyle = 'rgba(103,166,255,0.55)';
  ctx.lineWidth = 1;

  for (let i = 0; i < pts.length; i++) {
    const x = pts[i][0], y = pts[i][1];
    const p = worldToScreen(x - half, y + half);
    ctx.strokeRect(p[0], p[1], size, size);
  }
}

function drawAll() {
  clearCanvas();
  drawCircle();
  if (centers.length) drawSquares();
}

function parseCSVText(txt) {
  const lines = txt.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) continue;
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    out.push([a, b]);
  }
  return out;
}

function clearVerify() {
  const out = $('verifyOut');
  if (out) out.textContent = '';
  setQuickStatus('Not verified', 'warn');
}

function readInputs() {
  const R = parseFloat($('inpR') ? $('inpR').value : String(DEFAULTS.R));
  const s = parseFloat($('inps') ? $('inps').value : String(DEFAULTS.s));
  const theta = parseFloat($('inpTheta') ? $('inpTheta').value : String(DEFAULTS.theta));

  view.R = Number.isFinite(R) ? R : DEFAULTS.R;
  view.s = Number.isFinite(s) ? s : DEFAULTS.s;
  view.theta = Number.isFinite(theta) ? theta : DEFAULTS.theta;
  view.applyTheta = !!($('chkApplyTheta') && $('chkApplyTheta').checked);

  computeRender();
  drawAll();
  computePlot();
}

function hardResetDefaults() {
  if ($('inpR')) $('inpR').value = String(DEFAULTS.R);
  if ($('inps')) $('inps').value = String(DEFAULTS.s);
  if ($('inpTheta')) $('inpTheta').value = String(DEFAULTS.theta);
  if ($('chkApplyTheta')) $('chkApplyTheta').checked = !!DEFAULTS.applyTheta;

  if ($('inpPlotMin')) $('inpPlotMin').value = String(DEFAULTS.plotMin);
  if ($('inpPlotMax')) $('inpPlotMax').value = String(DEFAULTS.plotMax);
  if ($('inpPlotSteps')) $('inpPlotSteps').value = String(DEFAULTS.plotSteps);
  if ($('chkPlotU')) $('chkPlotU').checked = !!DEFAULTS.plotU;
}

function applyDemoDefaults(which) {
  hardResetDefaults();

  if (which === 'B') {
    if ($('inpTheta')) $('inpTheta').value = '19.6875';
    if ($('chkApplyTheta')) $('chkApplyTheta').checked = false;
  } else {
    if ($('inpTheta')) $('inpTheta').value = '0';
    if ($('chkApplyTheta')) $('chkApplyTheta').checked = false;
  }
}

function cornersForSquare(cx, cy, half) {
  return [
    [cx - half, cy - half],
    [cx - half, cy + half],
    [cx + half, cy - half],
    [cx + half, cy + half]
  ];
}

function fmt(x, d = 6) {
  if (!Number.isFinite(x)) return 'nan';
  return x.toFixed(d);
}

function fmtExp(x) {
  if (!Number.isFinite(x)) return 'nan';
  return x.toExponential(6);
}

async function loadDemo(path, which) {
  activeMode = 'demo';
  activeSource = path;
  activeFileName = path;

  showManualPanel(false);

  const fileInput = $('fileInput');
  if (fileInput) fileInput.value = '';

  setDemoButtons(which);

  setPill($('demoStatus'), `Demo: loaded — ${path}`, 'good');
  setPill($('manualStatus'), 'Manual: no file', 'warn');
  setActiveBadge();

  applyDemoDefaults(which);
  readInputs();
  clearVerify();
  setQuickStatus('Loaded (defaults applied)', 'warn');

  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch failed');
  const txt = await res.text();
  centers = parseCSVText(txt);

  computeRender();
  drawAll();
  computePlot();
  clearVerify();
  setQuickStatus('Loaded (not verified)', 'warn');
}

function enterManualMode() {
  activeMode = 'manual';
  activeSource = 'manual';
  activeFileName = '';

  showManualPanel(true);

  setDemoButtons('none');
  setPill($('demoStatus'), 'Demo: not loaded', 'warn');
  setPill($('manualStatus'), 'Manual: no file', 'warn');
  setActiveBadge();

  hardResetDefaults();
  readInputs();
  clearVerify();
  setQuickStatus('Manual mode (defaults applied)', 'warn');
}

function loadManualFile(file) {
  activeMode = 'manual';
  activeSource = 'manual';
  activeFileName = file ? file.name : '';

  showManualPanel(true);

  setDemoButtons('none');
  setPill($('demoStatus'), 'Demo: not loaded', 'warn');
  setPill($('manualStatus'), activeFileName ? `Manual: loaded — ${activeFileName}` : 'Manual: no file', activeFileName ? 'good' : 'warn');
  setActiveBadge();

  hardResetDefaults();
  readInputs();
  clearVerify();
  setQuickStatus('Manual mode (defaults applied)', 'warn');
}

function verify() {
  readInputs();

  const R = view.R;
  const s = view.s;
  const pts = effectiveCenters();
  const half = s * 0.5;
  const R2 = R * R;

  let bad = 0;
  let worst = -Infinity;
  let maxR2 = 0;
  let inside = 0;

  for (let i = 0; i < pts.length; i++) {
    const cx0 = pts[i][0], cy0 = pts[i][1];
    const corners = cornersForSquare(cx0, cy0, half);
    let ok = true;

    for (let k = 0; k < 4; k++) {
      const x = corners[k][0], y = corners[k][1];
      const rr = x * x + y * y;
      const v = rr - R2;

      if (v > 0) { bad++; ok = false; }
      if (v > worst) worst = v;
      if (rr > maxR2) maxR2 = rr;
    }

    if (ok) inside++;
  }

  const total = pts.length;
  const outside = total - inside;
  const frac = total ? (inside * 100 / total) : 0;

  const U = (total * s * s) / (Math.PI * R2);
  const Uin = (inside * s * s) / (Math.PI * R2);

  const Rmin = Math.sqrt(maxR2);
  const apply = view.applyTheta ? 1 : 0;

  const src = (activeMode === 'demo')
    ? (activeSource || 'demo')
    : (activeFileName || 'manual');

  const modeOut = (activeMode === 'manual') ? 'manual' : 'demo';

  const out = [];
  out.push('VERIFY (strict 4-corner inside-circle)');
  out.push(`source=${src}`);
  out.push(`mode=${modeOut}`);
  out.push(`R=${fmt(R)}  s=${fmt(s)}`);
  out.push(`theta_deg=${fmt(view.theta)}  apply_theta=${apply}`);
  out.push(`N_total=${total}`);
  out.push(`N_inside=${inside}`);
  out.push(`N_outside=${outside}`);
  out.push(`inside_fraction_percent=${fmt(frac, 2)}`);
  out.push(`U=(N*s^2)/(pi*R^2)=${fmt(U, 6)}`);
  out.push(`U_inside=(N_inside*s^2)/(pi*R^2)=${fmt(Uin, 6)}`);
  out.push(`bad_corners=${bad}`);
  out.push(`worst_margin=max(|p|^2 - R^2)=${fmtExp(worst)}`);
  out.push(`R_min_needed=${fmt(Rmin, 6)}`);
  out.push(bad === 0 ? 'PASS' : 'FAIL');
  out.push('NOTE: PASS/FAIL is a certification result for the currently loaded dataset under the currently displayed parameters.');

  const outEl = $('verifyOut');
  if (outEl) outEl.textContent = out.join('\n');

  setQuickStatus(bad === 0 ? 'Verified: PASS' : 'Verified: FAIL', bad === 0 ? 'good' : 'bad');
}

function computePlot() {
  if (!plotCv || !pctx) return;
  const outEl = $('plotOut');

  const stepsEl = $('inpPlotSteps');
  const minEl = $('inpPlotMin');
  const maxEl = $('inpPlotMax');
  const chkU = $('chkPlotU');

  if (!stepsEl || !minEl || !maxEl || !chkU) {
    if (outEl) outEl.textContent = '';
    pctx.clearRect(0, 0, plotCv.clientWidth, plotCv.clientHeight);
    return;
  }

  const tMin = parseFloat(minEl.value);
  const tMax = parseFloat(maxEl.value);
  const steps = Math.max(2, Math.floor(parseFloat(stepsEl.value) || DEFAULTS.plotSteps));
  const plotU = !!chkU.checked;

  const w = plotCv.clientWidth || 600;
  const h = plotCv.clientHeight || 220;

  pctx.clearRect(0, 0, w, h);

  if (!centers.length) {
    if (outEl) outEl.textContent = '';
    return;
  }

  const R = Math.max(1e-12, view.R);
  const s = Math.max(1e-12, view.s);

  let minY = Infinity, maxY = -Infinity;
  const ys = new Array(steps);

  for (let i = 0; i < steps; i++) {
    const t = tMin + (tMax - tMin) * (i / (steps - 1));
    const th = t * Math.PI / 180;

    const c = Math.cos(th), sn = Math.sin(th);

    let inside = 0;
    const half = s * 0.5;
    const R2 = R * R;

    for (let j = 0; j < centers.length; j++) {
      const p = centers[j];
      const cx0 = c * p[0] - sn * p[1];
      const cy0 = sn * p[0] + c * p[1];

      const corners = cornersForSquare(cx0, cy0, half);
      let ok = true;
      for (let k = 0; k < 4; k++) {
        const x = corners[k][0], y = corners[k][1];
        if (x * x + y * y > R2) { ok = false; break; }
      }
      if (ok) inside++;
    }

    const y = plotU
      ? (inside * s * s) / (Math.PI * R2)
      : inside;

    ys[i] = y;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return;
  if (maxY === minY) { maxY = minY + 1; }

  const pad = 18;
  const x0 = pad, y0 = pad, x1 = w - pad, y1 = h - pad;

  pctx.strokeStyle = 'rgba(231,238,252,0.18)';
  pctx.lineWidth = 1;
  pctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

  pctx.strokeStyle = 'rgba(103,166,255,0.85)';
  pctx.lineWidth = 2;
  pctx.beginPath();

  for (let i = 0; i < steps; i++) {
    const x = x0 + (x1 - x0) * (i / (steps - 1));
    const yn = (ys[i] - minY) / (maxY - minY);
    const y = y1 - yn * (y1 - y0);
    if (i === 0) pctx.moveTo(x, y);
    else pctx.lineTo(x, y);
  }
  pctx.stroke();

  if (outEl) {
    const label = plotU ? 'U_inside' : 'N_inside';
    outEl.textContent = `Plot: ${label} over theta in [${fmt(tMin, 2)}, ${fmt(tMax, 2)}], steps=${steps}`;
  }
}

function doResetUI() {
  hardResetDefaults();
  readInputs();
  clearVerify();
}

function init() {
  pressedFeel();

  window.addEventListener('resize', resizeCanvases);

  const btnA = $('btnDemoA');
  const btnB = $('btnDemoB');
  const btnM = $('btnManualMode');

  if (btnA) {
    btnA.addEventListener('click', async () => {
      try {
        await loadDemo('axis_packing.csv', 'A');
      } catch (e) {
        setQuickStatus('Load failed', 'bad');
      }
    });
  }

  if (btnB) {
    btnB.addEventListener('click', async () => {
      try {
        await loadDemo('rotated_packing.csv', 'B');
      } catch (e) {
        setQuickStatus('Load failed', 'bad');
      }
    });
  }

  if (btnM) {
    btnM.addEventListener('click', () => {
      enterManualMode();
    });
  }

  const fileInput = $('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) {
        centers = [];
        loadManualFile(null);
        drawAll();
        computePlot();
        clearVerify();
        return;
      }

      loadManualFile(f);

      const reader = new FileReader();
      reader.onload = () => {
        centers = parseCSVText(String(reader.result || ''));
        computeRender();
        drawAll();
        computePlot();
        clearVerify();
        setQuickStatus('Loaded (not verified)', 'warn');
      };
      reader.onerror = () => {
        setQuickStatus('Manual read failed', 'bad');
      };
      reader.readAsText(f);
    });
  }

  const btnVerify = $('btnVerify');
  if (btnVerify) btnVerify.addEventListener('click', verify);

  const btnFit = $('btnFit');
  if (btnFit) btnFit.addEventListener('click', () => { readInputs(); });

  const btnReset = $('btnReset');
  const btnResetTop = $('btnResetTop');
  if (btnReset) btnReset.addEventListener('click', doResetUI);
  if (btnResetTop) btnResetTop.addEventListener('click', doResetUI);

  const btnRec = $('btnRecommended');
  if (btnRec) {
    btnRec.addEventListener('click', () => {
      if ($('inpTheta')) $('inpTheta').value = '0';
      if ($('chkApplyTheta')) $('chkApplyTheta').checked = false;
      readInputs();
      clearVerify();
    });
  }

  const inpR = $('inpR');
  const inps = $('inps');
  const inpTheta = $('inpTheta');
  const chkTheta = $('chkApplyTheta');

  if (inpR) inpR.addEventListener('input', () => { readInputs(); clearVerify(); });
  if (inps) inps.addEventListener('input', () => { readInputs(); clearVerify(); });
  if (inpTheta) inpTheta.addEventListener('input', () => { readInputs(); clearVerify(); });
  if (chkTheta) chkTheta.addEventListener('change', () => { readInputs(); clearVerify(); });

  const pMin = $('inpPlotMin');
  const pMax = $('inpPlotMax');
  const pSteps = $('inpPlotSteps');
  const chkU = $('chkPlotU');

  if (pMin) pMin.addEventListener('input', computePlot);
  if (pMax) pMax.addEventListener('input', computePlot);
  if (pSteps) pSteps.addEventListener('input', computePlot);
  if (chkU) chkU.addEventListener('change', computePlot);

  resizeCanvases();

  setActiveBadge();
  showManualPanel(false);

  loadDemo('axis_packing.csv', 'A').catch(() => {
    setQuickStatus('Not loaded', 'warn');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
