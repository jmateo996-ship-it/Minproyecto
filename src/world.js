// ============================================================================
// Mundo: temas visuales, generación de mapas, construcción 3D y consultas
// ============================================================================
const CS = 2; // tamaño de celda en metros
const THEMES = {
  snow:      { floor: 'snow', wall: 'rock', outdoor: true, fog: 0x0b1626, fogD: 0.02, hemi: [0x6a82ac, 0x101420, 0.5], moon: [0x9cb4e8, 0.7], lamp: 0xffcf90, particles: 'snow', wallH: 2.6, props: ['rock', 'rock', 'crate', 'barrel'], step: 'snow', bg: 0x0b1626 },
  docks:     { floor: 'asphalt', wall: 'container', outdoor: true, fog: 0x0a1218, fogD: 0.022, hemi: [0x587090, 0x0c0e12, 0.55], moon: [0x9ab0d8, 0.95], lamp: 0xffb060, particles: 'snow', wallH: 2.8, props: ['crate', 'barrel', 'crate', 'container'], step: 'hard', bg: 0x0a1218 },
  facility:  { floor: 'concrete', wall: 'panel', fog: 0x05080b, fogD: 0.03, hemi: [0x5a6a80, 0x0a0a0a, 0.42], lamp: 0xe4ecff, particles: 'dust', wallH: 3, props: ['crate', 'locker', 'desk', 'barrel'] },
  medical:   { floor: 'tile', wall: 'tilewall', fog: 0x050807, fogD: 0.032, hemi: [0x5a7a70, 0x080a08, 0.36], lamp: 0xd8fff0, flicker: 0.5, particles: 'dust', wallH: 3, props: ['bed', 'cabinet', 'bed', 'crate'] },
  industrial:{ floor: 'grate', wall: 'brick', fog: 0x0a0705, fogD: 0.03, hemi: [0x6a5a48, 0x0a0806, 0.38], lamp: 0xffc080, particles: 'dust', wallH: 3, props: ['barrel', 'crate', 'pipes', 'machine'] },
  office:    { floor: 'lino', wall: 'panel', fog: 0x06070a, fogD: 0.03, hemi: [0x5a6070, 0x0a0a0a, 0.4], lamp: 0xf0f4ff, flicker: 0.25, particles: 'dust', wallH: 3, props: ['desk', 'cabinet', 'locker', 'desk'] },
  spores:    { floor: 'metalf', wall: 'metalw', fog: 0x140904, fogD: 0.034, hemi: [0x9a6040, 0x100806, 0.6], lamp: 0xff8a3a, particles: 'spores', wallH: 3, props: ['pod', 'pod', 'crate'] },
  lab:       { floor: 'tile', wall: 'metalw', fog: 0x05080c, fogD: 0.03, hemi: [0x6a80a0, 0x08090a, 0.5], lamp: 0xcfe6ff, flicker: 0.2, particles: 'dust', wallH: 3, props: ['desk', 'cabinet', 'pod'] },
  server:    { floor: 'metalf', wall: 'metalw', fog: 0x03060c, fogD: 0.03, hemi: [0x5a70a0, 0x08090c, 0.55], lamp: 0x7ab8ff, particles: 'dust', wallH: 3, props: ['rack'] },
  cold:      { floor: 'ice', wall: 'metalw', fog: 0x0a1620, fogD: 0.035, hemi: [0x80a8c8, 0x0a1014, 0.48], lamp: 0xa8e0ff, particles: 'snow', wallH: 3, props: ['cryo', 'crate', 'cabinet'] },
  vault:     { floor: 'metalf', wall: 'panel', fog: 0x06080a, fogD: 0.028, hemi: [0x6a7484, 0x0a0a0a, 0.52], lamp: 0xffffff, particles: 'dust', wallH: 3, props: ['crate', 'cabinet', 'barrel'] },
  sewer:     { floor: 'wet', wall: 'brick', fog: 0x040806, fogD: 0.045, hemi: [0x3a5a48, 0x040604, 0.3], lamp: 0x9fe0a0, flicker: 0.4, particles: 'dust', wallH: 3, props: ['pipes', 'barrel'], step: 'wet' },
  hangar:    { floor: 'concrete', wall: 'metalw', outdoor: true, fog: 0x080c12, fogD: 0.022, hemi: [0x607088, 0x0a0c10, 0.55], moon: [0x9ab0d8, 0.7], lamp: 0xffe0b0, particles: 'snow', wallH: 3.2, props: ['crate', 'barrel', 'container'] },
  reactor:   { floor: 'grate', wall: 'metalw', fog: 0x0c0404, fogD: 0.032, hemi: [0x8a5a50, 0x0c0606, 0.58], lamp: 0xff6a48, flicker: 0.2, particles: 'embers', wallH: 3.2, props: ['pipes', 'machine', 'barrel'] },
  burning:   { floor: 'concrete', wall: 'panel', fog: 0x140804, fogD: 0.03, hemi: [0x805030, 0x0a0604, 0.45], lamp: 0xff7a30, flicker: 0.6, particles: 'embers', fires: true, wallH: 3, props: ['crate', 'barrel', 'desk'] },
};

