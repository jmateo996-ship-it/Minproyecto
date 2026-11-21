// ============================================================================
// Personajes: modelos articulados y animación
// ============================================================================
const RIGMAT = {};
function rmat(key, c, r = 0.75, m = 0, e, ei = 0) {
  if (RIGMAT[key]) return RIGMAT[key];
  const o = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  if (e) { o.emissive = new THREE.Color(e); o.emissiveIntensity = ei; }
  return (RIGMAT[key] = o);
}

let _blob = null;
function BLOB_MAT() { return _blob || (_blob = new THREE.MeshBasicMaterial({ map: radialTex('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false })); }
function makeHumanoid(o) {
  const R = rng(o.seed || 1);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const cap = (r, l, m) => { const x = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 18), m); x.castShadow = true; x.receiveShadow = true; return x; };
  const bx = (w, h, d, m) => { const x = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); x.castShadow = true; return x; };
  const sph = (r, m, ws = 14) => { const x = new THREE.Mesh(new THREE.SphereGeometry(r, ws + 6, (ws + 6) * 0.75 | 0), m); x.castShadow = true; return x; };
  const suit = o.suit, vest = o.vest || o.suit, skin = o.skin;
  const hips = new THREE.Group(); hips.position.y = 0.95; body.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  const pelvis = cap(0.17, 0.12, suit); pelvis.rotation.z = Math.PI / 2; pelvis.position.y = 0.02; hips.add(pelvis);
  const chest = cap(0.23, 0.38, vest); chest.position.y = 0.36; chest.scale.set(1.12 * (o.bulk || 1), 1, 0.78 * (o.bulk || 1)); torso.add(chest);
  if (o.pouches) { for (let k = -1; k <= 1; k++) { const p = bx(0.12, 0.12, 0.08, o.pouches); p.position.set(k * 0.13, 0.22, 0.2); torso.add(p); } const bp = bx(0.34, 0.4, 0.14, o.pouches); bp.position.set(0, 0.42, -0.22); torso.add(bp); }
  const neck = cap(0.07, 0.08, skin); neck.position.y = 0.68; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.84; torso.add(head);
  const skull = sph(0.155, skin); skull.scale.set(0.95, 1.08, 1); head.add(skull);
  switch (o.headgear) {
    case 'mask': { // casco + máscara de gas con lentes rojas
      const helm = sph(0.175, rmat('helm', 0x2a2e2a, 0.6, 0.3)); helm.scale.set(1.05, 0.8, 1.1); helm.position.y = 0.06; head.add(helm);
      const mask = bx(0.24, 0.16, 0.12, rmat('mask', 0x15181a, 0.5)); mask.position.set(0, -0.03, 0.12); head.add(mask);
      const lensM = rmat('lens', 0x200000, 0.2, 0, 0xff2a1a, 5);
      [-0.065, 0.065].forEach(x => { const l = sph(0.038, lensM, 10); l.position.set(x, 0.02, 0.18); head.add(l); });
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10), rmat('can', 0x3a3f36, 0.6)); can.rotation.x = Math.PI / 2; can.position.set(0, -0.09, 0.2); head.add(can);
      break; }
    case 'agent': { // capucha táctica + visor de filtro con luz azul
      const hood = sph(0.168, suit); hood.scale.set(1, 1.05, 1.05); hood.position.set(0, 0.01, -0.012); head.add(hood);
      const vis = bx(0.22, 0.07, 0.06, rmat('visor', 0x050a10, 0.1, 0.5, 0x3aa0ff, 2.2)); vis.position.set(0, 0.03, 0.14); head.add(vis);
      const mask = bx(0.18, 0.1, 0.08, rmat('amask', 0x101418, 0.5)); mask.position.set(0, -0.07, 0.13); head.add(mask);
      const hair = cap(0.045, 0.2, rmat('hair', 0x14100c, 0.9)); hair.position.set(0, -0.05, -0.17); hair.rotation.x = 0.4; head.add(hair);
      break; }
    case 'glasses': { const gl = bx(0.2, 0.04, 0.03, rmat('gls', 0x88aacc, 0.1, 0.5, 0x88aacc, 0.4)); gl.position.set(0, 0.03, 0.15); head.add(gl); const hair = sph(0.16, rmat('ghair', 0x9a9a92, 0.9)); hair.scale.set(1, 0.6, 1); hair.position.set(0, 0.08, -0.02); head.add(hair); break; }
    case 'bare': default: { const hair = sph(0.158, rmat('dhair', 0x1a1612, 0.95)); hair.scale.set(1, 0.7, 1.02); hair.position.set(0, 0.05, -0.02); head.add(hair); }
  }
  const mkLimb = (side, upper, lower, r, mU, mL, y, x) => {
    const pivot = new THREE.Group(); pivot.position.set(x * side, y, 0);
    const u = cap(r, upper, mU); u.position.y = -upper / 2 - r * 0.5; pivot.add(u);
    const joint = new THREE.Group(); joint.position.y = -upper - r; pivot.add(joint);
    const l = cap(r * 0.88, lower, mL); l.position.y = -lower / 2 - r * 0.5; joint.add(l);
    return { pivot, joint };
  };
  const legL = mkLimb(-1, 0.36, 0.36, 0.085, suit, suit, -0.02, 0.11), legR = mkLimb(1, 0.36, 0.36, 0.085, suit, suit, -0.02, 0.11);
  [legL, legR].forEach(L => { hips.add(L.pivot); const boot = bx(0.13, 0.1, 0.26, rmat('boot', 0x101010, 0.6)); boot.position.set(0, -0.48, 0.05); L.joint.add(boot); });
  const armL = mkLimb(-1, 0.28, 0.26, 0.068, suit, o.forearm || suit, 0.6, 0.31), armR = mkLimb(1, 0.28, 0.26, 0.068, suit, o.forearm || suit, 0.6, 0.31);
  [armL, armR].forEach(A => { torso.add(A.pivot); const hand = sph(0.06, o.hand || skin, 8); hand.position.y = -0.38; A.joint.add(hand); });
  if (o.gun) { const gun = new THREE.Group(); const gm = rmat('gun', 0x111214, 0.4, 0.6); const b = bx(0.06, 0.1, o.gun === 'rifle' ? 0.7 : 0.26, gm); b.position.z = o.gun === 'rifle' ? 0.2 : 0.08; gun.add(b); if (o.gun === 'pistol') { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 8), gm); s.rotation.x = Math.PI / 2; s.position.z = 0.28; gun.add(s); } gun.position.set(0, -0.4, 0.04); armR.joint.add(gun); g.userData.gun = gun; }
  if (o.nodules) {
    const nm = o.nodMat || mats().spore;
    for (let k = 0; k < o.nodules; k++) {
      const s = sph(0.03 + R() * 0.05 * (o.nodSize || 1), nm, 8);
      const where = R(); let parent = torso;
      if (where < 0.5) { const a = R() * 6.28; s.position.set(Math.cos(a) * 0.24, 0.15 + R() * 0.45, Math.sin(a) * 0.18); }
      else if (where < 0.7) { parent = head; const a = R() * 6.28; s.position.set(Math.cos(a) * 0.15, R() * 0.15, Math.sin(a) * 0.15); }
      else if (where < 0.85) { parent = (R() < 0.5 ? armL : armR).pivot; s.position.set((R() - 0.5) * 0.12, -0.1 - R() * 0.2, (R() - 0.5) * 0.12); }
      else { parent = (R() < 0.5 ? legL : legR).pivot; s.position.set((R() - 0.5) * 0.15, -0.1 - R() * 0.25, (R() - 0.5) * 0.15); }
      parent.add(s);
    }
  }
  // detalles: cinturón, hombreras, rodilleras, correas
  if (o.belt) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 24), o.belt); b.rotation.x = Math.PI / 2; b.scale.set(1.05, 0.8, 1); b.position.y = 0.06; b.castShadow = true; hips.add(b); const buckle = bx(0.06, 0.05, 0.02, rmat('buckle', 0x8a8a80, 0.3, 0.8)); buckle.position.set(0, 0.06, 0.17); hips.add(buckle); const hol = bx(0.08, 0.16, 0.12, o.belt); hol.position.set(0.2, -0.05, 0.02); hips.add(hol); }
  if (o.pads) { [armL, armR].forEach(A => { const sp = sph(0.085, o.pads, 10); sp.scale.set(1.1, 0.7, 1.1); sp.position.y = -0.02; A.pivot.add(sp); }); [legL, legR].forEach(L => { const kp = bx(0.12, 0.12, 0.06, o.pads); kp.position.set(0, 0.02, 0.08); L.joint.add(kp); }); }
  if (o.straps) { [-1, 1].forEach(sd => { const st = bx(0.045, 0.5, 0.02, o.straps); st.position.set(sd * 0.11, 0.42, 0.19); st.rotation.z = sd * 0.12; torso.add(st); }); }
  if (o.lamp) { const l = bx(0.07, 0.07, 0.07, rmat('slamp', 0x101010, 0.3, 0.5, 0x8ad0ff, 5)); l.position.set(-0.18, 0.58, 0.2); torso.add(l); }
  if (o.antenna) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.45, 4), rmat('ant', 0x111111, 0.5)); an.position.set(-0.1, 0.75, -0.25); torso.add(an); }
  if (o.rags) { for (let k = 0; k < 5; k++) { const rg = bx(0.06 + R() * 0.06, 0.18 + R() * 0.2, 0.012, o.rags); const a = R() * 6.28; rg.position.set(Math.cos(a) * 0.22, 0.05, Math.sin(a) * 0.17); rg.rotation.set((R() - .5) * 0.4, -a + Math.PI / 2, (R() - .5) * 0.4); torso.add(rg); } }
  if (o.bloody) { [armL, armR].forEach(A => { const h = sph(0.065, rmat('blood', 0x3a0404, 0.35), 8); h.position.y = -0.38; A.joint.add(h); }); const st = bx(0.22, 0.2, 0.02, rmat('blood', 0x3a0404, 0.35)); st.position.set(0.04, 0.3, 0.2); st.rotation.z = 0.3; torso.add(st); }
  // sombra de contacto
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), BLOB_MAT()); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.025; blob.renderOrder = 1; g.add(blob);
  if (o.coat) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 0.7, 12, 1, true), o.coat); c.position.y = -0.18; c.castShadow = true; c.material.side = THREE.DoubleSide; hips.add(c); }
  g.scale.setScalar(o.scale || 1);
  return { g, body, hips, torso, head, legL, legR, armL, armR, phase: R() * 6, hunch: o.hunch || 0, fall: 0 };
}

