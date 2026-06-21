/*
 * Interactive hero figure: domain coloring of the theta function with characteristics (0,0),
 *
 *     vartheta_00(z, tau) = sum_n  q^{n^2} e^{2 pi i n z},   q = e^{i pi tau},  Im(tau) > 0.
 *
 * The big canvas paints the complex z-plane (hue = argument of theta, brightness banded by
 * |theta|, so its zeros read as a lattice of colour singularities). The small canvas is a
 * picker for the modular parameter tau living in the upper half-plane H: drag it and the whole
 * portrait re-renders, so you can watch the zero lattice and quasi-periods move with tau.
 */
(function () {
  var view = document.querySelector('[data-theta-plot]');
  var pick = document.querySelector('[data-tau-pick]');
  if (!view || !view.getContext) return;

  var vctx = view.getContext('2d');
  var VW = view.width, VH = view.height;

  // offscreen buffer we paint pixel-by-pixel, then blit (scaled) onto the visible canvas
  var off = document.createElement('canvas');
  var octx = off.getContext('2d');

  // window onto the z-plane
  var X0 = -0.15, X1 = 2.75, Y0 = -0.82, Y1 = 0.82;
  var TWO_PI = Math.PI * 2, LOG2 = Math.log(2);

  // tau, constrained to the upper half-plane
  var tauR = 0.25, tauI = 0.62;
  var TAU_R_MIN = -0.8, TAU_R_MAX = 0.8, TAU_I_MIN = 0.12, TAU_I_MAX = 1.6;

  function hsv2rgb(h, s, v, out) {
    var i = Math.floor(h * 6), f = h * 6 - i;
    var p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), r, g, b;
    switch (((i % 6) + 6) % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      default: r = v; g = p; b = q; break;
    }
    out[0] = r * 255; out[1] = g * 255; out[2] = b * 255;
  }

  function computeInto(W, H, NMAX) {
    var nAmp = [], nPhase = [], n;
    for (n = -NMAX; n <= NMAX; n++) {
      nAmp[n + NMAX] = Math.exp(-Math.PI * tauI * n * n);
      nPhase[n + NMAX] = Math.PI * tauR * n * n;
    }
    var img = octx.createImageData(W, H), data = img.data, rgb = [0, 0, 0];
    for (var py = 0; py < H; py++) {
      var y = Y1 - (Y1 - Y0) * py / (H - 1);
      for (var px = 0; px < W; px++) {
        var x = X0 + (X1 - X0) * px / (W - 1);
        var re = 0, im = 0;
        for (var k = -NMAX; k <= NMAX; k++) {
          var amp = nAmp[k + NMAX] * Math.exp(-TWO_PI * k * y);
          var ang = nPhase[k + NMAX] + TWO_PI * k * x;
          re += amp * Math.cos(ang);
          im += amp * Math.sin(ang);
        }
        var mag = Math.sqrt(re * re + im * im);
        var hue = Math.atan2(im, re) / TWO_PI + 0.5;
        var band = (Math.log(mag + 1e-12) / LOG2);
        band -= Math.floor(band);
        var val = 0.55 + 0.4 * band;
        if (val > 1) val = 1;
        hsv2rgb(hue, 0.72, val, rgb);
        var o = (py * W + px) * 4;
        data[o] = rgb[0]; data[o + 1] = rgb[1]; data[o + 2] = rgb[2]; data[o + 3] = 255;
      }
    }
    off.width = W; off.height = H;
    octx.putImageData(img, 0, 0);
  }

  function renderPlot(quality) {
    var low = quality === 'low';
    var W = low ? Math.round(VW * 0.5) : VW;
    var H = low ? Math.round(VH * 0.5) : VH;
    computeInto(W, H, low ? 6 : 9);
    vctx.imageSmoothingEnabled = true;
    vctx.clearRect(0, 0, VW, VH);
    vctx.drawImage(off, 0, 0, VW, VH);
  }

  // ---- tau picker on the upper half-plane ----------------------------------
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  var pctx = pick && pick.getContext ? pick.getContext('2d') : null;
  var PAD = 12;

  function tauToXY() {
    if (!pick) return { x: 0, y: 0 };
    var x = PAD + (tauR - TAU_R_MIN) / (TAU_R_MAX - TAU_R_MIN) * (pick.width - 2 * PAD);
    var y = (pick.height - PAD) - (tauI - TAU_I_MIN) / (TAU_I_MAX - TAU_I_MIN) * (pick.height - 2 * PAD);
    return { x: x, y: y };
  }

  function xyToTau(px, py) {
    var r = TAU_R_MIN + (px - PAD) / (pick.width - 2 * PAD) * (TAU_R_MAX - TAU_R_MIN);
    var i = TAU_I_MIN + ((pick.height - PAD) - py) / (pick.height - 2 * PAD) * (TAU_I_MAX - TAU_I_MIN);
    tauR = Math.max(TAU_R_MIN, Math.min(TAU_R_MAX, r));
    tauI = Math.max(TAU_I_MIN, Math.min(TAU_I_MAX, i));
  }

  function fmt(v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2); }
  function readoutText() { return 'τ = ' + fmt(tauR) + ' + ' + Math.abs(tauI).toFixed(2) + 'i'; }

  function drawPicker() {
    if (!pctx) return;
    var w = pick.width, h = pick.height;
    var ink = cssVar('--ink', '#18222b');
    var rule = cssVar('--rule-strong', '#9fb0b7');
    var paper = cssVar('--paper-panel', '#fbfcfc');
    var accent = cssVar('--pen-blue', '#2f5b7e');
    pctx.clearRect(0, 0, w, h);
    pctx.fillStyle = paper; pctx.fillRect(0, 0, w, h);
    // faint grid
    pctx.strokeStyle = rule; pctx.globalAlpha = 0.35; pctx.lineWidth = 1;
    for (var gx = PAD; gx <= w - PAD + 0.1; gx += (w - 2 * PAD) / 4) {
      pctx.beginPath(); pctx.moveTo(gx, PAD); pctx.lineTo(gx, h - PAD); pctx.stroke();
    }
    for (var gy = PAD; gy <= h - PAD + 0.1; gy += (h - 2 * PAD) / 3) {
      pctx.beginPath(); pctx.moveTo(PAD, gy); pctx.lineTo(w - PAD, gy); pctx.stroke();
    }
    pctx.globalAlpha = 1;
    // SL(2,Z) fundamental domain: |Re tau| <= 1/2 and |tau| >= 1
    var RI = function (r, im) {
      return {
        x: PAD + (r - TAU_R_MIN) / (TAU_R_MAX - TAU_R_MIN) * (w - 2 * PAD),
        y: (h - PAD) - (im - TAU_I_MIN) / (TAU_I_MAX - TAU_I_MIN) * (h - 2 * PAD)
      };
    };
    var rr, pp, IM_TOP = TAU_I_MAX, corner = Math.sqrt(0.75); // |tau|=1 at Re=±1/2
    // shaded region (closed path; fill only, so there is no cap line on top)
    pctx.beginPath();
    pp = RI(-0.5, corner); pctx.moveTo(pp.x, pp.y);
    for (rr = -0.5; rr <= 0.5001; rr += 0.05) { pp = RI(rr, Math.sqrt(1 - rr * rr)); pctx.lineTo(pp.x, pp.y); }
    pp = RI(0.5, IM_TOP); pctx.lineTo(pp.x, pp.y);
    pp = RI(-0.5, IM_TOP); pctx.lineTo(pp.x, pp.y);
    pctx.closePath();
    pctx.fillStyle = accent; pctx.globalAlpha = 0.12; pctx.fill(); pctx.globalAlpha = 1;
    // boundary: unit-circle arc + the two vertical walls (no top cap)
    pctx.strokeStyle = accent; pctx.lineWidth = 1.3;
    pctx.beginPath();
    pp = RI(-0.5, corner); pctx.moveTo(pp.x, pp.y);
    for (rr = -0.5; rr <= 0.5001; rr += 0.05) { pp = RI(rr, Math.sqrt(1 - rr * rr)); pctx.lineTo(pp.x, pp.y); }
    pp = RI(-0.5, corner); var pt = RI(-0.5, IM_TOP); pctx.moveTo(pp.x, pp.y); pctx.lineTo(pt.x, pt.y);
    pp = RI(0.5, corner); pt = RI(0.5, IM_TOP); pctx.moveTo(pp.x, pp.y); pctx.lineTo(pt.x, pt.y);
    pctx.stroke();
    // i and rho corners
    pctx.fillStyle = accent;
    pp = RI(0, 1); pctx.beginPath(); pctx.arc(pp.x, pp.y, 1.6, 0, TWO_PI); pctx.fill();
    // real axis (Im = 0 is just below the frame) + Re = 0 line
    pctx.strokeStyle = ink; pctx.lineWidth = 1.4;
    pctx.beginPath(); pctx.moveTo(PAD, h - PAD); pctx.lineTo(w - PAD, h - PAD); pctx.stroke();
    var x0 = PAD + (0 - TAU_R_MIN) / (TAU_R_MAX - TAU_R_MIN) * (w - 2 * PAD);
    pctx.globalAlpha = 0.5; pctx.beginPath(); pctx.moveTo(x0, PAD); pctx.lineTo(x0, h - PAD); pctx.stroke();
    pctx.globalAlpha = 1;
    // tau handle
    var p = tauToXY();
    pctx.fillStyle = accent;
    pctx.beginPath(); pctx.arc(p.x, p.y, 5, 0, TWO_PI); pctx.fill();
    pctx.strokeStyle = paper; pctx.lineWidth = 1.5; pctx.stroke();
  }

  // ---- interaction ---------------------------------------------------------
  var settleTimer = null;
  function update(quality) {
    if (pick) {
      pick.setAttribute('aria-valuetext', readoutText());
      var ro = document.querySelector('[data-tau-readout]');
      if (ro) ro.textContent = readoutText();
    }
    drawPicker();
    renderPlot(quality);
  }

  function liveUpdate() {
    update('low');
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(function () { update('high'); }, 160);
  }

  if (pick && pctx) {
    var dragging = false;
    function pointFromEvent(e) {
      var rect = pick.getBoundingClientRect();
      var sx = pick.width / rect.width, sy = pick.height / rect.height;
      xyToTau((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy);
    }
    pick.addEventListener('pointerdown', function (e) {
      dragging = true; pick.setPointerCapture(e.pointerId);
      pointFromEvent(e); liveUpdate(); e.preventDefault();
    });
    pick.addEventListener('pointermove', function (e) {
      if (!dragging) return; pointFromEvent(e); liveUpdate();
    });
    function endDrag(e) {
      if (!dragging) return; dragging = false;
      try { pick.releasePointerCapture(e.pointerId); } catch (err) {}
      update('high');
    }
    pick.addEventListener('pointerup', endDrag);
    pick.addEventListener('pointercancel', endDrag);
    pick.addEventListener('keydown', function (e) {
      var sr = (TAU_R_MAX - TAU_R_MIN) / 40, si = (TAU_I_MAX - TAU_I_MIN) / 40, used = true;
      if (e.key === 'ArrowLeft') tauR = Math.max(TAU_R_MIN, tauR - sr);
      else if (e.key === 'ArrowRight') tauR = Math.min(TAU_R_MAX, tauR + sr);
      else if (e.key === 'ArrowUp') tauI = Math.min(TAU_I_MAX, tauI + si);
      else if (e.key === 'ArrowDown') tauI = Math.max(TAU_I_MIN, tauI - si);
      else used = false;
      if (used) { e.preventDefault(); liveUpdate(); }
    });
  }

  // recolour the picker chrome if the light/blueprint theme is toggled
  if (pick) {
    var obs = new MutationObserver(function () { drawPicker(); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  function init() { update('high'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