// ---------------------------------------------------------------- mapa ----
function genMap(M) {
  const W = M.w, H = M.h, R = rng(M.seed);
  const g = new Uint8Array(W * H).fill(1);
  const rooms = [];
  const at = (x, y) => g[y * W + x];
  const carve = (x, y) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1 && g[y * W + x] === 1) g[y * W + x] = 0; };
  if (M.layout === 'rooms') {
    let tries = 0;
    while (rooms.length < 13 && tries < 900) {
      tries++;
      const w = 4 + (R() * 6 | 0), h = 4 + (R() * 4 | 0), x = 1 + (R() * (W - w - 2) | 0), y = 1 + (R() * (H - h - 2) | 0);
      if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    rooms.forEach(r => { for (let j = r.y; j < r.y + r.h; j++) for (let i = r.x; i < r.x + r.w; i++) g[j * W + i] = 0; });
    const inTree = [0], edges = [];
    while (inTree.length < rooms.length) {
      let best = null;
      for (const a of inTree) for (let b = 0; b < rooms.length; b++) {
        if (inTree.includes(b)) continue;
        const d = Math.abs(rooms[a].cx - rooms[b].cx) + Math.abs(rooms[a].cy - rooms[b].cy);
        if (!best || d < best.d) best = { a, b, d };
      }
      inTree.push(best.b); edges.push([best.a, best.b]);
    }
    for (let k = 0; k < 3; k++) { const a = R() * rooms.length | 0, b = R() * rooms.length | 0; if (a !== b) edges.push([a, b]); }
    edges.forEach(([a, b]) => {
      const A = rooms[a], B = rooms[b], wide = R() < 0.35;
      let x = A.cx, y = A.cy; const hFirst = R() < 0.5;
      const stepTo = (tx, ty) => { while (x !== tx || y !== ty) { if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y); carve(x, y); if (wide) { carve(x + 1, y); carve(x, y + 1); } } };
      if (hFirst) { stepTo(B.cx, y); stepTo(B.cx, B.cy); } else { stepTo(x, B.cy); stepTo(B.cx, B.cy); }
    });
  } else if (M.layout === 'open') {
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) g[y * W + x] = 0;
    // edificios macizos
    const nb = 6 + (R() * 3 | 0);
    for (let b = 0; b < nb; b++) {
      const w = 3 + (R() * 5 | 0), h = 3 + (R() * 4 | 0), x = 3 + (R() * (W - w - 6) | 0), y = 3 + (R() * (H - h - 6) | 0);
      if (x < 9 && y > H / 2 - 6 && y < H / 2 + 6) continue; // zona de inicio libre
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j * W + i] = 1;
    }
    // bordes irregulares
    for (let x = 1; x < W - 1; x++) { const d1 = R() < 0.4 ? 1 : 0, d2 = R() < 0.4 ? 1 : 0; for (let k = 0; k < d1; k++) g[(1 + k) * W + x] = 1; for (let k = 0; k < d2; k++) g[(H - 2 - k) * W + x] = 1; }
    // zonas (para colocar cosas)
    const zx = 4, zy = 3;
    for (let a = 0; a < zx; a++) for (let b = 0; b < zy; b++) {
      const x0 = 1 + (a * (W - 2) / zx | 0), y0 = 1 + (b * (H - 2) / zy | 0), w = ((W - 2) / zx | 0), h = ((H - 2) / zy | 0);
      rooms.push({ x: x0, y: y0, w, h, cx: x0 + (w >> 1), cy: y0 + (h >> 1), open: true });
    }
  } else { // arena
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) g[y * W + x] = 0;
    for (let y = 4; y < H - 4; y += 6) for (let x = 4; x < W - 4; x += 7) {
      if (Math.abs(x - W / 2) < 4 && Math.abs(y - H / 2) < 4) continue;
      g[y * W + x] = 1; g[y * W + x + 1] = 1; g[(y + 1) * W + x] = 1; g[(y + 1) * W + x + 1] = 1;
    }
    rooms.push({ x: 1, y: 1, w: W - 2, h: H - 2, cx: W >> 1, cy: H >> 1, arena: true });
  }
  const map = { W, H, g, rooms, R, props: [] };
  // inicio = sala más a la izquierda
  let startRoom = rooms.reduce((b, r) => (r.cx < b.cx ? r : b), rooms[0]);
  if (M.layout === 'arena') startRoom = rooms[0];
  map.startRoom = startRoom;
  let sx = startRoom.cx, sy = startRoom.cy;
  if (M.layout === 'open') { sx = 3; sy = H >> 1; for (let j = sy - 2; j <= sy + 2; j++) for (let i = 1; i <= 6; i++) g[j * W + i] = 0; }
  if (M.layout === 'arena') { sx = W >> 1; sy = H - 4; }
  map.start = { x: sx, y: sy };
  // asegurar conectividad: celdas libres no alcanzables -> muro
  const dist = bfsField(map, sx, sy);
  for (let i = 0; i < W * H; i++) if (g[i] === 0 && dist[i] < 0) g[i] = 1;
  map.dist = dist;
  rooms.forEach(r => { r.d = dist[r.cy * W + r.cx]; if (r.d < 0) { // centro bloqueado: buscar celda libre
    let best = -1; for (let j = r.y; j < r.y + r.h; j++) for (let i = r.x; i < r.x + r.w; i++) if (dist[j * W + i] >= 0 && (best < 0 || Math.abs(i - r.cx) + Math.abs(j - r.cy) < best)) { best = Math.abs(i - r.cx) + Math.abs(j - r.cy); r.cx = i; r.cy = j; }
    r.d = dist[r.cy * W + r.cx]; } });
  map.rooms = rooms.filter(r => r.d >= 0);
  return map;
}

function bfsField(map, sx, sy, passable = (v) => v === 0) {
  const { W, H, g } = map, dist = new Int16Array(W * H).fill(-1), q = new Int32Array(W * H);
  let h = 0, t = 0; const s = sy * W + sx; if (!passable(g[s])) return dist;
  dist[s] = 0; q[t++] = s;
  while (h < t) {
    const c = q[h++], x = c % W, y = (c / W) | 0, d = dist[c] + 1;
    if (x > 0 && dist[c - 1] < 0 && passable(g[c - 1])) { dist[c - 1] = d; q[t++] = c - 1; }
    if (x < W - 1 && dist[c + 1] < 0 && passable(g[c + 1])) { dist[c + 1] = d; q[t++] = c + 1; }
    if (y > 0 && dist[c - W] < 0 && passable(g[c - W])) { dist[c - W] = d; q[t++] = c - W; }
    if (y < H - 1 && dist[c + W] < 0 && passable(g[c + W])) { dist[c + W] = d; q[t++] = c + W; }
  }
  return dist;
}

// Ruta en celdas desde (sx,sy) a (tx,ty) usando el campo de distancias inverso
function findPath(map, sx, sy, tx, ty) {
  const f = bfsField(map, tx, ty);
  const W = map.W; let c = sy * W + sx; if (f[c] < 0) return null;
  const path = []; let guard = 0;
  while (f[c] > 0 && guard++ < 4000) {
    const x = c % W, y = (c / W) | 0; let best = c;
    for (const n of [c - 1, c + 1, c - W, c + W]) { if (n < 0 || n >= f.length) continue; if (f[n] >= 0 && f[n] < f[best]) best = n; }
    if (best === c) break; c = best; path.push({ x: c % W, y: (c / W) | 0 });
  }
  return path;
}

