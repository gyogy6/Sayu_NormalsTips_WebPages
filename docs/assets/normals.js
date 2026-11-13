/* Interactive figures for the normals tips.
 * Plain JavaScript + Canvas, no libraries.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------ vectors --
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const rad = (d) => d * Math.PI / 180;

  // ------------------------------------------------------------- meshes --
  function uvSphere(seg, rings) {
    const P = [[0, 1, 0]];
    for (let r = 1; r < rings; r++) {
      const phi = Math.PI * r / rings;
      for (let s = 0; s < seg; s++) {
        const th = 2 * Math.PI * s / seg;
        P.push([Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)]);
      }
    }
    P.push([0, -1, 0]);
    const bottom = P.length - 1;
    const idx = (r, s) => 1 + (r - 1) * seg + (((s % seg) + seg) % seg);
    const T = [];
    for (let s = 0; s < seg; s++) T.push([0, idx(1, s + 1), idx(1, s)]);
    for (let r = 1; r < rings - 1; r++) {
      for (let s = 0; s < seg; s++) {
        const a = idx(r, s), b = idx(r, s + 1), c = idx(r + 1, s + 1), d = idx(r + 1, s);
        T.push([a, b, c], [a, c, d]);
      }
    }
    for (let s = 0; s < seg; s++) T.push([bottom, idx(rings - 1, s), idx(rings - 1, s + 1)]);
    return { P, T };
  }

  function cylinder(seg, h) {
    const P = [];
    for (let s = 0; s < seg; s++) {
      const th = 2 * Math.PI * s / seg;
      P.push([Math.cos(th), h, Math.sin(th)]);
    }
    for (let s = 0; s < seg; s++) P.push([P[s][0], -h, P[s][2]]);
    const T = [];
    for (let s = 0; s < seg; s++) {
      const a = s, b = (s + 1) % seg, c = seg + b, d = seg + a;
      T.push([a, b, c], [a, c, d]);
    }
    // caps: a fan from one rim vertex (uneven on purpose, see chapter 3)
    for (let s = 1; s < seg - 1; s++) {
      T.push([0, s + 1, s]);
      T.push([seg, seg + s, seg + s + 1]);
    }
    return { P, T };
  }

  function bevelBox(b) {
    const P = [], key = new Map(), T = [];
    const v = (sx, sy, sz, axis) => {
      const k = sx + "," + sy + "," + sz + "," + axis;
      if (!key.has(k)) {
        const p = [sx * (1 - b), sy * (1 - b), sz * (1 - b)];
        p[axis] = [sx, sy, sz][axis];
        key.set(k, P.length);
        P.push(p);
      }
      return key.get(k);
    };
    const quad = (a, b_, c, d) => { T.push([a, b_, c], [a, c, d]); };
    const signs = [-1, 1];
    const others = (axis) => [0, 1, 2].filter((x) => x !== axis);
    for (let axis = 0; axis < 3; axis++) {
      const [u, w] = others(axis);
      for (const s of signs) {
        const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([su, sw]) => {
          const c = [0, 0, 0]; c[axis] = s; c[u] = su; c[w] = sw;
          return v(c[0], c[1], c[2], axis);
        });
        quad(cs[0], cs[1], cs[2], cs[3]);
      }
    }
    for (let axis = 0; axis < 3; axis++) {
      const [u, w] = others(axis);
      for (const su of signs) for (const sw of signs) {
        const c0 = [0, 0, 0], c1 = [0, 0, 0];
        c0[axis] = -1; c0[u] = su; c0[w] = sw;
        c1[axis] = 1; c1[u] = su; c1[w] = sw;
        quad(v(...c0, u), v(...c1, u), v(...c1, w), v(...c0, w));
      }
    }
    for (const sx of signs) for (const sy of signs) for (const sz of signs) {
      T.push([v(sx, sy, sz, 0), v(sx, sy, sz, 1), v(sx, sy, sz, 2)]);
    }
    fixWinding(P, T);
    return { P, T };
  }

  function fixWinding(P, T) {
    for (const t of T) {
      const n = cross(sub(P[t[1]], P[t[0]]), sub(P[t[2]], P[t[0]]));
      const c = add(add(P[t[0]], P[t[1]]), P[t[2]]);
      if (dot(n, c) < 0) { const x = t[1]; t[1] = t[2]; t[2] = x; }
    }
  }

  // ------------------------------------------------- chapters 4 to 6 ----
  /** UV sphere whose first column of vertices is duplicated (a seam). */
  function seamSphere(seg, rings) {
    const P = [[0, 1, 0]];
    for (let r = 1; r < rings; r++) {
      const phi = Math.PI * r / rings;
      for (let s = 0; s <= seg; s++) {
        const th = 2 * Math.PI * s / seg;
        P.push([Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)]);
      }
    }
    P.push([0, -1, 0]);
    const bottom = P.length - 1;
    const idx = (r, s) => 1 + (r - 1) * (seg + 1) + s;
    const T = [];
    for (let s = 0; s < seg; s++) T.push([0, idx(1, s + 1), idx(1, s)]);
    for (let r = 1; r < rings - 1; r++) {
      for (let s = 0; s < seg; s++) {
        const a = idx(r, s), b = idx(r, s + 1), c = idx(r + 1, s + 1), d = idx(r + 1, s);
        T.push([a, b, c], [a, c, d]);
      }
    }
    for (let s = 0; s < seg; s++) T.push([bottom, idx(rings - 1, s), idx(rings - 1, s + 1)]);
    return { P, T };
  }

  /** Same triangles, but vertices at the same position share one index. */
  function weld(mesh) {
    const keys = new Map();
    const remap = mesh.P.map((p, i) => {
      const k = p.map((x) => Math.round(x * 1e5)).join(",");
      if (!keys.has(k)) keys.set(k, i);
      return keys.get(k);
    });
    return { P: mesh.P, T: mesh.T.map((t) => t.map((i) => remap[i])) };
  }

  function bump(p) {
    const [x, y, z] = p;
    return 0.5 * Math.sin(3.1 * x + 0.7) * Math.sin(2.3 * y + 1.1) * Math.sin(2.7 * z + 0.3)
      + 0.3 * Math.sin(5.3 * x + 4.1 * y + 0.2)
      + 0.2 * Math.sin(6.1 * z - 3.7 * y + 1.3);
  }

  function lumpySphere(seg, rings, amp) {
    const m = uvSphere(seg, rings);
    return { P: m.P.map((p) => mul(p, 1 + amp * bump(p))), T: m.T };
  }

  function blend(a, b, w) {
    return norm([a[0] * (1 - w) + b[0] * w, a[1] * (1 - w) + b[1] * w, a[2] * (1 - w) + b[2] * w]);
  }

  /** A sphere made of two separate meshes (fine upper, coarse lower). */
  function splitSphere(seg, seamDeg, upperRings, lowerRings) {
    const seam = rad(seamDeg);
    const P = [], T = [], boundary = [];
    const ring = (phi, isSeam) => {
      const start = P.length;
      for (let s = 0; s < seg; s++) {
        const th = 2 * Math.PI * s / seg;
        P.push([Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)]);
        boundary.push(isSeam);
      }
      return start;
    };
    const strip = (a, b) => {
      for (let s = 0; s < seg; s++) {
        const s1 = (s + 1) % seg;
        T.push([a + s, a + s1, b + s1], [a + s, b + s1, b + s]);
      }
    };
    P.push([0, 1, 0]); boundary.push(false);
    let rows = [];
    for (let r = 1; r <= upperRings; r++) rows.push(ring(seam * r / upperRings, r === upperRings));
    for (let s = 0; s < seg; s++) T.push([0, rows[0] + (s + 1) % seg, rows[0] + s]);
    for (let i = 0; i + 1 < rows.length; i++) strip(rows[i], rows[i + 1]);
    rows = [];
    for (let r = 0; r < lowerRings; r++) rows.push(ring(seam + (Math.PI - seam) * r / lowerRings, r === 0));
    for (let i = 0; i + 1 < rows.length; i++) strip(rows[i], rows[i + 1]);
    const south = P.length;
    P.push([0, -1, 0]); boundary.push(false);
    const last = rows[rows.length - 1];
    for (let s = 0; s < seg; s++) T.push([south, last + s, last + (s + 1) % seg]);
    fixWinding(P, T);
    return { P, T, boundary };
  }

  /** separate | boundary | transfer (blend toward a smooth sphere near the seam) */
  function seamFix(mesh, mode, radius, falloff) {
    const own = cornerNormals(mesh, "smooth", "angle");
    if (mode === "separate") return own;
    if (mode === "boundary") {
      const joined = cornerNormals(weld(mesh), "smooth", "angle");
      return mesh.T.map((t, f) => t.map((vi, k) => (mesh.boundary[vi] ? joined[f][k] : own[f][k])));
    }
    const seamPts = mesh.P.filter((_, i) => mesh.boundary[i]);
    const d = mesh.P.map((p) => Math.min(...seamPts.map((q) => len(sub(p, q)))));
    const w = d.map((x) => {
      if (radius <= 0) return x < 1e-9 ? 1 : 0;
      if (!falloff) return x <= radius ? 1 : 0;
      const t = Math.min(1, x / radius);
      return 1 - t * t * (3 - 2 * t);
    });
    return mesh.T.map((t, f) => t.map((vi, k) => blend(own[f][k], norm(mesh.P[vi]), w[vi])));
  }

  /** Tangent-space normal map from a bump pattern on a UV sphere
   *  (same as bump_map in normals_lib.py). */
  function bumpMap(strength, flipGreen) {
    return (pm, nb) => {
      const p = norm(pm);
      const u = Math.atan2(p[2], p[0]) / (2 * Math.PI);
      const v = Math.acos(Math.max(-1, Math.min(1, p[1]))) / Math.PI;
      const du = 2 * Math.PI * 8 * Math.cos(2 * Math.PI * 8 * u) * Math.sin(2 * Math.PI * 5 * v);
      const dv = 2 * Math.PI * 5 * Math.sin(2 * Math.PI * 8 * u) * Math.cos(2 * Math.PI * 5 * v);
      const x = -strength * du / 50;
      const y = -strength * dv / 50 * (flipGreen ? -1 : 1);
      let tg = [-p[2], 0, p[0]];
      tg = sub(tg, mul(nb, dot(tg, nb)));
      tg = len(tg) > 1e-9 ? norm(tg) : [1, 0, 0];
      const bt = cross(nb, tg);
      return norm(add(add(mul(tg, x), mul(bt, y)), nb));
    };
  }

  // ------------------------------------------------------------ normals --
  function faceNormals(P, T) {
    const N = [], A = [];
    for (const t of T) {
      const c = cross(sub(P[t[1]], P[t[0]]), sub(P[t[2]], P[t[0]]));
      const l = len(c);
      N.push(mul(c, 1 / l));
      A.push(l * 0.5);
    }
    return { N, A };
  }

  function cornerAngle(P, t, k) {
    const a = P[t[k]], b = P[t[(k + 1) % 3]], c = P[t[(k + 2) % 3]];
    const e1 = sub(b, a), e2 = sub(c, a);
    const cv = dot(e1, e2) / (len(e1) * len(e2));
    return Math.acos(Math.max(-1, Math.min(1, cv)));
  }

  /** Normal for each triangle corner: CN[f][k] = [x,y,z]
   *  mode: "flat" | "smooth"; weight: "uniform" | "area" | "angle"
   *  angleDeg: faces whose normals differ more than this are not mixed. */
  function cornerNormals(mesh, mode, weight, angleDeg) {
    const { P, T } = mesh;
    const { N: FN, A } = faceNormals(P, T);
    if (mode === "flat") return T.map((_, f) => [FN[f], FN[f], FN[f]]);
    const W = T.map((t, f) => [0, 1, 2].map((k) =>
      weight === "uniform" ? 1 : weight === "area" ? A[f] : cornerAngle(P, t, k)));
    const around = P.map(() => []);
    T.forEach((t, f) => t.forEach((vi, k) => around[vi].push([f, k])));
    const cosLim = Math.cos(rad(angleDeg == null ? 180 : angleDeg)) - 1e-6;
    return T.map((t, f) => t.map((vi) => {
      let acc = [0, 0, 0];
      for (const [g, j] of around[vi]) {
        if (dot(FN[f], FN[g]) >= cosLim) acc = add(acc, mul(FN[g], W[g][j]));
      }
      return norm(acc);
    }));
  }

  // ---------------------------------------------------------- rendering --
  const LIT = [0.96, 0.93, 0.88];
  const SHADE = [0.55, 0.50, 0.62];

  function shadeColor(n, L, toon, soft) {
    const d = dot(n, L);
    if (toon != null) {
      let t = d > toon ? 1 : 0;
      if (soft > 0) {
        t = Math.max(0, Math.min(1, (d - (toon - soft)) / (2 * soft)));
        t = t * t * (3 - 2 * t);
      }
      return [SHADE[0] + (LIT[0] - SHADE[0]) * t, SHADE[1] + (LIT[1] - SHADE[1]) * t, SHADE[2] + (LIT[2] - SHADE[2]) * t];
    }
    const t = 0.12 + 0.88 * Math.max(0, Math.min(1, d));
    const base = mul(SHADE, 0.25);
    return [base[0] + (LIT[0] - base[0]) * t, base[1] + (LIT[1] - base[1]) * t, base[2] + (LIT[2] - base[2]) * t];
  }

  function rotMat(yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // Rx(pitch) * Ry(yaw)
    return [
      [cy, 0, sy],
      [sp * sy, cp, -sp * cy],
      [-cp * sy, sp, cp * cy],
    ];
  }
  const apply = (M, v) => [dot(M[0], v), dot(M[1], v), dot(M[2], v)];

  function lightDir(azDeg, elDeg) {
    const az = rad(azDeg), el = rad(elDeg);
    return [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
  }

  function bgColor() {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg").trim() || "#ffffff";
    const m = c.match(/^#([0-9a-f]{6})$/i);
    if (!m) return [255, 255, 255];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /** Draws the mesh into the canvas. Returns screen data for overlays. */
  function render(canvas, mesh, CN, R, L, opt) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const scale = opt.scale || 0.62;
    const img = ctx.createImageData(W, H);
    const bg = bgColor();
    for (let i = 0; i < W * H; i++) {
      img.data[i * 4] = bg[0]; img.data[i * 4 + 1] = bg[1]; img.data[i * 4 + 2] = bg[2]; img.data[i * 4 + 3] = 255;
    }
    const z = new Float32Array(W * H).fill(-Infinity);
    const Pv = mesh.P.map((p) => apply(R, p));
    const S = Pv.map((p) => [(p[0] * scale + 1) * 0.5 * W, (1 - (p[1] * scale + 1) * 0.5) * H]);
    mesh.T.forEach((t, f) => {
      const [a, b, c] = t;
      const x0 = S[a][0], y0 = S[a][1], x1 = S[b][0], y1 = S[b][1], x2 = S[c][0], y2 = S[c][1];
      const den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
      if (Math.abs(den) < 1e-9) return;
      const n0 = apply(R, CN[f][0]), n1 = apply(R, CN[f][1]), n2 = apply(R, CN[f][2]);
      const xmin = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
      const xmax = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
      const ymin = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
      const ymax = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
      for (let y = ymin; y <= ymax; y++) {
        const py = y + 0.5;
        for (let x = xmin; x <= xmax; x++) {
          const px = x + 0.5;
          const w0 = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) / den;
          const w1 = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) / den;
          const w2 = 1 - w0 - w1;
          if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
          const zz = w0 * Pv[a][2] + w1 * Pv[b][2] + w2 * Pv[c][2];
          const i = y * W + x;
          if (zz <= z[i]) continue;
          z[i] = zz;
          const n = opt.nmap ? apply(R, opt.nmap(
            add(add(mul(mesh.P[a], w0), mul(mesh.P[b], w1)), mul(mesh.P[c], w2)),
            norm(add(add(mul(CN[f][0], w0), mul(CN[f][1], w1)), mul(CN[f][2], w2))))) : norm([
            w0 * n0[0] + w1 * n1[0] + w2 * n2[0],
            w0 * n0[1] + w1 * n1[1] + w2 * n2[1],
            w0 * n0[2] + w1 * n1[2] + w2 * n2[2],
          ]);
          const col = shadeColor(n, L, opt.toon, opt.soft || 0);
          img.data[i * 4] = col[0] * 255;
          img.data[i * 4 + 1] = col[1] * 255;
          img.data[i * 4 + 2] = col[2] * 255;
        }
      }
    });
    ctx.putImageData(img, 0, 0);

    if (opt.showNormals) {
      ctx.lineWidth = Math.max(1, W / 300);
      ctx.strokeStyle = "rgba(42,111,219,0.9)";
      const len3 = 0.25;
      const seen = new Set();
      mesh.T.forEach((t, f) => t.forEach((vi, k) => {
        const nv = apply(R, CN[f][k]);
        const key = vi + ":" + nv.map((x) => x.toFixed(3)).join(",");
        if (seen.has(key)) return;
        seen.add(key);
        const p = Pv[vi];
        const sx = Math.floor(S[vi][0]), sy = Math.floor(S[vi][1]);
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
        if (p[2] < z[sy * W + sx] - 0.03) return; // hidden
        if (nv[2] < -0.2) return;
        const q = add(p, mul(nv, len3));
        ctx.beginPath();
        ctx.moveTo(S[vi][0], S[vi][1]);
        ctx.lineTo((q[0] * scale + 1) * 0.5 * W, (1 - (q[1] * scale + 1) * 0.5) * H);
        ctx.stroke();
      }));
    }
  }

  // -------------------------------------------------------------- helpers --
  const $ = (id) => document.getElementById(id);
  const val = (id, d) => { const e = $(id); return e ? parseFloat(e.value) : d; };
  const checked = (id) => { const e = $(id); return !!(e && e.checked); };
  const radio = (name, d) => { const e = document.querySelector('input[name="' + name + '"]:checked'); return e ? e.value : d; };
  function out(id, text) { const e = $(id); if (e) e.textContent = text; }
  function onAnyInput(root, fn) {
    root.addEventListener("input", fn);
    root.addEventListener("change", fn);
  }
  function fitCanvas(canvas, base) {
    // draw at device resolution but keep the cost small
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.round(base * dpr);
    if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
  }

  // ------------------------------------------------------- chapter 1 demo --
  function ch01() {
    const diag = $("diagram"), sph = $("sphere"), sphT = $("sphereToon");
    const root = $("demo");

    function css(name, d) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || d;
    }

    function drawArrow(ctx, x0, y0, x1, y1, color, w) {
      const a = Math.atan2(y1 - y0, x1 - x0), h = 10 + w * 2;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * h * 0.6, y1 - Math.sin(a) * h * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - h * Math.cos(a - 0.4), y1 - h * Math.sin(a - 0.4));
      ctx.lineTo(x1 - h * Math.cos(a + 0.4), y1 - h * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill();
    }

    function sphereRender(canvas, L, toon) {
      const ctx = canvas.getContext("2d");
      const W = canvas.width, H = canvas.height;
      const img = ctx.createImageData(W, H);
      const bg = bgColor();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const nx = ((x + 0.5) / W * 2 - 1) / 0.85, ny = (1 - (y + 0.5) / H * 2) / 0.85;
        const r2 = nx * nx + ny * ny;
        let c;
        if (r2 > 1) c = [bg[0] / 255, bg[1] / 255, bg[2] / 255];
        else c = shadeColor([nx, ny, Math.sqrt(1 - r2)], L, toon);
        img.data[i] = c[0] * 255; img.data[i + 1] = c[1] * 255; img.data[i + 2] = c[2] * 255; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }

    function draw() {
      fitCanvas(diag, 300); fitCanvas(sph, 200); fitCanvas(sphT, 200);
      const tilt = val("tilt", 0), light = val("light", 40), t = val("toonT", 0.3);
      const theta = light - tilt;
      const nl = Math.cos(rad(theta));
      out("tiltOut", tilt + "°"); out("lightOut", light + "°"); out("toonTOut", t.toFixed(2));
      out("thetaOut", ((theta + 540) % 360 - 180).toFixed(0) + "°");
      out("dotOut", nl.toFixed(2));
      out("brightOut", Math.max(0, nl).toFixed(2));
      out("toonOut", nl > t ? "1" : "0");

      const ctx = diag.getContext("2d");
      const W = diag.width, s = W / 300;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = css("--canvas-bg", "#fff"); ctx.fillRect(0, 0, W, W);
      ctx.save(); ctx.scale(s, s);
      const cx = 150, cy = 190;
      const ft = rad(tilt);
      // surface
      ctx.strokeStyle = css("--ink", "#333"); ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 120 * Math.cos(ft), cy - 120 * Math.sin(ft));
      ctx.lineTo(cx + 120 * Math.cos(ft), cy + 120 * Math.sin(ft));
      ctx.stroke();
      // N and L (angles measured from straight up, clockwise)
      const nx = Math.sin(ft), ny = -Math.cos(ft);
      const lr = rad(light), lx = Math.sin(lr), ly = -Math.cos(lr);
      drawArrow(ctx, cx, cy, cx + nx * 120, cy + ny * 120, "#2a6fdb", 3);
      drawArrow(ctx, cx, cy, cx + lx * 120, cy + ly * 120, "#e08a00", 3);
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.fillStyle = "#2a6fdb"; ctx.fillText("N", cx + nx * 138 - 6, cy + ny * 138 + 6);
      ctx.fillStyle = "#e08a00"; ctx.fillText("L", cx + lx * 138 - 5, cy + ly * 138 + 6);
      // angle arc
      ctx.strokeStyle = css("--muted", "#777"); ctx.lineWidth = 1.5;
      ctx.beginPath();
      const a0 = rad(tilt) - Math.PI / 2, a1 = rad(light) - Math.PI / 2;
      ctx.arc(cx, cy, 40, Math.min(a0, a1), Math.max(a0, a1));
      ctx.stroke();
      ctx.restore();

      const L = lightDir(theta, 0);
      sphereRender(sph, L, null);
      sphereRender(sphT, L, t);
    }
    onAnyInput(root, draw);
    window.addEventListener("resize", draw);
    if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
    draw();
  }

  // ---------------------------------------------------- 3D viewer (ch2/3) --
  function viewer() {
    const canvas = $("view"), root = $("demo");
    let yaw = 0.5, pitch = 0.4;
    let meshKey = "", mesh = null;

    const scene = root.dataset.scene || "basic";
    if (scene === "seam") yaw = -Math.PI / 2 + 0.25;
    if (scene === "split") pitch = -0.15;

    function getMesh() {
      const shape = ($("shape") || {}).value || "sphere";
      const seg = Math.round(val("seg", 12));
      const amp = val("amp", 0.08);
      const k = [scene, shape, seg, amp, radio("nbase", ""), radio("importMode", "") === "mirror"].join(":");
      if (k !== meshKey) {
        meshKey = k;
        if (scene === "seam") mesh = seamSphere(seg, Math.max(3, Math.round(seg * 0.66)));
        else if (scene === "custom") mesh = lumpySphere(32, 20, amp);
        else if (scene === "split") mesh = splitSphere(16, 105, 7, 3);
        else if (scene === "noise") mesh = lumpySphere(32, 20, amp);
        else if (scene === "nmap") mesh = radio("nbase", "smooth") === "flat" ? uvSphere(10, 7) : uvSphere(24, 16);
        else if (scene === "import") {
          const base = lumpySphere(32, 20, 0.06);
          mesh = radio("importMode", "keep") === "mirror"
            ? { P: base.P.map((q) => [-q[0], q[1], q[2]]), T: base.T } : base;
        }
        else if (shape === "cylinder") mesh = cylinder(seg, 0.8);
        else if (shape === "bevel") mesh = bevelBox(0.22);
        else mesh = uvSphere(seg, Math.max(3, Math.round(seg * 0.6)));
      }
      return mesh;
    }

    function sceneNormals(m) {
      if (scene === "seam") {
        const how = radio("seamMode", "joined");
        return how === "separate" ? cornerNormals(m, "smooth", "angle") : cornerNormals(weld(m), "smooth", "angle");
      }
      if (scene === "custom") {
        const t = val("amount", 0);
        out("amountOut", t.toFixed(2));
        out("ampOut", val("amp", 0.08).toFixed(2));
        const own = cornerNormals(m, "smooth", "angle");
        return own.map((c, f) => c.map((n, k) => blend(n, norm(m.P[m.T[f][k]]), t)));
      }
      if (scene === "noise") {
        out("ampOut", val("amp", 0.025).toFixed(3));
        out("softOut", val("soft", 0).toFixed(2));
        return cornerNormals(m, "smooth", "angle");
      }
      if (scene === "nmap") {
        out("strengthOut", val("strength", 0.6).toFixed(2));
        return cornerNormals(m, radio("nbase", "smooth"), "angle");
      }
      if (scene === "import") {
        const how = radio("importMode", "keep");
        if (how === "keep") return m.T.map((t) => t.map((vi) => norm(m.P[vi])));
        return cornerNormals(m, "smooth", "angle", how === "split" ? 12 : 180);
      }
      if (scene === "split") {
        const r = val("radius", 0.6);
        out("radiusOut", r.toFixed(2));
        return seamFix(m, radio("fixMode", "separate"), r, checked("falloff"));
      }
      return null;
    }

    let pending = false;
    function draw() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        fitCanvas(canvas, 380);
        const m = getMesh();
        const mode = radio("mode", "smooth");
        const weight = radio("weight", "angle");
        const useAngle = checked("useAngle");
        const ang = val("angle", 180);
        const az = val("az", -40), el = val("el", 30);
        const toonOn = checked("toon");
        const t = val("toonT", 0.3);
        out("segOut", String(Math.round(val("seg", 12))));
        out("angleOut", ang + "°"); out("azOut", az + "°"); out("elOut", el + "°"); out("toonTOut", t.toFixed(2));
        const segRow = $("segRow");
        if (segRow) segRow.hidden = ($("shape") || {}).value === "bevel";
        const CN = sceneNormals(m) || cornerNormals(m, mode, weight, useAngle ? ang : 180);
        render(canvas, m, CN, rotMat(yaw, pitch), lightDir(az, el), {
          toon: toonOn ? t : null, showNormals: checked("showNormals"),
          scale: scene === "basic" ? 0.6 : 0.78,
          soft: val("soft", 0),
          nmap: scene === "nmap" && checked("useMap") ? bumpMap(val("strength", 0.6), checked("flipGreen")) : null,
        });
        out("triOut", String(m.T.length));
        out("vertOut", String(m.P.length));
      });
    }

    // drag to turn
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => { drag = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      yaw += (e.clientX - drag[0]) * 0.01;
      pitch = Math.max(-1.5, Math.min(1.5, pitch + (e.clientY - drag[1]) * 0.01));
      drag = [e.clientX, e.clientY];
      draw();
    });
    const end = () => { drag = null; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    onAnyInput(root, draw);
    window.addEventListener("resize", draw);
    if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
    draw();
  }

  window.NormalsDemo = { ch01, viewer, uvSphere, cylinder, bevelBox, cornerNormals };
})();