// pose: 'walk' (amt 0..1), 'aim', 'crouch', 'reach' (infectados)
function animRig(r, dt, speed, opts = {}) {
  const amt = Math.min(1, speed / 3.5);
  r.phase += dt * (3 + speed * 2.2) * (opts.rate || 1);
  const s = Math.sin(r.phase), c = Math.cos(r.phase);
  const crouch = opts.crouch ? 1 : 0;
  r.crouchK = (r.crouchK || 0) + (crouch - (r.crouchK || 0)) * Math.min(1, dt * 10);
  const ck = r.crouchK;
  r.hips.position.y = 0.95 - ck * 0.32 + Math.abs(c) * 0.05 * amt;
  r.torso.rotation.x = r.hunch + ck * 0.35 + amt * 0.08;
  r.legL.pivot.rotation.x = s * 0.75 * amt - ck * 0.9; r.legR.pivot.rotation.x = -s * 0.75 * amt - ck * 0.9;
  r.legL.joint.rotation.x = Math.max(0, -c) * 1.0 * amt + ck * 1.5; r.legR.joint.rotation.x = Math.max(0, c) * 1.0 * amt + ck * 1.5;
  if (opts.reach) { // brazos hacia delante, temblor
    const j = Math.sin(r.phase * 3.1) * 0.12;
    r.armL.pivot.rotation.x = -1.25 + j; r.armR.pivot.rotation.x = -1.35 - j; r.armL.pivot.rotation.z = 0.15; r.armR.pivot.rotation.z = -0.15;
    r.armL.joint.rotation.x = -0.3; r.armR.joint.rotation.x = -0.2;
    r.head.rotation.z = Math.sin(r.phase * 0.7) * 0.25; r.head.rotation.x = 0.2;
  } else if (opts.aim) {
    r.armR.pivot.rotation.x = -1.5; r.armR.joint.rotation.x = -0.05; r.armR.pivot.rotation.z = 0.05;
    r.armL.pivot.rotation.x = -1.3; r.armL.pivot.rotation.z = -0.55; r.armL.joint.rotation.x = -0.4;
    r.head.rotation.set(0, 0, 0);
  } else {
    r.armL.pivot.rotation.x = -s * 0.6 * amt; r.armR.pivot.rotation.x = s * 0.6 * amt; r.armL.pivot.rotation.z = 0.08; r.armR.pivot.rotation.z = -0.08;
    r.armL.joint.rotation.x = -0.3 - amt * 0.3; r.armR.joint.rotation.x = -0.3 - amt * 0.3;
    r.head.rotation.set(0, 0, 0);
  }
  if (opts.recoil) { r.armR.pivot.rotation.x -= opts.recoil * 0.4; r.torso.rotation.x -= opts.recoil * 0.06; }
}