const cellCenter = (i, j) => ({ x: i * CS + CS / 2, z: j * CS + CS / 2 });
function solidAt(map, x, z) { const i = Math.floor(x / CS), j = Math.floor(z / CS); if (i < 0 || j < 0 || i >= map.W || j >= map.H) return true; return map.g[j * map.W + i] !== 0; }
function losClear(map, x0, z0, x1, z1) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), n = Math.ceil(L / 0.3);
  for (let k = 1; k < n; k++) { const t = k / n; if (solidAt(map, x0 + dx * t, z0 + dz * t)) return false; }
  return true;
}
function rayWall(map, x0, z0, dx, dz, maxD) { // distancia hasta muro
  for (let d = 0.2; d < maxD; d += 0.15) if (solidAt(map, x0 + dx * d, z0 + dz * d)) return d;
  return maxD;
}
function collide(map, p, r) { // empuja un círculo fuera de las celdas sólidas
  const i0 = Math.floor((p.x - r) / CS), i1 = Math.floor((p.x + r) / CS), j0 = Math.floor((p.z - r) / CS), j1 = Math.floor((p.z + r) / CS);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (i >= 0 && j >= 0 && i < map.W && j < map.H && map.g[j * map.W + i] === 0) continue;
    const bx = Math.max(i * CS, Math.min(p.x, i * CS + CS)), bz = Math.max(j * CS, Math.min(p.z, j * CS + CS));
    const dx = p.x - bx, dz = p.z - bz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) { const d = Math.sqrt(d2) || 0.0001; const push = r - d; p.x += dx / d * push; p.z += dz / d * push; }
  }
}

// ---------------------------------------------------------- materiales ----
const MAT = {};
function mats() {
  if (MAT.ok) return MAT; MAT.ok = true;
  const S = (c, r = 0.7, m = 0, e) => { const o = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); if (e) { o.emissive = new THREE.Color(e[0]); o.emissiveIntensity = e[1]; } return o; };
  Object.assign(MAT, {
    crate: texMaterial('crate', 1), metal: S(0x50575e, 0.4, 0.7), dark: S(0x1c2024, 0.6, 0.4), steel: S(0x8a949c, 0.35, 0.8),
    red: S(0x7a1e16, 0.5, 0.3), blue: S(0x1d3e66, 0.5, 0.3), yellow: S(0xb08a20, 0.5, 0.3), white: S(0xc8ccc8, 0.6, 0), sheet: S(0x8a9aa0, 0.8, 0),
    wood: S(0x5a4632, 0.8, 0), glass: new THREE.MeshStandardMaterial({ color: 0x88aacc, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.25 }),
    screen: S(0x0a1a12, 0.3, 0, [0x40ffa0, 2.2]), screenB: S(0x0a1220, 0.3, 0, [0x4aa8ff, 2.2]), led: S(0x111111, 0.3, 0, [0xff3020, 4]), ledG: S(0x111111, 0.3, 0, [0x30ff80, 4]),
    spore: S(0x401808, 0.4, 0, [0xff7a1a, 3.2]), sporeGlow: S(0x401808, 0.4, 0, [0xff8a2a, 6]),
    lamp: S(0x222222, 0.4, 0, [0xffffff, 6]), rock: texMaterial('rock', 1), container: [texMaterial('container', 1), texMaterial('container', 1, { color: 0x6a90c0 }), texMaterial('container', 1, { color: 0x90b080 })],
    hazard: S(0xc09010, 0.6, 0.2), ice: S(0xbfe6ff, 0.15, 0.1, [0x2a6a90, 0.6]),
  });
  return MAT;
}

function box(w, h, d, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; }
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 16) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; }

function makeProp(type, R) {
  const M = mats(), g = new THREE.Group();
  switch (type) {
    case 'crate': { const s = 1.5 + R() * 0.3; g.add(box(s, s, s, M.crate, 0, s / 2, 0)); if (R() < 0.5) { const t = box(1, 1, 1, M.crate, (R() - 0.5) * 0.4, s + 0.5, (R() - 0.5) * 0.4); t.rotation.y = R(); g.add(t); } g.rotation.y = (R() - 0.5) * 0.5; break; }
    case 'barrel': { const ms = [M.red, M.blue, M.yellow, M.metal]; for (let k = 0; k < 3; k++) { const b = cyl(0.42, 0.42, 1.2, ms[R() * 4 | 0], (k - 1) * 0.6 + (R() - 0.5) * 0.2, 0.6, (R() - 0.5) * 0.6); g.add(b); b.add(cyl(0.44, 0.44, 0.06, M.dark, 0, 0.3, 0)); b.add(cyl(0.44, 0.44, 0.06, M.dark, 0, -0.3, 0)); } break; }
    case 'container': { const c = box(1.9, 2.5, 1.9, M.container[R() * 3 | 0], 0, 1.25, 0); g.add(c); break; }
    case 'rock': { const geo = new THREE.IcosahedronGeometry(1.1, 1); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const f = 0.8 + R() * 0.4; p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.8, p.getZ(i) * f); } geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M.rock); m.position.y = 0.7; m.rotation.y = R() * 6; m.castShadow = m.receiveShadow = true; g.add(m); break; }
    case 'locker': for (let k = 0; k < 3; k++) { const l = box(0.6, 2, 0.6, M.sheet, (k - 1) * 0.62, 1, 0.5); g.add(l); l.add(box(0.05, 0.3, 0.02, M.dark, 0.2, 0.3, -0.31)); } break;
    case 'desk': { g.add(box(1.8, 0.08, 0.9, M.wood, 0, 0.8, 0)); [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].forEach(([x, z]) => g.add(box(0.06, 0.8, 0.06, M.metal, x, 0.4, z))); g.add(box(0.6, 0.4, 0.05, M.dark, 0, 1.08, -0.2)); g.add(box(0.54, 0.34, 0.01, R() < 0.5 ? M.screen : M.screenB, 0, 1.08, -0.17)); g.add(box(1.4, 0.9, 0.05, M.sheet, 0, 0.45, 0.7)); g.rotation.y = R() < 0.5 ? 0 : Math.PI / 2; break; }
    case 'cabinet': { g.add(box(1.6, 1.9, 0.6, M.sheet, 0, 0.95, 0.5)); for (let k = 0; k < 4; k++) g.add(box(1.5, 0.02, 0.02, M.dark, 0, 0.3 + k * 0.45, 0.19)); break; }
    case 'bed': { g.add(box(0.95, 0.5, 1.9, M.metal, 0, 0.4, 0)); g.add(box(0.9, 0.15, 1.8, M.white, 0, 0.72, 0)); g.add(box(0.95, 0.6, 0.05, M.metal, 0, 0.9, -0.95)); g.rotation.y = R() < 0.5 ? 0 : Math.PI / 2; break; }
    case 'pod': { g.add(cyl(0.7, 0.8, 0.3, M.metal, 0, 0.15, 0)); const gl = cyl(0.62, 0.62, 2, M.glass, 0, 1.3, 0); gl.castShadow = false; g.add(gl); g.add(cyl(0.3, 0.45, 1.4, M.spore, 0, 1.0, 0, 10)); g.add(cyl(0.7, 0.7, 0.2, M.metal, 0, 2.35, 0)); g.userData.glow = 0xff7a1a; break; }
    case 'rack': { g.add(box(1.4, 2.4, 0.9, M.dark, 0, 1.2, 0)); for (let k = 0; k < 9; k++) { g.add(box(1.2, 0.04, 0.02, k % 3 ? M.ledG : M.screenB, 0, 0.35 + k * 0.22, 0.46)); } g.userData.glow = 0x4aa8ff; break; }
    case 'cryo': { g.add(box(1.2, 2.2, 1.2, M.steel, 0, 1.1, 0)); g.add(box(0.9, 1.4, 0.02, M.ice, 0, 1.2, 0.61)); break; }
    case 'pipes': { for (let k = 0; k < 3; k++) { const p = cyl(0.18, 0.18, 1.9, M.metal, 0, 0.4 + k * 0.6, 0, 10); p.rotation.z = Math.PI / 2; g.add(p); } g.add(box(0.3, 2, 0.3, M.dark, -0.8, 1, 0)); g.add(box(0.3, 2, 0.3, M.dark, 0.8, 1, 0)); g.rotation.y = R() < 0.5 ? 0 : Math.PI / 2; break; }
    case 'machine': { g.add(box(1.7, 1.4, 1.4, M.metal, 0, 0.7, 0)); g.add(box(1.2, 0.5, 1, M.hazard, 0, 1.6, 0)); g.add(box(0.2, 0.08, 0.02, M.led, 0.5, 1.1, 0.71)); break; }
    default: g.add(box(1.5, 1.5, 1.5, M.crate, 0, 0.75, 0));
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } });
  return g;
}

