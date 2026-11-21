// ============================================================================
// Texturas procedurales (color + normal + rugosidad) generadas en canvas
// ============================================================================
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function tileNoise(size, seed) {
  // ruido de valor fractal, periódico (se repite sin costuras)
  const R = rng(seed), out = new Float32Array(size * size);
  let amp = 1, tot = 0;
  for (let cells = 4; cells <= 128; cells *= 2) {
    const lat = new Float32Array(cells * cells); for (let i = 0; i < lat.length; i++) lat[i] = R();
    const step = size / cells;
    for (let y = 0; y < size; y++) {
      const gy = y / step, y0 = Math.floor(gy), fy = gy - y0, sy = fy * fy * (3 - 2 * fy);
      const r0 = (y0 % cells) * cells, r1 = ((y0 + 1) % cells) * cells;
      for (let x = 0; x < size; x++) {
        const gx = x / step, x0 = Math.floor(gx), fx = gx - x0, sx = fx * fx * (3 - 2 * fx);
        const c0 = x0 % cells, c1 = (x0 + 1) % cells;
        const a = lat[r0 + c0] + (lat[r0 + c1] - lat[r0 + c0]) * sx;
        const b = lat[r1 + c0] + (lat[r1 + c1] - lat[r1 + c0]) * sx;
        out[y * size + x] += (a + (b - a) * sy) * amp;
      }
    }
    tot += amp; amp *= 0.55;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

const TEXDEF = {
  snow:     { pat: 'plain', a: [128, 140, 160], b: [178, 188, 206], n: 1.0, rough: 0.9, bump: 3.0, stain: 0.05 },
  asphalt:  { pat: 'slab', cells: 2, a: [34, 36, 40], b: [64, 66, 70], n: 0.9, rough: 0.7, bump: 2.5, stain: 0.35, wet: 0.5 },
  concrete: { pat: 'slab', cells: 4, a: [70, 72, 74], b: [118, 118, 112], n: 0.8, rough: 0.85, bump: 2.2, stain: 0.4 },
  tile:     { pat: 'tiles', cells: 8, a: [150, 166, 160], b: [196, 208, 202], n: 0.35, rough: 0.35, bump: 2.5, stain: 0.45, grout: [60, 66, 62] },
  grate:    { pat: 'grate', a: [44, 48, 52], b: [86, 92, 98], n: 0.6, rough: 0.45, bump: 4, stain: 0.3, metal: 0.6 },
  wet:      { pat: 'bricks', a: [32, 40, 38], b: [62, 72, 66], n: 0.7, rough: 0.2, bump: 3, stain: 0.5, wet: 0.9 },
  metalf:   { pat: 'panels', a: [52, 56, 60], b: [92, 96, 100], n: 0.5, rough: 0.5, bump: 2.5, stain: 0.35, metal: 0.5 },
  lino:     { pat: 'tiles', cells: 4, a: [70, 78, 84], b: [96, 104, 108], n: 0.4, rough: 0.55, bump: 1.4, stain: 0.3, grout: [40, 44, 48] },
  rock:     { pat: 'plain', a: [44, 48, 56], b: [100, 104, 112], n: 1.4, rough: 0.9, bump: 6, stain: 0.2 },
  container:{ pat: 'ribs', a: [96, 40, 30], b: [150, 66, 44], n: 0.5, rough: 0.6, bump: 4, stain: 0.5, metal: 0.4 },
  panel:    { pat: 'panels', a: [78, 84, 88], b: [120, 126, 128], n: 0.45, rough: 0.6, bump: 2.5, stain: 0.45 },
  tilewall: { pat: 'tiles', cells: 8, a: [170, 186, 180], b: [214, 222, 218], n: 0.3, rough: 0.3, bump: 2, stain: 0.6, grout: [80, 90, 84] },
  brick:    { pat: 'bricks', a: [70, 40, 32], b: [120, 70, 52], n: 0.7, rough: 0.85, bump: 3.5, stain: 0.4 },
  metalw:   { pat: 'panels', a: [46, 52, 58], b: [78, 86, 94], n: 0.5, rough: 0.45, bump: 3, stain: 0.4, metal: 0.6 },
  crate:    { pat: 'planks', a: [62, 70, 44], b: [96, 104, 64], n: 0.6, rough: 0.75, bump: 3, stain: 0.3, text: 'HALDEN · THULE-7' },
  ice:      { pat: 'panels', a: [150, 176, 196], b: [200, 222, 236], n: 0.5, rough: 0.25, bump: 2, stain: 0.25, metal: 0.2 },
};

const _texCache = {};
function makeTex(kind, opts = {}) {
  const key = kind + JSON.stringify(opts);
  if (_texCache[key]) return _texCache[key];
  const d = Object.assign({}, TEXDEF[kind] || TEXDEF.concrete, opts);
  const S = 512, N = tileNoise(S, (kind.length * 977 + (opts.seed || 1)) | 0), N2 = tileNoise(S, (kind.length * 313 + 7) | 0);
  const R = rng(kind.length * 31 + 5);
  const H = new Float32Array(S * S), M = new Float32Array(S * S); // altura, máscara de surco
  const cells = d.cells || 4;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x; let h = N[i] * d.n, g = 0;
    const u = x / S, v = y / S;
    if (d.pat === 'tiles' || d.pat === 'slab') {
      const fu = (u * cells) % 1, fv = (v * cells) % 1, w = d.pat === 'tiles' ? 0.045 : 0.012;
      if (fu < w || fv < w || fu > 1 - w || fv > 1 - w) g = 1;
    } else if (d.pat === 'bricks') {
      const rows = 8, fv = (v * rows) % 1, row = Math.floor(v * rows), fu = (u * 4 + (row % 2) * 0.5) % 1;
      if (fv < 0.06 || fu < 0.03) g = 1;
    } else if (d.pat === 'panels') {
      const fu = (u * 2) % 1, fv = (v * 2) % 1;
      if (fu < 0.012 || fv < 0.012) g = 1;
      const rx = Math.min(fu, 1 - fu), ry = Math.min(fv, 1 - fv);
      if (rx > 0.03 && rx < 0.05 && ry > 0.03 && ry < 0.05) h += 0.8; // remaches
      if (Math.abs(fv - 0.5) < 0.004) g = 0.5;
    } else if (d.pat === 'grate') {
      const fu = (u * 16) % 1, fv = (v * 16) % 1;
      if (fu > 0.2 && fu < 0.8 && fv > 0.15 && fv < 0.85) g = 1.4; else h += 0.4;
    } else if (d.pat === 'ribs') {
      h += Math.sin(u * Math.PI * 2 * 18) * 0.5 + 0.5;
      if (v < 0.03 || v > 0.97) g = 1;
    } else if (d.pat === 'planks') {
      const fv = (v * 6) % 1; if (fv < 0.025) g = 1;
      h += Math.sin((u * 40 + N2[i] * 8)) * 0.08;
      const fu = u % 0.5; if (fu < 0.03 && (v * 6 | 0) % 2) g = 0.6;
    }
    H[i] = h - g * 0.9; M[i] = g;
  }
  // grietas / arañazos
  const scratches = d.pat === 'plain' ? 10 : 26;
  for (let s = 0; s < scratches; s++) {
    let x = R() * S, y = R() * S, a = R() * 6.28; const len = 20 + R() * 120;
    for (let k = 0; k < len; k++) { a += (R() - 0.5) * 0.3; x = (x + Math.cos(a) + S) % S; y = (y + Math.sin(a) + S) % S; const i = (y | 0) * S + (x | 0); H[i] -= 0.35; M[i] = Math.max(M[i], 0.35); }
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const cx = cv.getContext('2d');
  const img = cx.createImageData(S, S), px = img.data;
  const nv = document.createElement('canvas'); nv.width = nv.height = S; const nx = nv.getContext('2d');
  const nimg = nx.createImageData(S, S), np = nimg.data;
  const rv = document.createElement('canvas'); rv.width = rv.height = S; const rx = rv.getContext('2d');
  const rimg = rx.createImageData(S, S), rp = rimg.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, o = i * 4;
    const t = Math.min(1, Math.max(0, N[i] * 1.25 - 0.1));
    const stain = Math.max(0, (N2[i] - 0.5) * 2) * d.stain;
    let r = d.a[0] + (d.b[0] - d.a[0]) * t, g = d.a[1] + (d.b[1] - d.a[1]) * t, b = d.a[2] + (d.b[2] - d.a[2]) * t;
    const dark = 1 - stain * 0.8;
    r *= dark; g *= dark * 0.98; b *= dark * 0.95;
    if (M[i] > 0) { const gc = d.grout || [r * 0.45, g * 0.45, b * 0.45]; const m = Math.min(1, M[i]); r += (gc[0] - r) * m; g += (gc[1] - g) * m; b += (gc[2] - b) * m; }
    px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
    // normal
    const hl = H[y * S + ((x - 1 + S) % S)], hr = H[y * S + ((x + 1) % S)], hu = H[((y - 1 + S) % S) * S + x], hd = H[((y + 1) % S) * S + x];
    let dx = (hl - hr) * d.bump, dy = (hu - hd) * d.bump, dz = 1; const l = Math.hypot(dx, dy, dz);
    np[o] = (dx / l * 0.5 + 0.5) * 255; np[o + 1] = (dy / l * 0.5 + 0.5) * 255; np[o + 2] = (dz / l * 0.5 + 0.5) * 255; np[o + 3] = 255;
    // rugosidad (canal G) y metalicidad (canal B)
    let ro = d.rough + (N2[i] - 0.5) * 0.25 - (d.wet ? stain * d.wet : 0) + M[i] * 0.15;
    ro = Math.min(1, Math.max(0.05, ro));
    rp[o] = 255; rp[o + 1] = ro * 255; rp[o + 2] = (d.metal || 0) * 255 * (1 - stain); rp[o + 3] = 255;
  }
  cx.putImageData(img, 0, 0); nx.putImageData(nimg, 0, 0); rx.putImageData(rimg, 0, 0);
  if (d.text) { cx.font = 'bold 34px Chakra Petch, sans-serif'; cx.fillStyle = 'rgba(20,20,14,.55)'; cx.textAlign = 'center'; cx.fillText(d.text, S / 2, S / 2 + 10); cx.font = 'bold 18px monospace'; cx.fillText('BIO-MAT. FRÁGIL ▲▲', S / 2, S / 2 + 40); }
  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const res = { map: mk(cv, true), normalMap: mk(nv), roughnessMap: mk(rv), metalnessMap: d.metal ? mk(rv) : null };
  _texCache[key] = res; return res;
}

function texMaterial(kind, rep = 1, extra = {}) {
  const t = makeTex(kind, extra.texOpts || {});
  const clone = (tx) => { if (!tx) return null; const c = tx.clone(); c.needsUpdate = true; c.repeat.set(rep, rep); return c; };
  const m = new THREE.MeshStandardMaterial({ map: clone(t.map), normalMap: clone(t.normalMap), roughnessMap: clone(t.roughnessMap), roughness: 1, metalness: TEXDEF[kind]?.metal ? 0.55 : 0, metalnessMap: clone(t.metalnessMap) });
  m.normalScale.set(1.2, 1.2);
  if (extra.color) m.color.set(extra.color);
  return m;
}

function radialTex(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function bloodTex() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); const R = rng(9);
  for (let i = 0; i < 14; i++) {
    const r = 6 + R() * 26, px = S / 2 + (R() - 0.5) * 60, py = S / 2 + (R() - 0.5) * 60;
    const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(70,4,4,.95)'); g.addColorStop(0.7, 'rgba(50,2,2,.8)'); g.addColorStop(1, 'rgba(40,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