function animDeath(r, dt) {
  r.fall = Math.min(1, r.fall + dt * 2.2);
  const k = 1 - Math.pow(1 - r.fall, 3);
  r.body.rotation.x = -k * Math.PI / 2 * 0.98; r.body.position.y = k * 0.18; r.body.position.z = -k * 0.4;
  r.armL.pivot.rotation.x = -k * 2.6; r.armR.pivot.rotation.x = -k * 2.4;
  r.legL.pivot.rotation.x = 0; r.legR.pivot.rotation.x = k * 0.3; r.legL.joint.rotation.x = 0; r.legR.joint.rotation.x = k * 0.4;
}

function buildActorModel(kind, seed) {
  const M = mats();
  switch (kind) {
    case 'player': return makeHumanoid({ seed, suit: rmat('psuit', 0x1b222c, 0.8), vest: rmat('pvest', 0x27303a, 0.7), skin: rmat('pskin', 0xb08a72, 0.7), headgear: 'agent', gun: 'pistol', pouches: rmat('ppouch', 0x343c30, 0.8), hand: rmat('glove', 0x111111, 0.7), belt: rmat('pbelt', 0x15181c, 0.6), pads: rmat('ppad', 0x2a3038, 0.5, 0.2), straps: rmat('pstrap', 0x101216, 0.7), lamp: true, scale: 1 });
    case 'guard': return makeHumanoid({ seed, suit: rmat('gsuit', 0x3a3d36, 0.85), vest: rmat('gvest', 0x2a2d27, 0.7), skin: rmat('gskin', 0x9a7a66, 0.7), headgear: 'mask', gun: 'rifle', pouches: rmat('gpouch', 0x222520, 0.8), hand: rmat('glove', 0x111111, 0.7), belt: rmat('gbelt', 0x1a1c18, 0.6), pads: rmat('gpad', 0x24271f, 0.6), antenna: true, scale: 1.04 });
    case 'novak': return makeHumanoid({ seed, suit: rmat('nsuit', 0x2a3038, 0.8), vest: rmat('coat', 0xb8bcb4, 0.85), skin: rmat('nskin', 0xa48a7a, 0.7), headgear: 'glasses', coat: rmat('coat', 0xb8bcb4, 0.85), nodules: 3, nodSize: 0.6 });
    case 'infected': {
      const R = rng(seed), cols = [0x4a4038, 0x3a4048, 0x5a5a50, 0x8a8a84, 0x403a44];
      return makeHumanoid({ seed, suit: rmat('isuit' + (seed % 5), cols[seed % 5], 0.95), vest: rmat('ivest' + (seed % 4), [0x6a6458, 0x7a7a70, 0x3a3e40, 0x9a968c][seed % 4], 0.95), skin: rmat('iskin', 0x8a8070, 0.9), forearm: rmat('iskin', 0x8a8070, 0.9), headgear: 'bare', nodules: 9 + (R() * 6 | 0), rags: rmat('irag', 0x3a342c, 0.95), bloody: true, hunch: 0.35, scale: 0.98 + R() * 0.08 });
    }
    case 'runner': return makeHumanoid({ seed, suit: rmat('rsuit', 0x2a2420, 0.95), vest: rmat('rvest', 0x4a3a30, 0.95), skin: rmat('rskin', 0x7a5a50, 0.85), forearm: rmat('rskin', 0x7a5a50, 0.85), headgear: 'bare', nodules: 18, nodSize: 1.2, rags: rmat('irag', 0x3a342c, 0.95), bloody: true, hunch: 0.55, scale: 0.94 });
    case 'brute': return makeHumanoid({ seed, suit: rmat('bsuit', 0x2a2a28, 0.95), vest: rmat('bskin', 0x6a5a50, 0.9), skin: rmat('bskin', 0x6a5a50, 0.9), forearm: rmat('bskin', 0x6a5a50, 0.9), headgear: 'bare', nodules: 34, nodSize: 2.2, hunch: 0.3, bulk: 1.5, scale: 1.55 });
    case 'boss': return makeHumanoid({ seed, suit: rmat('vsuit', 0x1a1c1a, 0.8), vest: rmat('vcoat', 0x262a26, 0.8), skin: rmat('vskin', 0x6a5048, 0.85), forearm: rmat('vskin', 0x6a5048, 0.85), headgear: 'bare', coat: rmat('vcoat2', 0x202420, 0.8), nodules: 46, nodSize: 2.6, nodMat: M.sporeGlow, hunch: 0.15, bulk: 1.6, scale: 1.95 });
  }
}