// objetos de misión (interactuables)
function makeTarget(type) {
  const M = mats(), g = new THREE.Group();
  const add = (o) => { g.add(o); return o; };
  let light = 0x40ffa0, h = 1.6;
  switch (type) {
    case 'relay': add(box(1.2, 2.2, 0.8, M.dark, 0, 1.1, 0)); for (let k = 0; k < 4; k++) add(box(0.16, 0.16, 0.02, M.led, -0.3 + k * 0.2, 1.8, 0.41)); add(box(0.9, 0.6, 0.02, M.screen, 0, 1.2, 0.41)); light = 0xff3020; break;
    case 'generator': add(box(1.8, 1.3, 1.2, M.yellow, 0, 0.65, 0)); add(cyl(0.3, 0.3, 0.8, M.dark, 0.5, 1.6, 0)); add(box(0.5, 0.3, 0.02, M.led, -0.4, 1, 0.61)); light = 0xff9020; break;
    case 'terminal': add(box(1.4, 1, 0.8, M.dark, 0, 0.5, 0)); const s = add(box(1.1, 0.7, 0.06, M.screen, 0, 1.4, -0.1)); s.rotation.x = -0.4; break;
    case 'tank': add(cyl(0.9, 1, 0.4, M.metal, 0, 0.2, 0)); const gl = add(cyl(0.8, 0.8, 2.4, M.glass, 0, 1.6, 0)); gl.castShadow = false; add(cyl(0.55, 0.65, 2.0, M.sporeGlow, 0, 1.5, 0, 12)); add(cyl(0.9, 0.9, 0.3, M.metal, 0, 2.9, 0)); light = 0xff7a1a; h = 3; break;
    case 'antenna': add(box(1.4, 0.4, 1.4, M.metal, 0, 0.2, 0)); add(cyl(0.08, 0.18, 6, M.steel, 0, 3.2, 0, 8)); for (let k = 0; k < 3; k++) { const b = add(box(1.4 - k * 0.3, 0.06, 0.06, M.steel, 0, 2.5 + k * 1.2, 0)); b.rotation.y = k; } add(box(0.2, 0.2, 0.2, M.led, 0, 6.3, 0)); light = 0xff3020; h = 2; break;
    case 'vault': add(box(1.9, 2.8, 0.8, M.steel, 0, 1.4, 0)); const d = add(cyl(1.1, 1.1, 0.3, M.metal, 0, 1.4, 0.5, 24)); d.rotation.x = Math.PI / 2; add(box(0.5, 0.3, 0.02, M.screenB, 0.6, 2.4, 0.42)); light = 0x4aa8ff; break;
    case 'console': add(box(1.6, 1.1, 1, M.dark, 0, 0.55, 0)); const c = add(box(1.4, 0.5, 0.06, M.led, 0, 1.25, -0.2)); c.rotation.x = -0.6; add(cyl(0.12, 0.12, 0.2, M.hazard, 0.4, 1.15, 0.2)); light = 0xff3020; break;
    case 'emitter': add(cyl(0.6, 0.9, 0.5, M.dark, 0, 0.25, 0)); add(cyl(0.15, 0.2, 3.6, M.steel, 0, 2.2, 0, 8)); for (let k = 0; k < 3; k++) { const r = add(new THREE.Mesh(new THREE.TorusGeometry(0.6 - k * 0.12, 0.05, 8, 24), M.sporeGlow)); r.position.y = 2.4 + k * 0.6; r.rotation.x = Math.PI / 2; r.userData.spin = 1 + k; } light = 0xff7a1a; h = 2.2; break;
    case 'fuel': add(cyl(0.9, 0.9, 2.6, M.red, 0, 1.3, 0)); add(cyl(0.95, 0.95, 0.1, M.dark, 0, 2.2, 0)); add(cyl(0.95, 0.95, 0.1, M.dark, 0, 0.5, 0)); add(box(0.4, 0.3, 0.02, M.hazard, 0, 1.5, 0.91)); light = 0xffb040; break;
    case 'heli': { const b = add(box(1.6, 1.4, 3.4, M.dark, 0, 1.2, 0)); add(box(1.4, 0.8, 1.1, M.glass, 0, 1.5, 1.7)); add(box(0.4, 0.4, 3.2, M.dark, 0, 1.4, -3)); add(box(0.08, 1, 0.6, M.dark, 0, 1.9, -4.5)); const rot = add(box(7.5, 0.05, 0.25, M.metal, 0, 2.1, 0)); rot.userData.spin = 0.3; const rot2 = add(box(0.25, 0.05, 7.5, M.metal, 0, 2.1, 0)); rot2.userData.spin = 0.3; add(box(0.1, 0.1, 3.6, M.metal, 0.75, 0.2, 0)); add(box(0.1, 0.1, 3.6, M.metal, -0.75, 0.2, 0)); light = 0xff3020; break; }
  }
  g.traverse(o => { if (o.isMesh) { if (o.castShadow !== false) o.castShadow = true; o.receiveShadow = true; } });
  g.userData.light = light; g.userData.h = h;
  return g;
}

function makePickup(type) {
  const M = mats(), g = new THREE.Group(); let col = 0xffffff;
  const S = (c, e = 2) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: c, emissiveIntensity: e });
  switch (type) {
    case 'ammo': g.add(box(0.5, 0.3, 0.35, M.hazard, 0, 0.15, 0)); g.add(box(0.3, 0.02, 0.2, M.dark, 0, 0.31, 0)); col = 0xf0b44c; break;
    case 'shells': g.add(box(0.5, 0.3, 0.35, M.red, 0, 0.15, 0)); g.add(box(0.3, 0.02, 0.2, M.hazard, 0, 0.31, 0)); col = 0xff6040; break;
    case 'medkit': g.add(box(0.55, 0.3, 0.4, M.white, 0, 0.15, 0)); g.add(box(0.3, 0.02, 0.08, S(0xff2020, 1.5), 0, 0.31, 0)); g.add(box(0.08, 0.02, 0.3, S(0xff2020, 1.5), 0, 0.31, 0)); col = 0x69e0a0; break;
    case 'keycard': g.add(box(0.4, 0.02, 0.26, S(0x40a0ff, 2.5), 0, 0.4, 0)); col = 0x40a0ff; break;
    case 'tape': g.add(box(0.36, 0.1, 0.24, S(0x202020, 0.1), 0, 0.3, 0)); g.add(box(0.2, 0.11, 0.1, S(0xff9a30, 2.5), 0, 0.3, 0)); col = 0xff9a30; break;
    case 'code': case 'doc': g.add(box(0.36, 0.01, 0.48, S(0xe8e0c8, type === 'code' ? 1.8 : 1.0), 0, 0.3, 0)); col = type === 'code' ? 0xffe080 : 0xe8e0c8; break;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.col = col; return g;
}

// -------------------------------------------------- construcción de nivel ----
function buildLevel(M, scene) {
  const th = THEMES[M.theme], map = genMap(M), R = map.R, W = map.W, H = map.H;
  const level = { map, th, lamps: [], targets: [], pickups: [], exit: null, guardsSpawn: [], infSpawn: [], fires: [], anim: [], group: new THREE.Group() };
  const G = level.group; scene.add(G);
  const occ = new Set(); const key = (i, j) => j * W + i;
  occ.add(key(map.start.x, map.start.y));

  // ---- suelo
  const fm = texMaterial(th.floor, 1);
  [fm.map, fm.normalMap, fm.roughnessMap, fm.metalnessMap].forEach(t => t && t.repeat.set(W * CS / 6, H * CS / 6));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * CS + 40, H * CS + 40), fm);
  [fm.map, fm.normalMap, fm.roughnessMap, fm.metalnessMap].forEach(t => t && t.repeat.set((W * CS + 40) / 6, (H * CS + 40) / 6));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W * CS / 2, 0, H * CS / 2); floor.receiveShadow = true; G.add(floor);

  const roomsByDist0 = map.rooms.slice().sort((a, b) => a.d - b.d);
  const exitRoom0 = roomsByDist0[roomsByDist0.length - 1];
  let ex = [exitRoom0.cx, exitRoom0.cy];
  if (M.layout === 'open') { // borde este
    let bj = H >> 1; for (let t = 0; t < 40 && map.g[key(W - 3, bj)] !== 0; t++) bj = 3 + (R() * (H - 6) | 0);
    for (let j = bj - 1; j <= bj + 1; j++) for (let i = W - 5; i < W - 1; i++) map.g[key(i, j)] = 0;
    ex = [W - 3, bj];
  }
  if (M.layout === 'arena') ex = [W >> 1, 3];
  { // garantizar que la salida es alcanzable
    let d = bfsField(map, map.start.x, map.start.y);
    if (d[key(ex[0], ex[1])] < 0) { let i = ex[0]; while (i > 1 && d[key(i, ex[1])] < 0) { map.g[key(i, ex[1])] = 0; map.g[key(i, ex[1] + 1)] = map.g[key(i, ex[1] + 1)] === 1 && ex[1] + 1 < H - 1 ? 0 : map.g[key(i, ex[1] + 1)]; i--; } }
  }
  // ---- muros (instanciados, solo los visibles)
  const wallCells = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (map.g[key(i, j)] !== 1) continue;
    let vis = false;
    for (let dj = -1; dj <= 1 && !vis; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < W && b < H && map.g[key(a, b)] !== 1) { vis = true; break; } }
    if (vis) wallCells.push([i, j]);
  }
  let wmat, wgeo;
  if (th.wall === 'rock') { wgeo = new THREE.IcosahedronGeometry(1.3, 1); const pa = wgeo.attributes.position, RR = rng(77); const seen = {}; for (let k = 0; k < pa.count; k++) { const kk = pa.getX(k).toFixed(3) + pa.getY(k).toFixed(3) + pa.getZ(k).toFixed(3); const f = seen[kk] || (seen[kk] = 0.72 + RR() * 0.5); pa.setXYZ(k, pa.getX(k) * f, pa.getY(k) * f, pa.getZ(k) * f); } wgeo = wgeo.toNonIndexed ? wgeo : wgeo; wgeo.computeVertexNormals(); wmat = mats().rock.clone(); wmat.flatShading = true; }
  else if (th.wall === 'container') { wgeo = new THREE.BoxGeometry(CS, th.wallH, CS); wmat = mats().container[0].clone(); }
  else { wgeo = new THREE.BoxGeometry(CS, th.wallH, CS); wmat = texMaterial(th.wall, 1); }
  // UV del muro escalada para que la textura no se estire
  if (wgeo.attributes.uv && th.wall !== 'rock') { const uv = wgeo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 0.5, uv.getY(k) * th.wallH / 4); }
  addCutaway(wmat);
  const walls = new THREE.InstancedMesh(wgeo, wmat, wallCells.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), eu = new THREE.Euler();
  wallCells.forEach(([i, j], k) => {
    const c = cellCenter(i, j);
    if (th.wall === 'rock') { eu.set(R() * 6, R() * 6, R() * 6); q.setFromEuler(eu); const s = 0.95 + R() * 0.35; sc.set(s, (th.wallH / 2.2) * (0.7 + R() * 0.6), s); ps.set(c.x + (R() - 0.5) * 0.3, th.wallH * 0.35, c.z + (R() - 0.5) * 0.3); }
    else { q.identity(); sc.set(1, 1, 1); ps.set(c.x, th.wallH / 2, c.z); }
    m4.compose(ps, q, sc); walls.setMatrixAt(k, m4);
  });
  walls.castShadow = true; walls.receiveShadow = true; G.add(walls);
  level.wallMat = wmat;
  // remate superior de muros interiores (zócalo y tapa oscura)
  if (!th.outdoor) {
    const capGeo = new THREE.BoxGeometry(CS, 0.06, CS), capMat = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.9 }); addCutaway(capMat);
    const caps = new THREE.InstancedMesh(capGeo, capMat, wallCells.length);
    wallCells.forEach(([i, j], k) => { const c = cellCenter(i, j); m4.makeTranslation(c.x, th.wallH + 0.03, c.z); caps.setMatrixAt(k, m4); });
    G.add(caps);
  }

  // ---- helpers de colocación
  const roomsByDist = map.rooms.slice().sort((a, b) => a.d - b.d);
  const exitRoom = exitRoom0;
  const freeCell = (room, opts = {}) => {
    for (let t = 0; t < 80; t++) {
      const i = room.x + (R() * room.w | 0), j = room.y + (R() * room.h | 0);
      if (map.g[key(i, j)] !== 0 || occ.has(key(i, j))) continue;
      if (opts.minStart && Math.abs(i - map.start.x) + Math.abs(j - map.start.y) < opts.minStart) continue;
      if (opts.interior) { let ok = true; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (map.g[key(i + di, j + dj)] !== 0) ok = false; if (!ok) continue; }
      return [i, j];
    }
    return null;
  };
  const placeSolid = (i, j) => { // bloquea la celda solo si no rompe la conectividad
    map.g[key(i, j)] = 2;
    const d = bfsField(map, map.start.x, map.start.y);
    let ok = true; for (let k = 0; k < W * H; k++) if (map.g[k] === 0 && d[k] < 0) { ok = false; break; }
    if (!ok) { map.g[key(i, j)] = 0; return false; }
    occ.add(key(i, j)); return true;
  };

  // ---- salida (posición calculada antes de los muros)
  occ.add(key(ex[0], ex[1]));
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) occ.add(key(ex[0] + di, ex[1] + dj));
  const exc = cellCenter(ex[0], ex[1]);
  level.exit = { x: exc.x, z: exc.z, mesh: makeExitMarker() };
  level.exit.mesh.position.set(exc.x, 0, exc.z); G.add(level.exit.mesh);

  // ---- objetivos
  const midRooms = roomsByDist.filter(r => r !== exitRoom && r !== map.startRoom);
  const pickRooms = (n, from = 0.25) => { const pool = midRooms.length ? midRooms : roomsByDist; const out = []; for (let k = 0; k < n; k++) { const t = from + (1 - from) * ((k + 0.5) / n); out.push(pool[Math.min(pool.length - 1, Math.floor(t * pool.length))]); } return out; };
  M.objectives.forEach((ob, stage) => {
    if (ob.type === 'collect') {
      pickRooms(ob.count, 0.3 + stage * 0.05).forEach(room => {
        const c = freeCell(room, { minStart: 6 }) || freeCell(room); if (!c) return; occ.add(key(c[0], c[1]));
        level.pickups.push({ type: ob.item, stage, ...cellCenter(c[0], c[1]) });
      });
    } else if (ob.type === 'interact' || ob.type === 'plant') {
      const rooms = M.layout === 'arena' ? [roomsByDist[0]] : pickRooms(ob.count, 0.35 + stage * 0.1);
      rooms.forEach(room => {
        let c = null;
        for (let t = 0; t < 30 && !c; t++) { const cc = freeCell(room, { interior: true, minStart: 5 }); if (cc && placeSolid(cc[0], cc[1])) c = cc; }
        if (!c) for (let t = 0; t < 30 && !c; t++) { const cc = freeCell(room, {}); if (cc && placeSolid(cc[0], cc[1])) c = cc; }
        if (!c) return;
        const p = cellCenter(c[0], c[1]), mesh = makeTarget(ob.target);
        mesh.position.set(p.x, 0, p.z); mesh.rotation.y = (R() * 4 | 0) * Math.PI / 2; G.add(mesh);
        level.targets.push({ type: ob.target, stage, x: p.x, z: p.z, mesh, done: false, plant: ob.type === 'plant', progress: 0 });
        level.lamps.push({ x: p.x, y: 1.8, z: p.z, color: mesh.userData.light, power: 10, flick: 0, small: true });
      });
    }
  });
  // ---- documentos
  (M.docs || []).forEach((doc, k) => {
    const room = pickRooms(1, 0.15 + k * 0.2)[0] || roomsByDist[0]; const c = freeCell(room) || [map.start.x + 1, map.start.y];
    occ.add(key(c[0], c[1])); level.pickups.push({ type: 'doc', doc, ...cellCenter(c[0], c[1]) });
  });
  // ---- suministros
  const nRooms = map.rooms.length;
  const supply = (type, n) => { for (let k = 0; k < n; k++) { const room = map.rooms[R() * nRooms | 0]; const c = freeCell(room); if (c) { occ.add(key(c[0], c[1])); level.pickups.push({ type, ...cellCenter(c[0], c[1]) }); } } };
  const hostile = M.infected + M.runners + M.brutes * 3 + M.guards;
  supply('ammo', 2 + Math.round(hostile / 4));
  if (M.id >= 4) supply('shells', 1 + Math.round((M.infected + M.brutes * 3) / 6));
  supply('medkit', 1 + Math.round(hostile / 7));

  // ---- obstáculos/decorado
  map.rooms.forEach(room => {
    if (room.arena) return;
    const n = room.open ? 3 + (R() * 4 | 0) : Math.max(1, (room.w * room.h / 9) | 0);
    for (let k = 0; k < n; k++) {
      const c = freeCell(room, { interior: !room.open, minStart: 3 }); if (!c) continue;
      if (!placeSolid(c[0], c[1])) continue;
      const type = th.props[R() * th.props.length | 0];
      const p = cellCenter(c[0], c[1]), prop = makeProp(type, R);
      prop.position.set(p.x, 0, p.z); G.add(prop);
      if (prop.userData.glow) level.lamps.push({ x: p.x, y: 1.5, z: p.z, color: prop.userData.glow, power: 6, flick: 0, small: true });
    }
  });
  // decorado no sólido: tuberías en el techo, cables, charcos de sangre seca
  const decoMat = new THREE.MeshStandardMaterial({ map: bloodTex(), transparent: true, depthWrite: false, roughness: 0.3, opacity: 0.8 });
  for (let k = 0; k < (th.outdoor ? 4 : 14); k++) {
    const room = map.rooms[R() * nRooms | 0], c = freeCell(room); if (!c) continue; const p = cellCenter(c[0], c[1]);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + R() * 2, 1.6 + R() * 2), decoMat); d.rotation.x = -Math.PI / 2; d.rotation.z = R() * 6; d.position.set(p.x + (R() - .5), 0.015, p.z + (R() - .5)); d.receiveShadow = true; G.add(d);
  }

  // ---- lámparas
  const poolTex = radialTex('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const addLamp = (x, z, col, power = 1, flick = 0) => {
    level.lamps.push({ x, y: th.outdoor ? 4.2 : th.wallH - 0.25, z, color: col, power: 26 * power, flick });
    if (th.outdoor) { const pole = cyl(0.08, 0.1, 4.4, mats().dark, x, 2.2, z, 8); G.add(pole); const hd = box(0.6, 0.15, 0.3, mats().dark, x, 4.35, z); G.add(hd); const em = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.24), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(4) })); em.position.set(x, 4.26, z); G.add(em); }
    else { const fx = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(3) })); fx.position.set(x, th.wallH - 0.05, z); G.add(fx); }
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(col).multiplyScalar(0.12 * power), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.03, z); G.add(pool);
    level.lamps[level.lamps.length - 1].pool = pool;
    // haz volumétrico bajo la lámpara
    const ly = th.outdoor ? 4.2 : th.wallH - 0.1;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 2.6, ly, 28, 1, true), makeShaftMat(col, 0.16 * power));
    cone.position.set(x, ly / 2, z); cone.renderOrder = 4; G.add(cone);
    level.lamps[level.lamps.length - 1].cone = cone;
  };
  map.rooms.forEach(room => {
    if (room.arena) { for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { const p = cellCenter(room.x + 3 + a * ((room.w - 6) / 2 | 0), room.y + 3 + b * (room.h - 6)); addLamp(p.x, p.z, th.lamp, 1.2, th.flicker ? 0.3 : 0); } return; }
    if (room.open) { if (R() < 0.75) { const c = freeCell(room) || [room.cx, room.cy]; const p = cellCenter(c[0], c[1]); addLamp(p.x, p.z, th.lamp, 1.1, 0); } return; }
    if (R() < 0.12 && room !== map.startRoom) return; // algunas salas a oscuras
    const p = cellCenter(room.cx, room.cy); const fl = th.flicker && R() < th.flicker ? 1 : 0;
    addLamp(p.x, p.z, th.lamp, 1, fl);
    if (room.w * room.h > 40) { const p2 = cellCenter(room.x + 1, room.y + 1); addLamp(p2.x + 1, p2.z + 1, th.lamp, 0.7, 0); }
  });
  // lámpara de salida
  level.lamps.push({ x: exc.x, y: 2.5, z: exc.z, color: 0x50ff9a, power: 12, flick: 0, exit: true });

  // ---- detalles en las paredes (tuberías, señales, rejillas, cuadros)
  decorateWalls(map, th, G, R);
  // ---- niebla rastrera
  const mistCol = { snow: 0x9ab0d0, docks: 0x6a7a8a, sewer: 0x4a7a5a, spores: 0xff7a2a, burning: 0x6a3a20, cold: 0x9ad0f0, reactor: 0xa04030, hangar: 0x7a8a9a }[M.theme];
  if (mistCol) { [0.25, 0.9].forEach((y, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(W * CS + 30, H * CS + 30), makeMistMat(mistCol, k)); m.rotation.x = -Math.PI / 2; m.position.set(W * CS / 2, y, H * CS / 2); m.renderOrder = 3; G.add(m); level.mists = (level.mists || []).concat(m); }); }
  // ---- fuego (misión final)
  if (th.fires) {
    for (let k = 0; k < 16; k++) { const room = map.rooms[R() * nRooms | 0], c = freeCell(room, { minStart: 4 }); if (!c) continue; const p = cellCenter(c[0], c[1]); const f = makeFire(); f.position.set(p.x, 0, p.z); G.add(f); level.fires.push(f); level.lamps.push({ x: p.x, y: 1.2, z: p.z, color: 0xff6a20, power: 22, flick: 2, fire: true }); occ.add(key(c[0], c[1])); }
  }

  // ---- generación de enemigos
  let spawnRooms = roomsByDist.filter(r => r !== map.startRoom); if (!spawnRooms.length) spawnRooms = roomsByDist;
  for (let k = 0; k < M.guards; k++) {
    const room = spawnRooms[(k * 7 + 3) % spawnRooms.length]; const c = freeCell(room, { minStart: 8 }) || freeCell(room); if (!c) continue;
    const other = spawnRooms[(k * 5 + 1 + (R() * 3 | 0)) % spawnRooms.length];
    let path = findPath(map, c[0], c[1], other.cx, other.cy) || [];
    if (path.length > 40) path = path.slice(0, 40);
    const wp = [cellCenter(c[0], c[1])]; for (let s = 3; s < path.length; s += 3) wp.push(cellCenter(path[s].x, path[s].y)); if (path.length) wp.push(cellCenter(path[path.length - 1].x, path[path.length - 1].y));
    level.guardsSpawn.push({ ...cellCenter(c[0], c[1]), wp, sentry: R() < 0.25 || wp.length < 2 });
  }
  const infTotal = [['infected', M.infected], ['runner', M.runners], ['brute', M.brutes]];
  infTotal.forEach(([kind, n]) => {
    for (let k = 0; k < n; k++) {
      const room = spawnRooms[(R() * spawnRooms.length) | 0]; const c = freeCell(room, { minStart: kind === 'brute' ? 12 : 9 }); if (!c) continue; occ.add(key(c[0], c[1]));
      level.infSpawn.push({ kind, ...cellCenter(c[0], c[1]) });
    }
  });
  // escolta / supervivencia
  level.startPos = cellCenter(map.start.x, map.start.y);
  level.arenaCenter = cellCenter(W >> 1, H >> 1);

  // pickups 3D
  level.pickups.forEach(p => { p.mesh = makePickup(p.type); p.mesh.position.set(p.x, 0, p.z); G.add(p.mesh); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(p.mesh.userData.col).multiplyScalar(0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gl.rotation.x = -Math.PI / 2; gl.position.y = 0.025; p.mesh.add(gl); });
  // fondo exterior: siluetas de acantilado más allá del borde
  if (th.outdoor) {
    const rm = mats().rock;
    for (let k = 0; k < 40; k++) {
      const side = k % 4; let x, z;
      if (side === 0) { x = R() * W * CS; z = -3 - R() * 6; } else if (side === 1) { x = R() * W * CS; z = H * CS + 3 + R() * 6; } else if (side === 2) { x = -3 - R() * 6; z = R() * H * CS; } else { x = W * CS + 3 + R() * 6; z = R() * H * CS; }
      const geo = new THREE.IcosahedronGeometry(2 + R() * 3, 1); const m = new THREE.Mesh(geo, rm); m.position.set(x, R() * 1.5, z); m.rotation.set(R() * 6, R() * 6, R() * 6); m.castShadow = false; m.receiveShadow = true; G.add(m);
    }
  }
  return level;
}

function makeExitMarker() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x50ff9a).multiplyScalar(2.5), transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCol: { value: new THREE.Color(0x50ff9a) }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uCol; uniform float uT; varying vec2 vUv; void main(){ float a=(1.0-vUv.y)*0.55*(0.75+0.25*sin(vUv.y*30.0-uT*4.0)); gl_FragColor=vec4(uCol*1.6,a); }',
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 7, 32, 1, true), beamMat); beam.position.y = 3.5; g.add(beam);
  g.userData = { ring, beam, beamMat };
  return g;
}

function makeFire() {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uT: { value: Math.random() * 10 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){ vec2 uv=vUv; float t=uT; float f=n(vec2(uv.x*4.0,uv.y*3.0-t*2.5))*0.6+n(vec2(uv.x*9.0,uv.y*7.0-t*4.0))*0.4;
        float shape=(1.0-uv.y)*smoothstep(0.5,0.0,abs(uv.x-0.5)*(1.2-uv.y*0.6)); float a=smoothstep(0.25,0.7,f*shape*1.6);
        vec3 c=mix(vec3(1.0,0.25,0.02),vec3(1.0,0.85,0.4),smoothstep(0.4,1.0,f*shape*1.8))*3.0; gl_FragColor=vec4(c,a); }`,
  });
  for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.4), mat); p.position.y = 1.15; p.rotation.y = k * Math.PI / 3; g.add(p); }
  g.add(box(1.2, 0.3, 1, mats().dark, 0, 0.15, 0));
  g.userData.mat = mat; return g;
}

// recorte en tramado de muros entre cámara y jugadora
const CUT = { uPlayer: { value: new THREE.Vector3() } };
function addCutaway(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uPlayer = CUT.uPlayer;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 _wp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n_wp=instanceMatrix*_wp;\n#endif\nvWP=(modelMatrix*_wp).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform vec3 uPlayer;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      { vec2 d = vWP.xz - uPlayer.xz; float r = length(vec2(d.x*0.8, d.y));
        if (vWP.z > uPlayer.z + 0.2 && r < 5.0 && vWP.y > 0.5) {
          float k = smoothstep(5.2, 3.0, r);
          vec2 q = mod(floor(gl_FragCoord.xy * 0.5), 4.0);
          float b = mod(q.x * 2.0 + q.y * 3.0 + q.x * q.y, 4.0) / 4.0 + mod(q.x + q.y * 2.0, 4.0) / 16.0;
          if (b < k) discard;
        } }`);
  };
  mat.customProgramCacheKey = () => 'cutaway';
}


function makeShaftMat(col, op) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCol: { value: new THREE.Color(col) }, uOp: { value: op }, uT: { value: 0 } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY=uv.y; vec4 wp=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }',
    fragmentShader: 'uniform vec3 uCol; uniform float uOp; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(vN,vV)),1.6); float a=uOp*pow(vY,1.4)*edge; gl_FragColor=vec4(uCol*1.4,a); }',
  });
}
function makeMistMat(col, layer) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uCol: { value: new THREE.Color(col) }, uT: { value: 0 }, uL: { value: layer } },
    vertexShader: 'varying vec2 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xz; gl_Position=projectionMatrix*viewMatrix*wp; }',
    fragmentShader: `uniform vec3 uCol; uniform float uT,uL; varying vec2 vW;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=0.5;}return v;}
      void main(){ vec2 p=vW*0.09+vec2(uT*0.025*(1.0+uL),uT*0.012); float f=fbm(p+fbm(p*1.7+uT*0.02)); float a=smoothstep(0.42,0.85,f)*(0.20-uL*0.08); gl_FragColor=vec4(uCol*0.55,a); }`,
  });
}
function decorateWalls(map, th, G, R) {
  if (th.outdoor && th.wall === 'rock') return;
  const M = mats(), W = map.W, H = map.H;
  if (!MAT.decor) {
    MAT.decor = {
      pipe: M.metal.clone(), dark: M.dark.clone(), exit: new THREE.MeshStandardMaterial({ color: 0x0a2a14, emissive: 0x30ff70, emissiveIntensity: 3.5 }),
      warn: new THREE.MeshStandardMaterial({ color: 0x2a0a06, emissive: 0xff3a1a, emissiveIntensity: 3 }), hazard: M.hazard.clone(), vent: new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.5, metalness: 0.6 }),
    };
    Object.values(MAT.decor).forEach(addCutaway);
  }
  const D = MAT.decor, hgt = th.wallH;
  const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, CS, 10), boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const put = (geo, mat, x, y, z, sx, sy, sz, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(0, ry, rz); o.castShadow = true; o.receiveShadow = true; G.add(o); return o; };
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    if (map.g[j * W + i] !== 1) continue;
    // cara sur (visible para la cámara) con suelo delante
    if (map.g[(j + 1) * W + i] !== 0) continue;
    const fz = (j + 1) * CS + 0.02, cx = i * CS + CS / 2, r = R();
    if (r < 0.22) { // tuberías horizontales
      put(pipeGeo, D.pipe, cx, hgt * 0.78, fz + 0.12, 1, 1, 1, 0, Math.PI / 2);
      put(pipeGeo, D.pipe, cx, hgt * 0.68, fz + 0.12, 0.7, 1, 0.7, 0, Math.PI / 2);
      if (R() < 0.4) put(boxGeo, D.dark, cx, hgt * 0.73, fz + 0.1, 0.12, 0.4, 0.12);
    } else if (r < 0.28) { // señal de salida de emergencia
      put(boxGeo, D.exit, cx, hgt * 0.85, fz + 0.04, 0.7, 0.26, 0.06);
    } else if (r < 0.36) { // rejilla de ventilación
      put(boxGeo, D.vent, cx, hgt * 0.35, fz + 0.04, 0.9, 0.6, 0.06);
      for (let k = 0; k < 4; k++) put(boxGeo, D.dark, cx, hgt * 0.35 - 0.21 + k * 0.14, fz + 0.08, 0.82, 0.035, 0.04);
    } else if (r < 0.43) { // cuadro eléctrico con piloto
      put(boxGeo, D.dark, cx + (R() - 0.5) * 0.6, 1.4, fz + 0.12, 0.55, 0.75, 0.22);
      put(boxGeo, R() < 0.5 ? D.warn : D.exit, cx + 0.12, 1.62, fz + 0.24, 0.07, 0.07, 0.03);
    } else if (r < 0.48) { // franja de peligro
      put(boxGeo, D.hazard, cx, 0.12, fz + 0.03, CS, 0.24, 0.05);
    }
  }
}
