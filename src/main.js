// ============================================================================
// Núcleo: render, bucle, jugadora, IA, combate, objetivos e interfaz
// ============================================================================
const $ = (id) => document.getElementById(id);
const canvas = $('game');
const QUALITY = {
  ultra: { name: 'Ultra', pr: 2, smaa: true, ao: true, shadow: 2048, spots: 2, tex: 1024 },
  alta: { name: 'Alta', pr: 1.5, smaa: true, ao: false, shadow: 1024, spots: 1, tex: 1024 },
  media: { name: 'Media', pr: 1, smaa: false, ao: false, shadow: 1024, spots: 0, tex: 512 },
};
let QKEY = 'ultra';
try { const q = localStorage.getItem('protocolo-ceniza-q'); if (q && QUALITY[q]) QKEY = q; else if (matchMedia('(pointer: coarse)').matches) QKEY = 'media'; } catch (e) { }
const Q = QUALITY[QKEY]; TEXSIZE = Q.tex;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
let PR = Math.min(window.devicePixelRatio || 1, Q.pr);
renderer.setPixelRatio(PR); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 160);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uDamage: { value: 0 }, uAlert: { value: 0 }, uFade: { value: 1 }, uSat: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uDamage,uAlert,uFade,uSat; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv=vUv; vec2 d=uv-0.5; float r=length(d*vec2(uRes.x/uRes.y,1.0))*0.9;
      float ab=0.0015+r*r*0.006+uDamage*0.012;
      vec3 c; c.r=texture2D(tDiffuse,uv+d*ab).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-d*ab).b;
      float l=dot(c,vec3(0.299,0.587,0.114));
      c=mix(vec3(l),c,uSat);
      c=mix(c,c*vec3(0.86,1.0,1.12),smoothstep(0.45,0.0,l)*0.55);
      c=mix(c,c*vec3(1.08,1.0,0.9),smoothstep(0.35,1.0,l)*0.35);
      c=(c-0.5)*1.06+0.5;
      c*=1.0-smoothstep(0.32,1.0,r)*0.78;
      c=mix(c,vec3(0.35,0.0,0.0),smoothstep(0.25,0.95,r)*uDamage*0.85);
      c+=vec3(0.22,0.0,0.0)*uAlert*smoothstep(0.35,1.0,r);
      c+=(hash(uv*uRes+fract(uTime*7.13)*100.0)-0.5)*0.055;
      c*=0.985+0.015*sin(uv.y*uRes.y*1.5);
      gl_FragColor=vec4(max(c,0.0)*uFade,1.0);
    }`,
};
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// oclusión ambiental (excluye volúmenes de luz, partículas y otros elementos transparentes)
class AOPass extends GTAOPass {
  overrideVisibility() { const c = this._visibilityCache; this.scene.traverse(o => { c.set(o, o.visible); if (o.isPoints || o.isLine || (o.material && (o.material.transparent || o.material.isShaderMaterial))) o.visible = false; }); }
}
let aoPass = null;
if (Q.ao) {
  aoPass = new AOPass(scene, camera, innerWidth, innerHeight);
  aoPass.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.4, thickness: 1.2, scale: 1.25, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
  aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  aoPass.blendIntensity = 0.9;
  composer.addPass(aoPass);
}
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.75, 0.55, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
let smaa = null; if (Q.smaa) { smaa = new SMAAPass(innerWidth * PR, innerHeight * PR); composer.addPass(smaa); }
const grade = new ShaderPass(GradeShader); composer.addPass(grade);
composer.setPixelRatio(PR); composer.setSize(innerWidth, innerHeight);

// ---- luces
const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.4); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xa8c0ee, 1); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 }); moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.04;
scene.add(moon, moon.target);
const flash = new THREE.SpotLight(0xfff0d8, 110, 32, 0.5, 0.55, 1.3); flash.castShadow = true; flash.shadow.mapSize.set(Q.shadow, Q.shadow);
flash.shadow.camera.near = 0.3; flash.shadow.camera.far = 32; flash.shadow.bias = -0.0004; flash.shadow.normalBias = 0.03; scene.add(flash, flash.target);
const LPOOL = []; for (let i = 0; i < 6; i++) { const L = new THREE.PointLight(0xffffff, 0, 16, 2); scene.add(L); LPOOL.push(L); }
// lámparas de techo con sombra real (las más cercanas)
const SPOOL = []; for (let i = 0; i < Q.spots; i++) { const L = new THREE.SpotLight(0xffffff, 0, 18, 1.15, 0.65, 2); L.castShadow = true; L.shadow.mapSize.set(Q.shadow / 2, Q.shadow / 2); L.shadow.camera.near = 0.3; L.shadow.camera.far = 18; L.shadow.bias = -0.0005; L.shadow.normalBias = 0.03; scene.add(L, L.target); SPOOL.push(L); }
const muzzle = new THREE.PointLight(0xffc070, 0, 12, 2); scene.add(muzzle);
const eMuzzle = new THREE.PointLight(0xffb060, 0, 12, 2); scene.add(eMuzzle);
const blast = new THREE.PointLight(0xff8a30, 0, 34, 1.5); scene.add(blast);

// cono volumétrico de la linterna
const beamMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uOn: { value: 1 }, uT: { value: 0 } },
  vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform float uOn,uT; varying vec3 vP; void main(){ float t=clamp((vP.y+6.0)/12.0,0.0,1.0); float a=pow(t,2.2)*0.07*uOn; a*=0.8+0.2*sin(vP.y*3.0+uT*2.0+vP.x*4.0); gl_FragColor=vec4(vec3(1.0,0.93,0.8),a); }`,
});
const beam = new THREE.Mesh(new THREE.ConeGeometry(3.4, 12, 24, 1, true), beamMat); beam.renderOrder = 5; scene.add(beam);
const laserMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2010).multiplyScalar(3), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
const laser = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 1), laserMat); scene.add(laser);
const laserDot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), laserMat); scene.add(laserDot);

// ---- partículas
const PART = (() => {
  const N = 1800, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = Math.random() * 44 - 22; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = Math.random() * 36 - 18; seed[i] = Math.random(); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: new THREE.Color(1, 1, 1) }, uSize: { value: 1 }, uOp: { value: 0.6 }, uT: { value: 0 } },
    vertexShader: 'attribute float seed; uniform float uSize,uT; varying float vS; void main(){ vS=seed; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=uSize*(0.5+seed)*(320.0/-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 uCol; uniform float uOp,uT; varying float vS; void main(){ vec2 c=gl_PointCoord-0.5; float a=smoothstep(0.5,0.0,length(c)); a*=uOp*(0.6+0.4*sin(uT*3.0+vS*40.0)); gl_FragColor=vec4(uCol,a); }',
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  let mode = 'snow';
  return {
    set(m) {
      mode = m; pts.visible = m !== 'none';
      const cfg = { snow: [0xdfe8ff, 0.55, 0.6], spores: [0xff8a2a, 0.5, 0.75], embers: [0xff7a20, 0.45, 0.95], dust: [0xbfc8d0, 0.4, 0.2] }[m] || [0xffffff, 1, 0.5];
      mat.uniforms.uCol.value.set(cfg[0]); mat.uniforms.uSize.value = cfg[1]; mat.uniforms.uOp.value = cfg[2];
      geo.setDrawRange(0, m === 'snow' ? N : m === 'dust' ? 600 : 550);
    },
    update(dt, cx, cz, t) {
      mat.uniforms.uT.value = t;
      for (let i = 0; i < N; i++) {
        const k = i * 3, s = seed[i];
        if (mode === 'snow') { pos[k + 1] -= dt * (1.2 + s * 1.2); pos[k] += dt * (Math.sin(t * 0.7 + s * 30) * 0.8 + 0.9); }
        else if (mode === 'embers') { pos[k + 1] += dt * (0.8 + s * 1.5); pos[k] += Math.sin(t * 2 + s * 50) * dt * 0.8; }
        else { pos[k + 1] += Math.sin(t * 0.5 + s * 20) * dt * 0.15; pos[k] += Math.cos(t * 0.3 + s * 10) * dt * 0.2; pos[k + 2] += Math.sin(t * 0.4 + s * 7) * dt * 0.2; }
        if (pos[k + 1] < 0) pos[k + 1] += 9; if (pos[k + 1] > 9) pos[k + 1] -= 9;
        let dx = pos[k] - cx; if (dx > 22) pos[k] -= 44; else if (dx < -22) pos[k] += 44;
        let dz = pos[k + 2] - cz; if (dz > 18) pos[k + 2] -= 36; else if (dz < -18) pos[k + 2] += 36;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
})();

// ---- efectos (trazadoras, sangre, anillos de ruido, explosiones)
const FX = [];
const tracerGeo = new THREE.BoxGeometry(0.035, 0.035, 1);
const ringGeo = new THREE.RingGeometry(0.92, 1, 48);
const bloodMat = new THREE.MeshBasicMaterial({ map: bloodTex(), transparent: true, depthWrite: false, opacity: 0.9 });
const sparkGeo = new THREE.SphereGeometry(0.05, 6, 4);
const decals = [];
function fxTracer(x0, z0, x1, z1, col = 0xffd890, y = 1.25) {
  const m = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const L = Math.hypot(x1 - x0, z1 - z0); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.scale.z = L; m.rotation.y = Math.atan2(x1 - x0, z1 - z0);
  scene.add(m); FX.push({ m, t: 0.07, life: 0.07, kind: 'fade' });
}
function fxRing(x, z, r, col = 0xf0b44c) {
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z); scene.add(m); FX.push({ m, t: 0.6, life: 0.6, kind: 'ring', r });
}
function fxSparks(x, y, z, col = 0xffc070, n = 6, spd = 4) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(3), transparent: true })); m.position.set(x, y, z); scene.add(m); FX.push({ m, t: 0.35, life: 0.35, kind: 'spark', v: new THREE.Vector3((Math.random() - 0.5) * spd, Math.random() * spd * 0.6, (Math.random() - 0.5) * spd) }); }
}
function fxBlood(x, z, col = 0x5a0606, big = false) {
  fxSparks(x, 1.1, z, col, big ? 10 : 5, 3);
  const d = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bloodMat); const s = (big ? 1.4 : 0.7) + Math.random() * 0.6;
  d.scale.set(s, s, 1); d.rotation.x = -Math.PI / 2; d.rotation.z = Math.random() * 6; d.position.set(x + (Math.random() - .5) * 0.6, 0.02 + decals.length * 0.0001, z + (Math.random() - .5) * 0.6);
  scene.add(d); decals.push(d); if (decals.length > 70) { const o = decals.shift(); scene.remove(o); o.geometry.dispose(); }
}
function fxExplosion(x, z, scale = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a30).multiplyScalar(5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.set(x, 1, z); scene.add(m); FX.push({ m, t: 0.7, life: 0.7, kind: 'boom', s: 4.5 * scale });
  fxSparks(x, 1, z, 0xffa040, 26, 12); fxRing(x, z, 9 * scale, 0xff8a30);
  blast.position.set(x, 2.5, z); blast.intensity = 900 * scale; G.shake = Math.max(G.shake, 1.1 * scale);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(4.5 * scale, 4.5 * scale), new THREE.MeshBasicMaterial({ map: radialTex('rgba(0,0,0,0.9)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
  sc.rotation.x = -Math.PI / 2; sc.position.set(x, 0.022, z); scene.add(sc); decals.push(sc);
}
function updFX(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i]; f.t -= dt; const k = Math.max(0, f.t / f.life);
    if (f.kind === 'fade') f.m.material.opacity = k;
    else if (f.kind === 'ring') { const s = f.r * (1 - k * k); f.m.scale.set(s, s, s); f.m.material.opacity = k * 0.8; }
    else if (f.kind === 'spark') { f.v.y -= 12 * dt; f.m.position.addScaledVector(f.v, dt); if (f.m.position.y < 0.05) { f.m.position.y = 0.05; f.v.multiplyScalar(0.3); } f.m.material.opacity = k; }
    else if (f.kind === 'boom') { const s = f.s * (1 - k * k * k) + 0.3; f.m.scale.set(s, s * 0.7, s); f.m.material.opacity = k; }
    if (f.t <= 0) { scene.remove(f.m); if (f.m.geometry !== tracerGeo && f.m.geometry !== ringGeo && f.m.geometry !== sparkGeo) f.m.geometry.dispose(); f.m.material.dispose(); FX.splice(i, 1); }
  }
  muzzle.intensity *= Math.pow(0.0005, dt); eMuzzle.intensity *= Math.pow(0.0005, dt); blast.intensity *= Math.pow(0.02, dt);
}

// ---- conos de visión en el suelo
const CONE_N = 14;
function makeCone() {
  const geo = new THREE.BufferGeometry(); const p = new Float32Array((CONE_N + 2) * 3); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const idx = []; for (let i = 1; i <= CONE_N; i++) idx.push(0, i, i + 1); geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x40c0ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.position.y = 0.05; scene.add(m); return m;
}
function updCone(a, range, half) {
  const p = a.cone.geometry.attributes.position.array, map = G.level.map;
  p[0] = a.x; p[1] = 0; p[2] = a.z;
  for (let i = 0; i <= CONE_N; i++) {
    const ang = a.yaw - half + (2 * half) * i / CONE_N, dx = Math.sin(ang), dz = Math.cos(ang);
    const d = rayWall(map, a.x, a.z, dx, dz, range);
    p[(i + 1) * 3] = a.x + dx * d; p[(i + 1) * 3 + 1] = 0; p[(i + 1) * 3 + 2] = a.z + dz * d;
  }
  a.cone.geometry.attributes.position.needsUpdate = true;
  a.coneAng = half; a.coneR = range;
}

// ============================================================================
// Estado
// ============================================================================
const G = { mode: 'boot', paused: false, t: 0, shake: 0, dmgFx: 0, actors: [], level: null, M: null, idx: 0, player: null, subQ: [], sub: null, items: {}, stage: 0 };
const keys = {}; const mouse = { x: innerWidth / 2, y: innerHeight / 2, left: false, right: false };
const touch = { on: false, mx: 0, mz: 0, ax: 0, az: 0, fire: false };
let SAVE = { unlocked: 1, ranks: {} };
try { const s = JSON.parse(localStorage.getItem('protocolo-ceniza') || 'null'); if (s && s.unlocked) SAVE = s; } catch (e) { }
function save() { try { localStorage.setItem('protocolo-ceniza', JSON.stringify(SAVE)); } catch (e) { } }

const lerpAng = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };
const angDiff = (a, b) => Math.abs((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ============================================================================
// Carga de misión
// ============================================================================
function clearLevel() {
  if (G.level) { scene.remove(G.level.group); G.level.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  G.actors.forEach(a => { scene.remove(a.rig.g); if (a.cone) scene.remove(a.cone); });
  if (G.player) scene.remove(G.player.rig.g);
  G.actors = []; G.player = null;
  FX.forEach(f => scene.remove(f.m)); FX.length = 0;
  decals.forEach(d => scene.remove(d)); decals.length = 0;
  $('tags').innerHTML = '';
}

function loadMission(idx, preview = false) {
  clearLevel();
  const M = MISSIONS[idx]; G.M = M; G.idx = idx;
  const L = buildLevel(M, scene); G.level = L; const th = L.th;
  scene.fog = new THREE.FogExp2(th.fog, th.fogD); scene.background = new THREE.Color(th.bg || th.fog);
  hemi.color.set(th.hemi[0]); hemi.groundColor.set(th.hemi[1]); hemi.intensity = th.hemi[2];
  if (th.moon) { moon.color.set(th.moon[0]); moon.intensity = th.moon[1]; moon.castShadow = true; } else { moon.intensity = 0; moon.castShadow = false; }
  PART.set(th.particles || 'dust');
  // intensidad de reflejos del entorno
  L.group.traverse(o => { if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = th.outdoor ? 0.35 : 0.22; });
  Object.values(RIGMAT).forEach(m => m.envMapIntensity = 0.3);
  // jugadora
  const P = G.player = {
    x: L.startPos.x, z: L.startPos.z, vx: 0, vz: 0, yaw: Math.PI / 2, r: 0.38, hp: 100, crouch: false, run: false, lamp: true,
    weapon: 'pistol', mag: { pistol: 12, shotgun: 6 }, res: { pistol: 24, shotgun: M.id >= 4 ? 6 : 0 }, hasShotgun: M.id >= 4, med: 1,
    fireT: 0, reloadT: 0, stepT: 0, inv: 0, recoil: 0, cqcT: 0, rig: buildActorModel('player', 7), aimX: 0, aimZ: 0, faction: 'p', alive: true,
  };
  if (M.boss) { P.res.pistol = 60; P.res.shotgun = 18; P.med = 3; }
  scene.add(P.rig.g);
  P.aimX = P.x + 5; P.aimZ = P.z;
  G.items = {}; G.stage = 0; G.stageCount = 0; G.alarm = false; G.alarmT = 0; G.evadeT = 0; G.caution = 0; G.forceAlarm = false; G.lastKnown = null;
  G.time = 0; G.stats = { alerts: 0, kills: 0, takedowns: 0, infKills: 0, damage: 0, docs: 0, shots: 0 };
  G.subQ = []; G.sub = null; $('subs').innerHTML = '';
  G.survT = M.survive || 0; G.escT = M.escape || 0; G.waveT = 3; G.bossDeadT = 0; G.boss = null; G.ammoT = 15; G.done = false; G.failT = 0;
  G.plants = [];
  // enemigos
  L.guardsSpawn.forEach(s => spawn('guard', s.x, s.z, { wp: s.wp, sentry: s.sentry }));
  L.infSpawn.forEach(s => spawn(s.kind, s.x, s.z, { dormant: !!M.dormant }));
  if (M.escort) { const n = spawn('novak', P.x - 1.2, P.z + 0.6); G.novak = n; } else G.novak = null;
  if (M.survive) {
    const c = L.arenaCenter; const t = makeTarget('terminal'); t.position.set(c.x, 0, c.z); L.group.add(t);
    L.map.g[Math.floor(c.z / CS) * L.map.W + Math.floor(c.x / CS)] = 2;
    L.lamps.push({ x: c.x, y: 2, z: c.z, color: 0x40ffa0, power: 14, flick: 0 });
    G.novak = spawn('novak', c.x, c.z + 1.6, { static: true }); G.novak.hp = G.novak.maxHp = 260;
    P.x = c.x + 3; P.z = c.z + 3; P.med = 2;
  }
  if (M.boss) { const c = L.arenaCenter; G.boss = spawn('boss', c.x, c.z - 4); }
  P.rig.g.position.set(P.x, 0, P.z);
  // cámara inicial
  camLook.set(P.x, 0, P.z); camera.position.set(P.x, 18, P.z + 12); camera.lookAt(camLook);
  if (!preview) SFX.ambient(th.wall === 'rock' ? 'snow' : M.theme);
  G.preview = preview;
}

function spawn(kind, x, z, o = {}) {
  const rig = buildActorModel(kind, (Math.random() * 1e6) | 0); scene.add(rig.g);
  const base = { kind, x, z, yaw: Math.random() * 6.28, rig, alive: true, t: Math.random() * 5, atkT: 0, fireT: 1, sus: 0, path: null, pathT: 0, state: 'idle', moveSpd: 0, tagT: 0, hitT: 0 };
  const S = {
    guard: { hp: 100, r: 0.38, faction: 'm' }, infected: { hp: 70, r: 0.38, faction: 'i', walk: 0.9, chase: 2.6, dmg: 12 }, runner: { hp: 45, r: 0.36, faction: 'i', walk: 1.3, chase: 4.7, dmg: 9 },
    brute: { hp: 420, r: 0.75, faction: 'i', walk: 1.0, chase: 2.4, dmg: 30 }, novak: { hp: 170, r: 0.36, faction: 'p' }, boss: { hp: 2100, r: 1.05, faction: 'i', chase: 2.5, dmg: 22 },
  }[kind];
  const a = Object.assign(base, S, { maxHp: S.hp }, o);
  if (kind === 'guard') { a.state = o.sentry ? 'sentry' : 'patrol'; a.baseYaw = a.yaw; a.wpi = 0; a.wdir = 1; a.waitT = 0; a.cone = makeCone(); }
  if (a.faction === 'i' && kind !== 'boss') a.state = o.dormant ? 'dormant' : 'wander';
  if (kind === 'boss') { a.state = 'walk'; a.chargeT = 4; a.burstT = 8; a.summonT = 14; a.stunT = 0; }
  if (kind === 'novak') a.state = o.static ? 'static' : 'follow';
  rig.g.position.set(x, 0, z);
  G.actors.push(a); return a;
}

// ============================================================================
// Percepción, ruido y alarma
// ============================================================================
function makeNoise(x, z, radius, src) {
  for (const a of G.actors) {
    if (!a.alive) continue; const d = Math.hypot(a.x - x, a.z - z); if (d > radius) continue;
    if (a.faction === 'i' && a.kind !== 'boss') {
      if (a.state === 'dormant' && radius < 9 && d > 3.2) continue;
      if (a.state !== 'chase') { a.state = 'hunt'; a.huntP = { x: x + (Math.random() - .5) * 2, z: z + (Math.random() - .5) * 2 }; a.path = null; if (a.kind === 'runner' && Math.random() < 0.5) SFX.screech(dist(a, G.player), pan(a)); }
    } else if (a.kind === 'guard' && src !== 'guard' && src !== 'gen') {
      if (['patrol', 'sentry', 'return', 'suspicious', 'search'].includes(a.state)) {
        if (a.state !== 'suspicious') { showTag(a, '?'); }
        a.state = 'suspicious'; a.inv = { x, z }; a.invT = 7; a.path = null; a.sus = Math.max(a.sus, 0.4);
      }
    }
  }
  if (src === 'player') fxRing(x, z, radius, radius > 12 ? 0xff6040 : 0xf0b44c);
}
function pan(a) { return Math.max(-1, Math.min(1, (a.x - G.player.x) / 14)); }

function raiseAlarm(by) {
  if (G.M.survive || G.M.boss) return;
  if (!G.alarm) { G.stats.alerts++; SFX.alert(); SFX.setMusic(2); if (by) showTag(by, '!'); toast('¡ALERTA!', true); }
  G.alarm = true; G.alarmT = 22; G.evadeT = 0; G.lastKnown = { x: G.player.x, z: G.player.z };
  G.actors.forEach(a => { if (a.kind === 'guard' && a.alive) { a.state = 'alert'; a.sus = 1; a.path = null; } });
}

function guardSees(a, P, range) {
  const dx = P.x - a.x, dz = P.z - a.z, d = Math.hypot(dx, dz);
  if (d > range) return false;
  const cosA = (dx * Math.sin(a.yaw) + dz * Math.cos(a.yaw)) / (d || 1);
  if (d > 1.4 && cosA < Math.cos(a.state === 'alert' ? 1.4 : 0.8)) return false;
  return losClear(G.level.map, a.x, a.z, P.x, P.z);
}

// ============================================================================
// Movimiento genérico
// ============================================================================
function steerTo(a, tx, tz, spd, dt) {
  const map = G.level.map; const d = Math.hypot(tx - a.x, tz - a.z); if (d < 0.2) { a.moveSpd = 0; return d; }
  let gx = tx, gz = tz;
  if (d > 1.2 && !losClear(map, a.x, a.z, tx, tz)) {
    a.pathT -= dt;
    const tk = Math.floor(tx / CS) + ',' + Math.floor(tz / CS);
    if (!a.path || a.pathT <= 0 || a.pathKey !== tk) {
      a.path = findPath(map, Math.floor(a.x / CS), Math.floor(a.z / CS), Math.floor(tx / CS), Math.floor(tz / CS)) || []; a.pathT = 0.8 + Math.random() * 0.4; a.pathKey = tk;
    }
    while (a.path.length > 1) { const c = cellCenter(a.path[1].x, a.path[1].y); if (losClear(map, a.x, a.z, c.x, c.z)) a.path.shift(); else break; }
    if (a.path.length) { const c = cellCenter(a.path[0].x, a.path[0].y); if (Math.hypot(c.x - a.x, c.z - a.z) < 0.4) a.path.shift(); gx = c.x; gz = c.z; }
  }
  const dx = gx - a.x, dz = gz - a.z, L = Math.hypot(dx, dz) || 1, step = Math.min(spd * dt, L);
  a.x += dx / L * step; a.z += dz / L * step; collide(map, a, a.r);
  a.yaw = lerpAng(a.yaw, Math.atan2(dx, dz), Math.min(1, dt * 7));
  a.moveSpd = spd; return d;
}
function separate() {
  const all = G.actors.filter(a => a.alive); all.push(G.player);
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = a.r + b.r;
    if (d < m && d > 0.001) { const p = (m - d) / 2, nx = dx / d, nz = dz / d; const wa = a === G.player ? 0.3 : 1, wb = b === G.player ? 0.3 : 1; a.x -= nx * p * wa; a.z -= nz * p * wa; b.x += nx * p * wb; b.z += nz * p * wb; }
  }
  const map = G.level.map; all.forEach(a => collide(map, a, a.r));
}

// ============================================================================
// Combate
// ============================================================================
function hitscan(x, z, dx, dz, range, ignore) {
  const wd = rayWall(G.level.map, x, z, dx, dz, range); let best = null, bt = wd;
  for (const a of G.actors) {
    if (!a.alive || a === ignore || a.kind === 'novak') continue;
    const ox = a.x - x, oz = a.z - z, t = ox * dx + oz * dz; if (t < 0 || t > bt) continue;
    const px = ox - dx * t, pz = oz - dz * t, d2 = px * px + pz * pz, r = a.r + 0.12;
    if (d2 < r * r) { const tt = t - Math.sqrt(r * r - d2); if (tt < bt) { bt = tt; best = a; } }
  }
  return { a: best, d: bt };
}
function damageActor(a, dmg, fromPlayer, kx = 0, kz = 0) {
  if (!a.alive) return;
  if (a.kind === 'boss') { dmg *= a.stunT > 0 ? 2.5 : 1; a.flashT = 0.1; }
  a.hp -= dmg; a.hitT = 0.15;
  if (a.kind !== 'boss') { a.x += kx; a.z += kz; collide(G.level.map, a, a.r); }
  fxBlood(a.x, a.z, a.faction === 'i' ? 0x4a1a06 : 0x5a0606);
  if (a.hp <= 0) { killActor(a, fromPlayer); return; }
  if (fromPlayer) {
    if (a.kind === 'guard') { if (a.state !== 'alert') raiseAlarm(a); }
    else if (a.faction === 'i' && a.kind !== 'boss') { a.state = 'chase'; a.target = G.player; }
  }
}
function killActor(a, fromPlayer, silent) {
  a.alive = false; a.state = 'dead'; a.rig.fall = 0;
  if (a.cone) a.cone.visible = false;
  if (fromPlayer) { if (a.kind === 'guard') G.stats.kills++; else if (a.faction === 'i') G.stats.infKills++; }
  if (a.faction === 'i' && !silent) SFX.groan(dist(a, G.player), pan(a), a.kind === 'brute' ? 0.6 : 1.3);
  if (a.kind === 'novak') fail('El Dr. Novak ha muerto. Sin él no hay pruebas.');
  if (a.kind === 'boss') { G.bossDeadT = 2.5; SFX.roar(); fxExplosion(a.x, a.z, 0.6); }
  if (a.tagEl) { a.tagEl.remove(); a.tagEl = null; }
}
function damagePlayer(n, sx, sz) {
  const P = G.player; if (P.hp <= 0 || G.done) return;
  if (P.inv > 0) return; P.inv = 0.25;
  P.hp = Math.max(0, P.hp - n); G.stats.damage += n; G.dmgFx = Math.min(1, G.dmgFx + n / 30); G.shake = Math.max(G.shake, 0.35);
  SFX.hurt(); fxBlood(P.x, P.z, 0x6a0606);
  if (sx !== undefined) { const dx = P.x - sx, dz = P.z - sz, d = Math.hypot(dx, dz) || 1; P.vx += dx / d * n * 0.25; P.vz += dz / d * n * 0.25; }
  if (P.hp <= 0) { P.alive = false; P.rig.fall = 0; setTimeout(() => fail('Sílex ha caído. Thule-7 guarda sus secretos.'), 1600); }
}
function explode(x, z, r, dmg, scale = 1) {
  fxExplosion(x, z, scale); SFX.explosion(Math.hypot(x - G.player.x, z - G.player.z));
  makeNoise(x, z, 40, 'explosion');
  for (const a of G.actors) { if (!a.alive) continue; const d = Math.hypot(a.x - x, a.z - z); if (d < r) { const k = 1 - d / r; damageActor(a, dmg * k + 10, false, (a.x - x) / (d || 1) * k * 2, (a.z - z) / (d || 1) * k * 2); } }
  const d = Math.hypot(G.player.x - x, G.player.z - z); if (d < r) damagePlayer(Math.round(dmg * (1 - d / r) * 0.6) + 5, x, z);
}

const WEAP = {
  pistol: { name: 'Pistola · silenciada', mag: 12, rate: 0.24, dmg: 34, spread: 0.035, pellets: 1, noise: 5.5, range: 30, reload: 1.15 },
  shotgun: { name: 'Escopeta táctica', mag: 6, rate: 0.85, dmg: 17, spread: 0.16, pellets: 7, noise: 26, range: 13, reload: 1.9 },
};
function playerFire() {
  const P = G.player, W = WEAP[P.weapon];
  if (P.fireT > 0 || P.reloadT > 0) return;
  if (P.mag[P.weapon] <= 0) { SFX.empty(); P.fireT = 0.3; startReload(); return; }
  P.mag[P.weapon]--; P.fireT = W.rate; P.recoil = 1; G.stats.shots++;
  const gx = P.x + Math.sin(P.yaw) * 0.6 + Math.cos(P.yaw) * 0.12, gz = P.z + Math.cos(P.yaw) * 0.6 - Math.sin(P.yaw) * 0.12;
  const aimK = mouse.right ? 0.4 : 1;
  for (let k = 0; k < W.pellets; k++) {
    const ang = P.yaw + (Math.random() - 0.5) * 2 * W.spread * aimK * (P.run ? 1.8 : 1);
    const dx = Math.sin(ang), dz = Math.cos(ang); const h = hitscan(gx, gz, dx, dz, W.range);
    const ex = gx + dx * h.d, ez = gz + dz * h.d;
    fxTracer(gx, gz, ex, ez, P.weapon === 'pistol' ? 0xffe0a0 : 0xffb070);
    if (h.a) {
      let dmg = W.dmg; if (P.weapon === 'shotgun') dmg *= Math.max(0.35, 1 - h.d / W.range);
      damageActor(h.a, dmg, true, dx * (P.weapon === 'shotgun' ? 0.25 : 0.06), dz * (P.weapon === 'shotgun' ? 0.25 : 0.06));
    } else if (h.d < W.range - 0.1) fxSparks(ex, 1.2, ez, 0xffd090, 3, 3);
  }
  muzzle.position.set(gx, 1.3, gz); muzzle.intensity = P.weapon === 'pistol' ? 14 : 60;
  if (P.weapon === 'pistol') SFX.pistol(); else { SFX.shotgun(); G.shake = Math.max(G.shake, 0.25); }
  makeNoise(P.x, P.z, W.noise, 'player');
}
function startReload() {
  const P = G.player, W = WEAP[P.weapon];
  if (P.reloadT > 0 || P.mag[P.weapon] >= W.mag || P.res[P.weapon] <= 0) return;
  P.reloadT = W.reload; SFX.reload();
}
function doCQC() {
  const P = G.player; if (P.cqcT > 0) return; P.cqcT = 0.55;
  let best = null, bd = 1.9;
  for (const a of G.actors) { if (!a.alive || a.faction === 'p') continue; const d = dist(a, P); if (d > bd + a.r) continue; const ang = Math.atan2(a.x - P.x, a.z - P.z); if (angDiff(ang, P.yaw) > 1.1) continue; best = a; bd = d; }
  P.recoil = 0.6;
  if (!best) { SFX.knife(); return; }
  const behind = angDiff(best.yaw, Math.atan2(best.x - P.x, best.z - P.z)) < 1.2;
  if (best.kind === 'guard' && (best.state !== 'alert' || behind)) {
    SFX.takedown(); killActor(best, true, true); G.stats.takedowns++; G.stats.kills--; best.yaw = P.yaw; fxBlood(best.x, best.z);
    return;
  }
  SFX.knife();
  const unaware = best.faction === 'i' && (best.state === 'dormant' || best.state === 'wander') && behind;
  damageActor(best, unaware && best.kind !== 'brute' && best.kind !== 'boss' ? 200 : 30, true, Math.sin(P.yaw) * 0.5, Math.cos(P.yaw) * 0.5);
}

// ============================================================================
// Actualización de la jugadora
// ============================================================================
const raycaster = new THREE.Raycaster(); const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.1); const v3 = new THREE.Vector3();
function updPlayer(dt) {
  const P = G.player, map = G.level.map;
  P.inv -= dt; P.fireT -= dt; P.cqcT -= dt; P.recoil = Math.max(0, P.recoil - dt * 6);
  if (!P.alive) { animDeath(P.rig, dt); return; }
  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let mz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  if (touch.on && (touch.mx || touch.mz)) { mx = touch.mx; mz = touch.mz; }
  const L = Math.hypot(mx, mz); if (L > 1) { mx /= L; mz /= L; }
  const aiming = mouse.right;
  P.run = (keys.ShiftLeft || keys.ShiftRight || (touch.on && L > 0.95)) && !P.crouch && L > 0.1 && !aiming;
  const spd = P.crouch ? 2.1 : aiming ? 2.5 : P.run ? 6.3 : 4.0;
  const acc = Math.min(1, dt * 12);
  P.vx += (mx * spd - P.vx) * acc; P.vz += (mz * spd - P.vz) * acc;
  P.x += P.vx * dt; P.z += P.vz * dt; collide(map, P, P.r);
  // apuntado
  if (touch.on) {
    if (touch.ax || touch.az) P.yaw = Math.atan2(touch.ax, touch.az); else if (L > 0.1) P.yaw = lerpAng(P.yaw, Math.atan2(mx, mz), Math.min(1, dt * 10));
    P.aimX = P.x + Math.sin(P.yaw) * 6; P.aimZ = P.z + Math.cos(P.yaw) * 6;
  } else {
    raycaster.setFromCamera({ x: mouse.x / innerWidth * 2 - 1, y: -(mouse.y / innerHeight) * 2 + 1 }, camera);
    if (raycaster.ray.intersectPlane(aimPlane, v3)) { P.aimX = v3.x; P.aimZ = v3.z; }
    const want = Math.atan2(P.aimX - P.x, P.aimZ - P.z); P.yaw = lerpAng(P.yaw, want, Math.min(1, dt * 18));
  }
  // pasos
  const sp = Math.hypot(P.vx, P.vz); P.stepT -= dt * sp;
  if (P.stepT <= 0 && sp > 0.6) { P.stepT = 1.5; if (!P.crouch) SFX.step(P.run, G.level.th.step); if (P.run) makeNoise(P.x, P.z, 7.5, 'player'); else if (!P.crouch) makeNoise(P.x, P.z, 2.2, 'soft'); }
  // recarga
  if (P.reloadT > 0) { P.reloadT -= dt; if (P.reloadT <= 0) { const W = WEAP[P.weapon], need = W.mag - P.mag[P.weapon], take = Math.min(need, P.res[P.weapon]); P.mag[P.weapon] += take; P.res[P.weapon] -= take; } }
  if ((mouse.left || touch.fire) && !G.uiBlock) playerFire();
  if (P.mag[P.weapon] === 0 && P.res[P.weapon] > 0 && P.reloadT <= 0 && P.fireT <= 0) startReload();
  // recogida
  for (const p of G.level.pickups) {
    if (p.taken) continue; if (Math.hypot(p.x - P.x, p.z - P.z) > 1.1) continue;
    pickup(p);
  }
  // animación
  animRig(P.rig, dt, sp, { crouch: P.crouch, aim: true, recoil: P.recoil, rate: P.crouch ? 0.7 : 1 });
  P.rig.g.position.set(P.x, 0, P.z); P.rig.g.rotation.y = P.yaw;
  // girar las piernas hacia el movimiento si se camina de espaldas
  if (sp > 0.5) { const mv = Math.atan2(P.vx, P.vz); const back = angDiff(mv, P.yaw) > Math.PI / 2; if (back) { P.rig.legL.pivot.rotation.x *= -1; P.rig.legR.pivot.rotation.x *= -1; } }
}

function pickup(p) {
  const P = G.player;
  if (p.type === 'ammo') { P.res.pistol += 12; subLine('SYS', null, '+12 balas de pistola'); }
  else if (p.type === 'shells') { if (!P.hasShotgun) return; P.res.shotgun += 6; subLine('SYS', null, '+6 cartuchos'); }
  else if (p.type === 'medkit') { if (P.med >= 4) return; P.med++; subLine('SYS', null, 'Botiquín recogido'); }
  else if (p.type === 'doc') { G.stats.docs++; openDoc(p.doc); }
  else { G.items[p.type] = (G.items[p.type] || 0) + 1; const nm = { keycard: 'Tarjeta de acceso', tape: 'Grabación', code: 'Fragmento de código' }[p.type]; subLine('SYS', null, nm + ' obtenida'); }
  p.taken = true; p.mesh.visible = false; SFX.pickup();
  checkStages();
}

// ============================================================================
// IA
// ============================================================================
function updGuard(a, dt) {
  const P = G.player, th = G.level.th;
  a.fireT -= dt; a.t += dt; a.scanT = (a.scanT || 0) - dt;
  let range = 12.5 * (P.crouch ? 0.6 : 1) * (P.lamp ? 1.3 : 1) * (G.caution > 0 ? 1.2 : 1) * (mouse.right ? 0.9 : 1);
  if (th.outdoor) range *= 1.08;
  if (a.state === 'alert') range = Math.max(range, 18);
  const sees = P.alive && guardSees(a, P, range);
  a.seesP = sees;
  const dP = dist(a, P);
  if (sees) {
    const gain = dt * (0.55 + 2.6 * (1 - dP / range)) * (P.run ? 1.6 : 1) * (G.caution > 0 ? 1.4 : 1) * (P.crouch ? 0.7 : 1);
    a.sus = Math.min(1, a.sus + gain); a.lastSeen = { x: P.x, z: P.z };
    if (a.state === 'alert' || G.alarm) { G.alarmT = 22; G.lastKnown = { x: P.x, z: P.z }; }
    if (a.sus >= 1 && a.state !== 'alert') raiseAlarm(a);
    else if (a.sus > 0.28 && ['patrol', 'sentry', 'return', 'search'].includes(a.state)) { a.state = 'suspicious'; a.inv = { x: P.x, z: P.z }; a.invT = 6; a.path = null; showTag(a, '?'); SFX.caution(); }
    else if (a.state === 'suspicious') { a.inv = { x: P.x, z: P.z }; a.invT = 6; }
  } else a.sus = Math.max(0, a.sus - dt * 0.12);
  // cuerpos
  if (!sees && ['patrol', 'sentry', 'return'].includes(a.state) && a.scanT <= 0) {
    a.scanT = 0.4;
    for (const b of G.actors) { if (b.alive || b.kind !== 'guard' || b.found) continue; if (guardSees(a, b, 10)) { b.found = true; a.state = 'suspicious'; a.inv = { x: b.x, z: b.z }; a.invT = 8; a.path = null; showTag(a, '?'); G.caution = 45; SFX.caution(); subLine('VAR', null, '«Hombre caído. Hay un intruso. Manteneos alerta».'); break; } }
  }
  // infectados cercanos
  if (a.scanT <= 0 || a.enemy) {
    if (!a.enemy || !a.enemy.alive || dist(a, a.enemy) > 13) {
      a.enemy = null; let bd = 11;
      for (const b of G.actors) { if (!b.alive || b.faction !== 'i' || b.state === 'dormant') continue; const d = dist(a, b); if (d < bd && losClear(G.level.map, a.x, a.z, b.x, b.z)) { bd = d; a.enemy = b; } }
    }
  }
  const sp = 1.6;
  // combate contra infectados (prioridad si no ve a la jugadora o el infectado está muy cerca)
  if (a.enemy && (!(a.state === 'alert' && sees) || dist(a, a.enemy) < 4)) {
    const e = a.enemy, d = dist(a, e); a.yaw = lerpAng(a.yaw, Math.atan2(e.x - a.x, e.z - a.z), Math.min(1, dt * 8));
    if (d < 3.5) { const bx = a.x - (e.x - a.x) / d, bz = a.z - (e.z - a.z) / d; steerTo(a, bx, bz, 2.2, dt); a.yaw = Math.atan2(e.x - a.x, e.z - a.z); } else a.moveSpd = 0;
    if (a.fireT <= 0) { a.fireT = 0.42 + Math.random() * 0.2; guardShoot(a, e.x, e.z); if (Math.random() < 0.55) damageActor(e, 24, false); makeNoise(a.x, a.z, 18, 'guard'); }
  } else switch (a.state) {
    case 'patrol': {
      if (a.waitT > 0) { a.waitT -= dt; a.yaw += Math.sin(a.t * 1.3) * dt * 1.2; a.moveSpd = 0; break; }
      const w = a.wp[a.wpi]; const d = steerTo(a, w.x, w.z, sp, dt);
      if (d < 0.5) { if (a.wpi === a.wp.length - 1 || (a.wpi === 0 && a.wdir < 0)) { a.wdir *= -1; a.waitT = 1.5 + Math.random() * 2; } a.wpi = Math.max(0, Math.min(a.wp.length - 1, a.wpi + a.wdir)); }
      break; }
    case 'sentry': a.yaw = a.baseYaw + Math.sin(a.t * 0.45) * 1.1; a.moveSpd = 0; break;
    case 'suspicious': {
      a.invT -= dt; const d = steerTo(a, a.inv.x, a.inv.z, 2.3, dt);
      if (d < 1.2) { a.moveSpd = 0; a.yaw += dt * 1.6; }
      if (a.invT <= 0) { a.state = 'return'; a.path = null; }
      break; }
    case 'return': { const w = a.wp[0]; if (steerTo(a, w.x, w.z, sp, dt) < 0.6) { a.state = a.sentry ? 'sentry' : 'patrol'; a.wpi = 0; a.wdir = 1; } break; }
    case 'alert': {
      if (sees) {
        a.yaw = lerpAng(a.yaw, Math.atan2(P.x - a.x, P.z - a.z), Math.min(1, dt * 10));
        if (dP > 9) steerTo(a, P.x, P.z, 3.6, dt); else if (dP < 3.5) { const bx = a.x - (P.x - a.x) / dP, bz = a.z - (P.z - a.z) / dP; steerTo(a, bx, bz, 2.5, dt); a.yaw = Math.atan2(P.x - a.x, P.z - a.z); } else a.moveSpd = 0;
        if (a.fireT <= 0) {
          a.fireT = 0.65 + Math.random() * 0.35;
          const moving = Math.hypot(P.vx, P.vz) > 1;
          const hitP = Math.max(0.12, Math.min(0.78, 0.82 - dP * 0.035 - (P.crouch ? 0.12 : 0) - (moving ? 0.18 : 0)));
          const hit = Math.random() < hitP;
          const ox = hit ? 0 : (Math.random() - 0.5) * 2.5, oz = hit ? 0 : (Math.random() - 0.5) * 2.5;
          guardShoot(a, P.x + ox, P.z + oz);
          if (hit) damagePlayer(8 + (Math.random() * 4 | 0), a.x, a.z);
          makeNoise(a.x, a.z, 18, 'guard');
        }
      } else if (G.lastKnown) { const d = steerTo(a, G.lastKnown.x + (a.t % 3) - 1.5, G.lastKnown.z, 4.0, dt); if (d < 1.5) a.yaw += dt * 2; }
      break; }
    case 'search': {
      if (!a.sp || dist(a, a.sp) < 1 || a.spT <= 0) { const c = G.lastKnown || a; a.sp = { x: c.x + (Math.random() - .5) * 14, z: c.z + (Math.random() - .5) * 14 }; if (solidAt(G.level.map, a.sp.x, a.sp.z)) a.sp = { x: c.x, z: c.z }; a.spT = 5; }
      a.spT -= dt; steerTo(a, a.sp.x, a.sp.z, 2.6, dt); break; }
  }
  animRig(a.rig, dt, a.moveSpd, { aim: a.state === 'alert' || !!a.enemy });
  // cono
  const st = a.state === 'alert' ? 2 : (a.state === 'suspicious' || a.state === 'search') ? 1 : 0;
  a.cone.material.color.set(st === 2 ? 0xff3020 : st === 1 ? 0xf0b44c : 0x40b0ff); a.cone.material.opacity = st === 2 ? 0.1 : 0.075 + a.sus * 0.08;
  if (dP < 34) updCone(a, Math.min(range, 13) * (st === 2 ? 1 : 1), 0.8); a.cone.visible = dP < 34;
}
function guardShoot(a, tx, tz) {
  const gx = a.x + Math.sin(a.yaw) * 0.7, gz = a.z + Math.cos(a.yaw) * 0.7;
  const dx = tx - gx, dz = tz - gz, L = Math.hypot(dx, dz) || 1; const wd = rayWall(G.level.map, gx, gz, dx / L, dz / L, L);
  fxTracer(gx, gz, gx + dx / L * wd, gz + dz / L * wd, 0xffa060);
  eMuzzle.position.set(gx, 1.3, gz); eMuzzle.intensity = 40;
  SFX.enemyShot(dist(a, G.player), pan(a));
  a.rig.recoil = 1;
}

function infTargets(a) {
  const P = G.player, out = [];
  if (P.alive) out.push(P);
  for (const b of G.actors) if (b.alive && (b.kind === 'guard' || b.kind === 'novak')) out.push(b);
  return out;
}
function updInfected(a, dt) {
  a.t += dt; a.atkT -= dt; a.senseT = (a.senseT || 0) - dt;
  const P = G.player, map = G.level.map;
  if (a.state === 'dormant') {
    a.moveSpd = 0; animRig(a.rig, dt * 0.2, 0, { reach: false }); a.rig.torso.rotation.x = 0.7 + Math.sin(a.t) * 0.05; a.rig.head.rotation.x = 0.6;
    if (dist(a, P) < 2.4 && P.alive) { a.state = 'chase'; a.target = P; SFX.groan(dist(a, P), pan(a)); }
    return;
  }
  if (a.senseT <= 0) {
    a.senseT = 0.3;
    let best = null, bd = 99;
    for (const t of infTargets(a)) {
      let sense = a.kind === 'runner' ? 12 : 8.5;
      if (t === P) { sense += P.lamp ? 3 : 0; if (P.crouch) sense -= 2.5; }
      const d = dist(a, t); if (d > sense || d >= bd) continue;
      if (d < 1.8 || losClear(map, a.x, a.z, t.x, t.z)) { best = t; bd = d; }
    }
    if (best) { if (a.state !== 'chase' && Math.random() < 0.6) { if (a.kind === 'runner') SFX.screech(dist(a, P), pan(a)); else SFX.groan(dist(a, P), pan(a), a.kind === 'brute' ? 0.6 : 1); } a.state = 'chase'; a.target = best; a.lostT = 3; }
    else if (a.state === 'chase') { a.lostT -= 0.3; if (a.lostT <= 0) { a.state = 'hunt'; a.huntP = a.target ? { x: a.target.x, z: a.target.z } : { x: a.x, z: a.z }; } }
  }
  if (Math.random() < dt * 0.06) SFX.groan(dist(a, P), pan(a), a.kind === 'brute' ? 0.6 : a.kind === 'runner' ? 1.4 : 1);
  switch (a.state) {
    case 'wander': {
      if (!a.wt || a.wtT <= 0) { a.wt = { x: a.x + (Math.random() - .5) * 6, z: a.z + (Math.random() - .5) * 6 }; a.wtT = 3 + Math.random() * 4; if (solidAt(map, a.wt.x, a.wt.z)) a.wt = { x: a.x, z: a.z }; }
      a.wtT -= dt; if (steerTo(a, a.wt.x, a.wt.z, a.walk, dt) < 0.4) a.moveSpd = 0; break; }
    case 'hunt': { const d = steerTo(a, a.huntP.x, a.huntP.z, a.chase * 0.75, dt); if (d < 1) { a.state = 'wander'; a.wt = null; } break; }
    case 'chase': {
      const t = a.target; if (!t || !t.alive || (t === P && !P.alive)) { a.state = 'wander'; break; }
      const d = dist(a, t), reach = a.r + (t.r || 0.38) + 0.35;
      if (d > reach) steerTo(a, t.x, t.z, a.chase, dt);
      else {
        a.moveSpd = 0; a.yaw = lerpAng(a.yaw, Math.atan2(t.x - a.x, t.z - a.z), Math.min(1, dt * 10));
        if (a.atkT <= 0) {
          a.atkT = a.kind === 'brute' ? 1.6 : 1.1; a.lunge = 0.25;
          if (t === P) damagePlayer(a.dmg, a.x, a.z); else { t.hp -= a.dmg; fxBlood(t.x, t.z); if (t.hp <= 0) killActor(t, false); }
        }
      }
      break; }
  }
  a.lunge = Math.max(0, (a.lunge || 0) - dt);
  animRig(a.rig, dt, a.moveSpd, { reach: true, rate: a.kind === 'runner' ? 1.2 : 0.8 });
  if (a.lunge > 0) { a.rig.torso.rotation.x += 0.4; a.rig.armL.pivot.rotation.x -= 0.4; a.rig.armR.pivot.rotation.x -= 0.4; }
}

function updNovak(a, dt) {
  a.t += dt;
  if (a.state === 'static') { a.moveSpd = 0; a.yaw = Math.PI; animRig(a.rig, dt, 0, { aim: false }); a.rig.armL.pivot.rotation.x = -0.9; a.rig.armR.pivot.rotation.x = -0.9; return; }
  const P = G.player, d = dist(a, P);
  if (d > 2.4) steerTo(a, P.x, P.z, d > 6 ? 4.2 : 3.4, dt); else a.moveSpd = 0;
  animRig(a.rig, dt, a.moveSpd, {});
  if (d > 16 && (a.callT = (a.callT || 0) - dt) <= 0) { a.callT = 9; subLine('NOV', null, '¡Sílex, espérame! No puedo seguirte el ritmo.'); }
}

function updBoss(a, dt) {
  const P = G.player; a.t += dt; a.atkT -= dt;
  a.chargeT -= dt; a.burstT -= dt; a.summonT -= dt; a.stunT -= dt;
  const d = dist(a, P), face = Math.atan2(P.x - a.x, P.z - a.z);
  const glow = mats().sporeGlow;
  switch (a.state) {
    case 'walk':
      if (d > 2.2) steerTo(a, P.x, P.z, a.chase * (a.hp < a.maxHp * 0.4 ? 1.3 : 1), dt); else { a.moveSpd = 0; a.yaw = lerpAng(a.yaw, face, dt * 6); if (a.atkT <= 0) { a.atkT = 1.2; a.lunge = 0.3; damagePlayer(18, a.x, a.z); } }
      if (a.chargeT <= 0 && d > 4 && losClear(G.level.map, a.x, a.z, P.x, P.z)) { a.state = 'windup'; a.st = 0.85; SFX.roar(); }
      else if (a.burstT <= 0 && d < 7) { a.state = 'burstWind'; a.st = 1.1; }
      else if (a.summonT <= 0) { a.summonT = 16; SFX.roar(); subLine('VAR', null, Math.random() < 0.5 ? '¡Venid, hijos míos!' : '¡A mí!'); for (let k = 0; k < 2; k++) { const c = edgeSpawn(); if (c) spawn('runner', c.x, c.z).state = 'chase'; } }
      break;
    case 'windup': a.st -= dt; a.moveSpd = 0; a.yaw = lerpAng(a.yaw, face, dt * 10); glow.emissiveIntensity = 6 + Math.sin(a.t * 40) * 4; if (a.st <= 0) { a.state = 'charge'; a.st = 0.75; a.cdir = a.yaw; } break;
    case 'charge': {
      a.st -= dt; const spd = 15, ox = a.x, oz = a.z;
      a.x += Math.sin(a.cdir) * spd * dt; a.z += Math.cos(a.cdir) * spd * dt; collide(G.level.map, a, a.r); a.moveSpd = 8;
      const blocked = Math.hypot(a.x - ox, a.z - oz) < spd * dt * 0.4;
      if (d < a.r + 0.6) { damagePlayer(32, a.x, a.z); a.state = 'walk'; a.chargeT = 5.5; }
      else if (blocked) { a.state = 'stun'; a.stunT = 2.4; a.st = 2.4; G.shake = 0.8; SFX.explosion(10); fxSparks(a.x, 1.5, a.z, 0xffa040, 14, 6); subLine('MAR', null, '¡Ahora! ¡Los brotes brillan, dispare!'); }
      else if (a.st <= 0) { a.state = 'walk'; a.chargeT = 5.5; }
      break; }
    case 'stun': a.st -= dt; a.moveSpd = 0; a.rig.torso.rotation.x = 0.8; glow.emissiveIntensity = 14 + Math.sin(a.t * 12) * 4; if (a.st <= 0) { a.state = 'walk'; a.chargeT = 5.5; } break;
    case 'burstWind': a.st -= dt; a.moveSpd = 0; glow.emissiveIntensity = 6 + (1.1 - a.st) * 12; if (!a.ringFx) { fxRing(a.x, a.z, 11, 0xff6a10); a.ringFx = 1; }
      if (a.st <= 0) { a.ringFx = 0; a.state = 'walk'; a.burstT = 9; fxSparks(a.x, 1.5, a.z, 0xff8a2a, 30, 9); fxRing(a.x, a.z, 11, 0xff8a2a); SFX.explosion(5); if (d < 5.5) damagePlayer(26, a.x, a.z); }
      break;
  }
  if (a.state === 'walk') glow.emissiveIntensity = 6 + Math.sin(a.t * 3) * 1.5;
  a.lunge = Math.max(0, (a.lunge || 0) - dt);
  animRig(a.rig, dt, a.moveSpd, { reach: a.state !== 'stun', rate: 0.7 });
  if (a.state === 'stun') a.rig.torso.rotation.x = 0.9;
  if (a.lunge > 0) a.rig.torso.rotation.x += 0.4;
}
function edgeSpawn() {
  const map = G.level.map;
  for (let t = 0; t < 40; t++) {
    const side = Math.random() * 4 | 0; let i, j;
    if (side === 0) { i = 1 + (Math.random() * (map.W - 2) | 0); j = 1; } else if (side === 1) { i = 1 + (Math.random() * (map.W - 2) | 0); j = map.H - 2; } else if (side === 2) { i = 1; j = 1 + (Math.random() * (map.H - 2) | 0); } else { i = map.W - 2; j = 1 + (Math.random() * (map.H - 2) | 0); }
    if (map.g[j * map.W + i] === 0) { const c = cellCenter(i, j); if (Math.hypot(c.x - G.player.x, c.z - G.player.z) > 7) return c; }
  }
  return null;
}

// ============================================================================
// Objetivos
// ============================================================================
function curObj() { return G.M.objectives[Math.min(G.stage, G.M.objectives.length - 1)]; }
function checkStages() {
  let guard = 0;
  while (G.stage < G.M.objectives.length && guard++ < 5) {
    const ob = G.M.objectives[G.stage]; let ok = false;
    if (ob.type === 'collect') ok = (G.items[ob.item] || 0) >= ob.count;
    else if (ob.type === 'interact' || ob.type === 'plant') ok = G.level.targets.filter(t => t.stage === G.stage && t.done).length >= Math.min(ob.count, G.level.targets.filter(t => t.stage === G.stage).length);
    if (!ok) break;
    G.stage++; SFX.objective(); toast('OBJETIVO COMPLETADO');
    const lines = G.M.stageRadio && G.M.stageRadio[G.stage]; if (lines) lines.forEach(l => subLine(l[0], null, l[1]));
    if (G.M.forceAlert && G.stage === 1) { G.forceAlarm = true; setTimeout(() => { if (G.mode === 'play') raiseAlarm(null); }, 1500); }
  }
  updHUDObjective();
}
function interactables() {
  const P = G.player; let best = null, bd = 2.5;
  for (const t of G.level.targets) { if (t.done || t.stage !== G.stage) continue; const d = Math.hypot(t.x - P.x, t.z - P.z); if (d < bd) { bd = d; best = t; } }
  return best;
}
const ACT = { relay: ['Sabotear relé', 1.4], generator: ['Arrancar generador', 1.6], terminal: ['Descargar datos', 2.0], tank: ['Colocar C4', 1.8], antenna: ['Instalar inhibidor', 2.4], vault: ['Introducir código', 1.8], console: ['Desactivar bomba', 1.8], emitter: ['Desactivar emisor', 2.0], fuel: ['Colocar C4', 1.8], heli: ['Colocar C4', 2.2] };
function updInteract(dt) {
  const t = interactables(); G.curT = t;
  if (t && (keys.KeyE || touch.act) && G.player.alive) {
    t.progress += dt / ACT[t.type][1];
    if (t.progress >= 1) completeTarget(t);
  } else if (t) t.progress = Math.max(0, t.progress - dt * 2);
}
function completeTarget(t) {
  t.done = true; t.progress = 1; SFX.beep();
  if (t.plant) { t.boomT = 3.2; t.beepT = 0; G.plants.push(t); subLine('SYS', null, 'C4 colocado. ¡Aléjate!'); }
  else if (t.type === 'generator') { t.running = true; t.noiseT = 0; makeNoise(t.x, t.z, 18, 'gen'); }
  else t.mesh.traverse(o => { if (o.material === mats().led) o.material = mats().ledG; if (o.userData.spin) o.userData.spin = 0; });
  const lamp = G.level.lamps.find(l => l.small && Math.abs(l.x - t.x) < 0.1 && Math.abs(l.z - t.z) < 0.1); if (lamp) lamp.color = t.plant ? 0xff2020 : 0x40ff90;
  checkStages();
}
function updPlants(dt) {
  for (let i = G.plants.length - 1; i >= 0; i--) {
    const t = G.plants[i]; t.boomT -= dt; t.beepT -= dt;
    if (t.beepT <= 0) { t.beepT = t.boomT < 1 ? 0.15 : 0.45; SFX.beep(); }
    if (t.boomT <= 0) {
      G.plants.splice(i, 1); const big = t.type === 'heli' ? 1.6 : 1; explode(t.x, t.z, 4.5 * big, 90, big);
      t.mesh.visible = false; const f = makeFire(); f.position.set(t.x, 0, t.z); G.level.group.add(f); G.level.fires.push(f);
      G.level.lamps.push({ x: t.x, y: 1.2, z: t.z, color: 0xff6a20, power: 24, flick: 2, fire: true });
      const lamp = G.level.lamps.find(l => l.small && Math.abs(l.x - t.x) < 0.1 && Math.abs(l.z - t.z) < 0.1); if (lamp) lamp.power = 0;
    }
  }
  for (const t of G.level.targets) if (t.running) { t.noiseT -= dt; t.mesh.position.y = Math.sin(G.t * 60) * 0.015; if (t.noiseT <= 0) { t.noiseT = 2.6; makeNoise(t.x, t.z, 15, 'gen'); } }
}

// ============================================================================
// Interfaz: HUD, subtítulos, etiquetas, radar
// ============================================================================
function lineHTML(sp, text) {
  const s = SPEAKERS[sp] || SPEAKERS.SYS;
  const ini = s.name.replace('DRA. ', '').replace('DR. ', '').replace('CTE. ', '').slice(0, 1);
  return `<div class="line"><div class="av" style="color:${s.color}">${ini}</div><div><div class="who" style="color:${s.color}">${s.name}<i>${s.role}</i></div><div class="txt">${text}</div></div></div>`;
}
function subLine(sp, _, text) { G.subQ.push({ sp, text }); }
function updSubs(dt) {
  if (G.sub) { G.sub.t -= dt; if (G.sub.t <= 0) { G.sub.el.remove(); G.sub = null; } }
  if (!G.sub && G.subQ.length) {
    const s = G.subQ.shift(); const wrap = document.createElement('div'); wrap.innerHTML = lineHTML(s.sp, s.text); const el = wrap.firstChild;
    $('subs').appendChild(el); G.sub = { el, t: s.sp === 'SYS' && s.text.length < 40 ? 1.8 : Math.max(3.2, s.text.length * 0.058) };
    if (s.sp !== 'SYS') SFX.radio(); else SFX.blip();
  }
}
let toastT = 0;
function toast(msg, red) { const t = $('toast'); t.textContent = msg; t.style.color = red ? 'var(--red)' : ''; t.classList.add('on'); toastT = 2.2; }

const tagEls = {};
function showTag(a, ch) { a.tag = ch; a.tagT = ch === '!' ? 1.8 : 2.2; }
function updTags() {
  const box = $('tags'); const W = innerWidth, H = innerHeight;
  const proj = (x, y, z) => { v3.set(x, y, z).project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H, v3.z < 1]; };
  for (const a of G.actors) {
    if (a.tagT > 0 && a.alive) {
      a.tagT -= 1 / 60;
      if (!a.tagEl) { a.tagEl = document.createElement('div'); box.appendChild(a.tagEl); }
      a.tagEl.className = 'tag3d ' + (a.tag === '!' ? 'x' : 'q'); a.tagEl.textContent = a.tag;
      const [x, y] = proj(a.x, 2.4, a.z); a.tagEl.style.left = x + 'px'; a.tagEl.style.top = y + 'px';
    } else if (a.tagEl) { a.tagEl.remove(); a.tagEl = null; }
  }
  // indicación de interacción
  let pe = tagEls.prompt; if (!pe) { pe = tagEls.prompt = document.createElement('div'); pe.className = 'tag3d p'; box.appendChild(pe); }
  const t = G.curT;
  if (t && G.player.alive) {
    const [x, y] = proj(t.x, (t.mesh.userData.h || 1.6) + 0.8, t.z);
    pe.hidden = false; pe.style.left = x + 'px'; pe.style.top = y + 'px';
    const lbl = ACT[t.type][0]; pe.innerHTML = `<em>${touch.on ? 'ACCIÓN' : '[E]'}</em> mantén · ${lbl}<div class="prog"><i style="width:${(t.progress * 100) | 0}%"></i></div>`;
  } else pe.hidden = true;
  if (!box.contains(pe)) box.appendChild(pe);
}

let hudCache = {};
function setTxt(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function updHUDObjective() {
  if (!G.M) return; const ob = curObj();
  let txt = ob.label;
  if (ob.type === 'collect') txt += ` (${Math.min(G.items[ob.item] || 0, ob.count)}/${ob.count})`;
  if (ob.type === 'interact' || ob.type === 'plant') txt += ` (${G.level.targets.filter(t => t.stage === G.stage && t.done).length}/${ob.count})`;
  setTxt('hObj', txt);
}
function updHUD() {
  const P = G.player, W = WEAP[P.weapon];
  setTxt('hMission', `Misión ${String(G.M.id).padStart(2, '0')} · ${G.M.title}`);
  $('hHp').style.transform = `scaleX(${P.hp / 100})`; setTxt('hHpTxt', String(Math.ceil(P.hp)));
  $('hLife').classList.toggle('low', P.hp < 30);
  setTxt('hMed', String(P.med)); setTxt('hLamp', P.lamp ? 'ON' : 'OFF'); setTxt('hStance', P.crouch ? 'Agachada' : P.run ? 'Corriendo' : 'De pie');
  setTxt('hWeapon', P.reloadT > 0 ? 'Recargando…' : W.name); setTxt('hMag', String(P.mag[P.weapon])); setTxt('hRes', String(P.res[P.weapon]));
  const st = $('hStatus'); let s = 'INFILTRACIÓN', cls = '';
  if (G.alarm) { s = 'ALERTA ' + Math.ceil(G.alarmT); cls = 'alert'; } else if (G.evadeT > 0) { s = 'EVASIÓN ' + Math.ceil(G.evadeT); cls = 'evade'; } else if (G.caution > 0) { s = 'PRECAUCIÓN'; cls = 'caution'; }
  if (G.M.survive) { s = 'DEFENSA'; cls = 'caution'; } if (G.M.boss) { s = 'COMBATE'; cls = 'alert'; } if (G.M.escape) { s = 'EVACUACIÓN'; cls = 'alert'; }
  if (hudCache.st !== s + cls) { hudCache.st = s + cls; st.textContent = s; st.className = 'status ' + cls; }
  const tm = $('hTimer');
  if (G.M.survive || G.M.escape) { const v = G.M.survive ? G.survT : G.escT; tm.hidden = false; setTxt('hTimer', (G.M.escape ? 'FUSIÓN ' : 'DESCARGA ') + String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(Math.floor(v % 60)).padStart(2, '0')); } else tm.hidden = true;
  const hb = $('hBoss'); if (G.boss) { hb.hidden = false; $('hBossBar').style.transform = `scaleX(${Math.max(0, G.boss.hp / G.boss.maxHp)})`; } else hb.hidden = true;
}

// radar
const radar = $('radar'), rctx = radar.getContext('2d'); let radarMap = null;
function buildRadarMap() {
  const map = G.level.map, S = 8, c = document.createElement('canvas'); c.width = map.W * S; c.height = map.H * S; const x = c.getContext('2d');
  x.fillStyle = 'rgba(120,170,200,0.10)'; x.fillRect(0, 0, c.width, c.height);
  for (let j = 0; j < map.H; j++) for (let i = 0; i < map.W; i++) { const v = map.g[j * map.W + i]; if (v === 1) { x.fillStyle = 'rgba(150,200,230,0.55)'; x.fillRect(i * S, j * S, S, S); } else if (v === 2) { x.fillStyle = 'rgba(150,200,230,0.28)'; x.fillRect(i * S + 1, j * S + 1, S - 2, S - 2); } }
  radarMap = { c, S };
}
function drawRadar() {
  const P = G.player, w = radar.width, h = radar.height, R = w / 2, scale = 6.5; // px por metro
  rctx.clearRect(0, 0, w, h); rctx.save(); rctx.beginPath(); rctx.arc(R, R, R - 2, 0, 7); rctx.clip();
  rctx.fillStyle = G.alarm ? 'rgba(60,8,6,0.7)' : 'rgba(4,14,18,0.6)'; rctx.fillRect(0, 0, w, h);
  const k = scale / (radarMap.S / CS); // radarMap px por celda -> px pantalla
  rctx.drawImage(radarMap.c, R - P.x * scale, R - P.z * scale, radarMap.c.width * k, radarMap.c.height * k);
  const toR = (x, z) => [R + (x - P.x) * scale, R + (z - P.z) * scale];
  // conos y enemigos
  for (const a of G.actors) {
    if (!a.alive) continue; const [x, y] = toR(a.x, a.z); if (Math.hypot(x - R, y - R) > R + 10) continue;
    if (a.kind === 'guard') {
      rctx.fillStyle = a.state === 'alert' ? 'rgba(255,60,40,0.35)' : a.state === 'suspicious' ? 'rgba(240,180,76,0.32)' : 'rgba(80,180,255,0.25)';
      rctx.beginPath(); rctx.moveTo(x, y); const rr = (a.coneR || 10) * scale; rctx.arc(x, y, rr, Math.PI / 2 - a.yaw - 0.8, Math.PI / 2 - a.yaw + 0.8); rctx.closePath(); rctx.fill();
      rctx.fillStyle = '#e8f4ff'; rctx.beginPath(); rctx.arc(x, y, 5, 0, 7); rctx.fill();
    } else if (a.faction === 'i') { if (Math.hypot(a.x - P.x, a.z - P.z) < 20) { rctx.fillStyle = a.kind === 'boss' ? '#ff5a20' : '#ff8a2a'; rctx.beginPath(); rctx.arc(x, y, a.kind === 'brute' || a.kind === 'boss' ? 7 : 4, 0, 7); rctx.fill(); } }
    else if (a.kind === 'novak') { rctx.fillStyle = '#69e0a0'; rctx.beginPath(); rctx.arc(x, y, 5, 0, 7); rctx.fill(); }
  }
  // objetivos
  const ob = curObj(); const pts = [];
  if (ob.type === 'reach') pts.push(G.level.exit);
  else if (ob.type === 'collect') G.level.pickups.forEach(p => { if (!p.taken && p.type === ob.item) pts.push(p); });
  else G.level.targets.forEach(t => { if (!t.done && t.stage === G.stage) pts.push(t); });
  pts.forEach(p => { let [x, y] = toR(p.x, p.z); const dx = x - R, dy = y - R, d = Math.hypot(dx, dy); if (d > R - 12) { x = R + dx / d * (R - 12); y = R + dy / d * (R - 12); } rctx.save(); rctx.translate(x, y); rctx.rotate(Math.PI / 4); rctx.fillStyle = ob.type === 'reach' ? '#50ff9a' : '#f0b44c'; rctx.fillRect(-6, -6, 12, 12); rctx.restore(); });
  // jugadora
  rctx.translate(R, R); rctx.rotate(-P.yaw + Math.PI); rctx.fillStyle = '#9fd3ff'; rctx.beginPath(); rctx.moveTo(0, -10); rctx.lineTo(7, 8); rctx.lineTo(-7, 8); rctx.closePath(); rctx.fill();
  rctx.restore();
  rctx.strokeStyle = 'rgba(160,200,230,0.25)'; rctx.lineWidth = 2; rctx.beginPath(); rctx.arc(R, R, R - 2, 0, 7); rctx.stroke();
}

// ============================================================================
// Cámara, luces y bucle
// ============================================================================
const camLook = new THREE.Vector3(); const tmpV = new THREE.Vector3();
function updCamera(dt) {
  const P = G.player, out = G.level.th.outdoor;
  const ax = Math.max(-5, Math.min(5, (P.aimX - P.x) * 0.22)), az = Math.max(-4, Math.min(4, (P.aimZ - P.z) * 0.22));
  tmpV.set(P.x + ax, 0, P.z + az);
  camLook.lerp(tmpV, 1 - Math.exp(-dt * 5));
  const hgt = out ? 17 : 15, back = out ? 11.5 : 10;
  camera.position.set(camLook.x, hgt, camLook.z + back);
  if (G.shake > 0) { camera.position.x += (Math.random() - 0.5) * G.shake; camera.position.y += (Math.random() - 0.5) * G.shake; G.shake = Math.max(0, G.shake - dt * 2.5); }
  camera.lookAt(camLook.x, 0.6, camLook.z);
}
function updLights(dt) {
  const P = G.player, L = G.level, t = G.t;
  // linterna
  const on = P.lamp && P.alive;
  const gx = P.x + Math.sin(P.yaw) * 0.35, gz = P.z + Math.cos(P.yaw) * 0.35;
  flash.position.set(gx, 1.5, gz); flash.target.position.set(P.x + Math.sin(P.yaw) * 9, 0, P.z + Math.cos(P.yaw) * 9);
  flash.intensity = on ? (L.th.outdoor ? 70 : 110) : 0;
  beam.visible = on; beamMat.uniforms.uOn.value = on ? 1 : 0; beamMat.uniforms.uT.value = t;
  beam.position.set(gx + Math.sin(P.yaw) * 6, 1.1, gz + Math.cos(P.yaw) * 6);
  beam.rotation.set(0, 0, 0); beam.lookAt(gx, 1.5, gz); beam.rotateX(Math.PI / 2);
  // láser
  const ld = rayWall(L.map, gx, gz, Math.sin(P.yaw), Math.cos(P.yaw), 22);
  const lh = hitscan(gx, gz, Math.sin(P.yaw), Math.cos(P.yaw), ld);
  const len = lh.d; laser.visible = laserDot.visible = P.alive;
  laser.position.set(gx + Math.sin(P.yaw) * len / 2, 1.28, gz + Math.cos(P.yaw) * len / 2); laser.scale.z = len; laser.rotation.y = P.yaw;
  laserDot.position.set(gx + Math.sin(P.yaw) * len, 1.28, gz + Math.cos(P.yaw) * len);
  laserMat.opacity = mouse.right ? 0.85 : 0.35;
  // luna
  if (L.th.moon) { moon.position.set(camLook.x - 14, 32, camLook.z - 18); moon.target.position.copy(camLook); }
  // reparto de las luces puntuales a las lámparas más cercanas
  const cx = camLook.x, cz = camLook.z;
  for (const l of L.lamps) l._d = (l.x - cx) ** 2 + (l.z - cz) ** 2 + (l.small ? 30 : 0);
  const sorted = L.lamps.filter(l => l.power > 0).sort((a, b) => a._d - b._d);
  const shad = sorted.filter(l => !l.small && !l.exit && !l.fire).slice(0, SPOOL.length);
  const near = sorted.filter(l => !shad.includes(l)).slice(0, LPOOL.length);
  const flick = (l) => {
    let f = 1;
    if (l.flick === 1) { const h = Math.sin(Math.floor(t * 9 + l.x * 7) * 12.9898) * 43758.5453; f = (h - Math.floor(h)) > 0.82 ? 0.08 : 0.95 + Math.sin(t * 60) * 0.05; }
    else if (l.flick === 2) f = 0.75 + Math.sin(t * 17 + l.x) * 0.12 + Math.sin(t * 31 + l.z) * 0.1;
    if (l.exit) f = 0.8 + Math.sin(t * 3) * 0.2;
    if (l.pool) l.pool.material.opacity = f; if (l.cone) l.cone.material.uniforms.uOp.value = 0.16 * f;
    return f;
  };
  SPOOL.forEach((sl, i) => { const l = shad[i]; if (!l) { sl.intensity = 0; return; } const f = flick(l); sl.position.set(l.x, l.y - 0.05, l.z); sl.target.position.set(l.x, 0, l.z); sl.color.set(l.color); sl.intensity = l.power * 1.6 * f; });
  LPOOL.forEach((pl, i) => {
    const l = near[i]; if (!l) { pl.intensity = 0; return; }
    const f = flick(l);
    pl.position.set(l.x, l.y, l.z); pl.color.set(l.color); pl.intensity = l.power * f; pl.distance = l.small ? 8 : 18;
  });
}

let last = performance.now(), fpsAcc = 0, fpsN = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 3) { const avg = fpsAcc / fpsN; if (avg > 0.028 && aoPass && aoPass.enabled) { aoPass.enabled = false; } else if (avg > 0.028 && PR > 1) { PR = Math.max(1, PR - 0.5); renderer.setPixelRatio(PR); composer.setPixelRatio(PR); onResize(); } else if (avg > 0.034 && bloom.enabled && PR <= 1) { bloom.enabled = false; } fpsAcc = 0; fpsN = 0; }
  G.t += dt;
  grade.uniforms.uTime.value = G.t;
  if (G.mode === 'play' && !G.paused && G.level) update(dt);
  else if (G.level && (G.mode === 'title' || G.mode === 'brief')) previewCam(dt);
  if (G.level) {
    mats().spore.emissiveIntensity = 2.6 + Math.sin(G.t * 2.5) * 1.1;
    G.level.fires.forEach(f => f.userData.mat.uniforms.uT.value = G.t + f.position.x);
    if (G.level.mists) G.level.mists.forEach(m => m.material.uniforms.uT.value = G.t);
    if (G.level.exit) { const ex = G.level.exit.mesh.userData; ex.beamMat.uniforms.uT.value = G.t; const ready = G.M && curObjIsReach(); ex.beamMat.uniforms.uCol.value.set(ready ? 0x50ff9a : 0xff4030); ex.ring.material.color.set(ready ? 0x50ff9a : 0xff4030).multiplyScalar(2.5); ex.ring.scale.setScalar(1 + Math.sin(G.t * 3) * 0.06); }
    G.level.pickups.forEach(p => { if (!p.taken) { p.mesh.rotation.y += dt * 1.2; p.mesh.children[0].position.y = Math.sin(G.t * 3 + p.x) * 0.05; } });
    G.level.targets.forEach(t => t.mesh.traverse(o => { if (o.userData.spin) o.rotation[o.geometry.type === 'TorusGeometry' ? 'z' : 'y'] += dt * o.userData.spin * 10; }));
    PART.update(dt, camLook.x, camLook.z, G.t);
  }
  grade.uniforms.uDamage.value = G.dmgFx + (G.player && G.player.hp < 30 && G.player.alive ? 0.25 + Math.sin(G.t * 6) * 0.1 : 0);
  grade.uniforms.uAlert.value = G.alarm && G.mode === 'play' ? 0.5 + Math.sin(G.t * 8) * 0.5 : 0;
  G.dmgFx = Math.max(0, G.dmgFx - dt * 1.5);
  composer.render(dt);
}
function curObjIsReach() { return curObj().type === 'reach'; }

let previewA = 0;
function previewCam(dt) {
  previewA += dt * 0.05; const L = G.level, c = L.arenaCenter;
  const cx = G.mode === 'title' ? L.startPos.x + 14 : c.x, cz = G.mode === 'title' ? L.startPos.z : c.z;
  const r = G.mode === 'title' ? 16 : 22;
  camera.position.set(cx + Math.cos(previewA) * r, G.mode === 'title' ? 9 : 22, cz + Math.sin(previewA) * r);
  camLook.set(cx, 0, cz); camera.lookAt(cx, 1, cz);
  if (G.player) { G.player.yaw = Math.PI / 2; updLights(dt); flash.intensity = G.mode === 'title' ? 0 : 110; beam.visible = false; laser.visible = laserDot.visible = false; }
  G.actors.forEach(a => { a.rig.g.position.set(a.x, 0, a.z); a.rig.g.rotation.y = a.yaw; if (a.cone) a.cone.visible = false; });
  if (G.mode === 'title' && G.player) { G.player.rig.g.visible = false; }
  moon.position.set(cx - 14, 32, cz - 18); moon.target.position.set(cx, 0, cz);
}

function update(dt) {
  G.time += dt;
  const P = G.player;
  updPlayer(dt);
  if (P.alive && !G.done) updInteract(dt);
  for (const a of G.actors) {
    if (!a.alive) { animDeath(a.rig, dt); a.rig.g.position.set(a.x, 0, a.z); a.rig.g.rotation.y = a.yaw; continue; }
    if (a.kind === 'guard') updGuard(a, dt);
    else if (a.kind === 'novak') updNovak(a, dt);
    else if (a.kind === 'boss') updBoss(a, dt);
    else updInfected(a, dt);
    if (a.rig.recoil) { a.rig.armR.pivot.rotation.x -= a.rig.recoil * 0.3; a.rig.recoil = Math.max(0, a.rig.recoil - dt * 8); }
    a.rig.g.position.set(a.x, 0, a.z); a.rig.g.rotation.y = a.yaw;
    if (a.hitT > 0) { a.hitT -= dt; a.rig.g.position.x += (Math.random() - 0.5) * 0.08; }
  }
  separate();
  P.rig.g.position.set(P.x, 0, P.z);
  updPlants(dt);
  // el fuego quema
  for (const f of G.level.fires) { if (Math.hypot(f.position.x - P.x, f.position.z - P.z) < 1.1 && P.alive) { G.burnT = (G.burnT || 0) - dt; if (G.burnT <= 0) { G.burnT = 0.4; P.inv = 0; damagePlayer(5); } } }
  // alarma
  if (G.alarm) {
    const anySee = G.actors.some(a => a.alive && a.kind === 'guard' && a.seesP);
    if (G.forceAlarm) G.alarmT = Math.max(G.alarmT, 8);
    if (!anySee) G.alarmT -= dt;
    if (G.alarmT <= 0 || !G.actors.some(a => a.alive && a.kind === 'guard')) { G.alarm = false; G.evadeT = 16; SFX.setMusic(1); G.actors.forEach(a => { if (a.kind === 'guard' && a.alive) { a.state = 'search'; a.sp = null; } }); }
  } else if (G.evadeT > 0) {
    G.evadeT -= dt; if (G.evadeT <= 0) { SFX.setMusic(0); G.caution = 30; G.actors.forEach(a => { if (a.kind === 'guard' && a.alive) { a.state = 'return'; a.path = null; a.sus = 0; } }); }
  }
  if (G.caution > 0) G.caution -= dt;
  // modos especiales
  const M = G.M;
  if (M.survive && !G.done) {
    G.survT -= dt; G.waveT -= dt;
    if (G.waveT <= 0) { const el = M.survive - G.survT; G.waveT = Math.max(2.2, 5.5 - el / 25); const n = 1 + (el > 30 ? 1 : 0) + (el > 60 ? 1 : 0); for (let k = 0; k < n; k++) { const c = edgeSpawn(); if (!c) continue; const kind = el > 25 && Math.random() < 0.3 ? 'runner' : el > 70 && Math.random() < 0.08 ? 'brute' : 'infected'; const a = spawn(kind, c.x, c.z); a.state = 'chase'; a.target = Math.random() < 0.6 ? G.novak : P; } }
    if (G.survT <= 0) { G.survT = 0; missionComplete(); }
  }
  if (M.escape && !G.done) { G.escT -= dt; if (Math.random() < dt * 0.15) { G.shake = Math.max(G.shake, 0.6); SFX.explosion(30); } if (G.escT <= 0) { G.escT = 0; fail('El núcleo se ha fundido. No quedó nada.'); } }
  if (M.boss) {
    G.ammoT -= dt; if (G.ammoT <= 0 && !G.done) { G.ammoT = 14; const c = edgeSpawn(); if (c) { const type = Math.random() < 0.5 ? 'shells' : Math.random() < 0.75 ? 'ammo' : 'medkit'; const p = { type, x: c.x, z: c.z }; p.mesh = makePickup(type); p.mesh.position.set(c.x, 0, c.z); G.level.group.add(p.mesh); G.level.pickups.push(p); } }
    if (G.bossDeadT > 0) { G.bossDeadT -= dt; if (G.bossDeadT <= 0 && !G.done) { G.actors.forEach(a => { if (a.alive && a.faction === 'i') killActor(a, false, true); }); missionComplete(); } }
  }
  // salida
  if (curObjIsReach() && !G.done && P.alive) {
    const ex = G.level.exit; const d = Math.hypot(P.x - ex.x, P.z - ex.z);
    if (d < 1.6) {
      if (M.escort && G.novak && dist(G.novak, ex) > 5) { if ((G.waitMsgT = (G.waitMsgT || 0) - dt) <= 0) { G.waitMsgT = 5; subLine('SYS', null, 'Espera a que Novak te alcance.'); } }
      else missionComplete();
    }
  }
  // hints de la primera misión
  if (M.id === 1 && !G.hintDone) { G.hintDone = true; ['Muévete con WASD · apunta con el ratón · Mayús para correr (hace ruido).', 'C para agacharte: te mueves en silencio y te ven peor. F apaga la linterna.', 'Espacio cerca de un guardia de espaldas: neutralización silenciosa.', 'El radar muestra los conos de visión. El rombo indica el objetivo.'].forEach(t => subLine('SYS', null, t)); }
  if (P.hp < 30 && P.alive) { G.hbT = (G.hbT || 0) - dt; if (G.hbT <= 0) { G.hbT = 0.9; SFX.heartbeat(); } }
  updCamera(dt); updLights(dt); updFX(dt); updSubs(dt);
  CUT.uPlayer.value.set(P.x, 0, P.z);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('on'); }
  updHUD(); updTags(); drawRadar();
}

// ============================================================================
// Pantallas
// ============================================================================
const UI = $('ui');
function screen(html, cls = 'dim') { UI.innerHTML = `<div class="screen ${cls}">${html}</div>`; return UI.firstChild; }
function hideScreen() { UI.innerHTML = ''; }
function setHUD(on) { $('hud').classList.toggle('on', on); $('cursor').hidden = !on || touch.on; canvas.style.cursor = on ? 'none' : 'default'; $('touch').classList.toggle('on', on && touch.on); if (!on) { $('tags').innerHTML = ''; delete tagEls.prompt; } }

function showTitle() {
  G.mode = 'title'; G.paused = false; setHUD(false); SFX.setMusic(0);
  loadMission(0, true);
  const cont = SAVE.unlocked > 1;
  const el = screen(`<div class="wrap">
    <div class="eyebrow">Sección Nueve · Expediente 11-SLV</div>
    <h1>Protocolo<span>Ceniza</span></h1>
    <p class="tag">Infiltración y supervivencia en una isla del Atlántico Norte. Veinte misiones. Un laboratorio que nunca debió existir.</p>
    <div class="menu">
      ${cont ? `<button id="bCont">Continuar<small>Misión ${String(SAVE.unlocked).padStart(2, '0')} · ${MISSIONS[SAVE.unlocked - 1].title}</small></button>` : ''}
      <button id="bNew">Nueva operación<small>Empieza desde el desembarco</small></button>
      <button id="bSel">Seleccionar misión<small>${SAVE.unlocked} de 20 desbloqueadas</small></button>
      <button id="bKeys">Controles</button>
      <button id="bQ">Gráficos: ${Q.name}<small>Ultra · Alta · Media (reinicia la página)</small></button>
    </div></div>
    <div class="foot">THULE-7 · ISLA SÓLVEIG · 63°N</div>`, '');
  el.id = 'title';
  if (cont) $('bCont').onclick = () => { SFX.init(); SFX.ui(); showBriefing(SAVE.unlocked - 1); };
  $('bNew').onclick = () => { SFX.init(); SFX.ui(); showPrologue(); };
  $('bSel').onclick = () => { SFX.init(); SFX.ui(); showSelect(); };
  $('bKeys').onclick = () => { SFX.init(); SFX.ui(); showKeys(showTitle); };
  $('bQ').onclick = () => { const ks = Object.keys(QUALITY), nk = ks[(ks.indexOf(QKEY) + 1) % ks.length]; try { localStorage.setItem('protocolo-ceniza-q', nk); } catch (e) { } location.reload(); };
  setTimeout(() => (cont ? $('bCont') : $('bNew')).focus(), 50);
}
function showKeys(back) {
  screen(`<div class="card"><div class="eyebrow">Manual de campo</div><h2>Controles</h2>
    <div class="keys">
      <kbd>W A S D</kbd><span>Moverse</span><kbd>Ratón</kbd><span>Apuntar · clic izquierdo dispara</span>
      <kbd>Clic derecho</kbd><span>Apuntar con precisión (más lento, menos dispersión)</span>
      <kbd>Mayús</kbd><span>Correr (hace ruido)</span><kbd>C / Ctrl</kbd><span>Agacharse: silencio y menos visibilidad</span>
      <kbd>Espacio</kbd><span>CQC: neutraliza en silencio a un guardia desprevenido · cuchillo contra infectados</span>
      <kbd>E (mantener)</kbd><span>Interactuar con objetivos</span><kbd>R</kbd><span>Recargar</span>
      <kbd>Q · 1 · 2</kbd><span>Cambiar de arma</span><kbd>H</kbd><span>Usar botiquín (+45)</span>
      <kbd>F</kbd><span>Linterna: ver mejor o pasar desapercibida</span><kbd>Esc / P</kbd><span>Pausa</span>
    </div>
    <p class="hint">Los guardias ven en un cono y oyen disparos y carreras. Los infectados oyen todo y ven poco, pero la linterna los atrae. Los anillos en el suelo muestran cuánto ruido haces.</p>
    <div class="btnrow"><button class="btn" id="bBack">Volver</button></div></div>`);
  $('bBack').onclick = () => { SFX.ui(); back(); }; $('bBack').focus();
}
function showSelect() {
  const items = MISSIONS.map((m, i) => `<button data-i="${i}" ${i + 1 > SAVE.unlocked ? 'disabled' : ''}><span>MISIÓN ${String(m.id).padStart(2, '0')}${SAVE.ranks[m.id] ? ' · RANGO ' + SAVE.ranks[m.id] : ''}</span>${m.title}</button>`).join('');
  screen(`<div class="card"><div class="eyebrow">Expediente de operación</div><h2>Misiones</h2><div class="grid20">${items}</div><div class="btnrow"><button class="btn ghost" id="bBack">Volver</button></div></div>`);
  UI.querySelectorAll('.grid20 button').forEach(b => b.onclick = () => { SFX.ui(); showBriefing(+b.dataset.i); });
  $('bBack').onclick = () => { SFX.ui(); showTitle(); };
}
function showPrologue() {
  const el = screen(`<div class="card" style="width:min(760px,100%)"><div class="eyebrow">Prólogo</div><h2>Isla Sólveig</h2><div class="prose" id="pr"></div><div class="btnrow"><button class="btn" id="bGo">Iniciar operación</button></div></div>`);
  const pr = $('pr'); PROLOGUE.forEach((p, i) => { const e = document.createElement('p'); e.textContent = p; e.style.animationDelay = (i * 0.9) + 's'; pr.appendChild(e); });
  $('bGo').onclick = () => { SFX.ui(); showBriefing(0); }; $('bGo').focus();
}

function radioSequence(container, lines, done) {
  let i = 0, typing = null, full = '';
  const next = () => {
    if (typing) { clearInterval(typing); typing = null; container.lastChild.querySelector('.txt').textContent = full; return; }
    if (i >= lines.length) { done(); return; }
    const [sp, text] = lines[i++]; full = text;
    const wrap = document.createElement('div'); wrap.innerHTML = lineHTML(sp, ''); const el = wrap.firstChild; container.appendChild(el);
    while (container.children.length > 3) container.removeChild(container.firstChild);
    const tx = el.querySelector('.txt'); let k = 0; SFX.radio();
    typing = setInterval(() => { k += 2; tx.textContent = text.slice(0, k); if (k % 8 === 0) SFX.blip(); if (k >= text.length) { clearInterval(typing); typing = null; } }, 22);
  };
  next();
  return next;
}

function showBriefing(idx) {
  G.mode = 'brief'; setHUD(false);
  loadMission(idx, true); SFX.ambient(MISSIONS[idx].theme); SFX.setMusic(0);
  const M = MISSIONS[idx];
  const el = screen(`<div class="card"><div class="eyebrow">Misión ${String(M.id).padStart(2, '0')} / 20 · Enlace de radio</div><h2>${M.title}</h2>
    <div class="meta"><span>Lugar <b>${M.place}</b></span><span>Hora <b>${M.time}</b></span>${SAVE.ranks[M.id] ? `<span>Mejor rango <b>${SAVE.ranks[M.id]}</b></span>` : ''}</div>
    <div class="radio" id="rad"></div><div class="hint" id="rh">Clic, Espacio o Intro para continuar</div>
    <div id="objs" hidden></div>
    <div class="btnrow"><button class="btn" id="bStart" hidden>Iniciar misión</button><button class="btn ghost" id="bSkip">Saltar diálogo</button><button class="btn ghost" id="bMenu">Menú</button></div></div>`);
  const showObjs = () => {
    const o = $('objs'); if (!o) return; o.hidden = false; o.className = 'objs'; o.innerHTML = '<div class="eyebrow" style="margin-bottom:6px">Objetivos</div>' + M.objectives.map(x => `<div>${x.label}</div>`).join('');
    $('bStart').hidden = false; $('bSkip').hidden = true; $('rh').hidden = true; $('bStart').focus(); G.briefNext = null;
  };
  G.briefNext = radioSequence($('rad'), M.intro, showObjs);
  el.querySelector('.card').addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON' && G.briefNext) G.briefNext(); });
  $('bSkip').onclick = () => { SFX.ui(); const r = $('rad'); r.innerHTML = ''; M.intro.slice(-2).forEach(l => r.insertAdjacentHTML('beforeend', lineHTML(l[0], l[1]))); showObjs(); };
  $('bStart').onclick = () => { SFX.init(); SFX.ui(); startMission(idx); };
  $('bMenu').onclick = () => { SFX.ui(); showTitle(); };
}

function startMission(idx) {
  fade(() => {
    loadMission(idx, false); hideScreen(); G.mode = 'play'; G.paused = false; G.hintDone = false; hudCache = {};
    buildRadarMap(); setHUD(true); updHUDObjective(); toast(`${String(G.M.id).padStart(2, '0')} · ${G.M.title.toUpperCase()}`);
    SFX.setMusic(G.M.boss || G.M.survive || G.M.escape ? 2 : 0);
  });
}
function fade(fn) { const f = $('fade'); f.classList.add('on'); setTimeout(() => { fn(); setTimeout(() => f.classList.remove('on'), 80); }, 550); }

function rankOf() {
  const M = G.M, s = G.stats; const par = 100 + M.objectives.length * 55 + (M.w * M.h) / 20;
  let sc = 100 - s.alerts * 14 - Math.min(30, s.damage / 4) - Math.max(0, (G.time - par) / 8) - s.kills * 3 - s.takedowns * 0.5;
  if (M.survive || M.boss || M.escape) sc = 100 - Math.min(45, s.damage / 3) - (M.escape ? Math.max(0, (M.escape - G.escT - 120) / 3) : 0);
  const r = sc >= 88 ? 'S' : sc >= 72 ? 'A' : sc >= 55 ? 'B' : sc >= 35 ? 'C' : 'D';
  const names = { S: 'Fantasma', A: 'Sombra', B: 'Operativa', C: 'Ruidosa', D: 'Superviviente' };
  return [r, names[r]];
}
function missionComplete() {
  if (G.done) return; G.done = true; SFX.objective(); SFX.setMusic(0);
  const [r, rn] = rankOf(); const M = G.M;
  const order = ['D', 'C', 'B', 'A', 'S'];
  if (!SAVE.ranks[M.id] || order.indexOf(r) > order.indexOf(SAVE.ranks[M.id])) SAVE.ranks[M.id] = r;
  SAVE.unlocked = Math.max(SAVE.unlocked, Math.min(20, M.id + 1)); save();
  setTimeout(() => {
    G.mode = 'debrief'; setHUD(false);
    const s = G.stats; const mm = Math.floor(G.time / 60), ss = Math.floor(G.time % 60);
    screen(`<div class="card"><div class="eyebrow">Misión ${String(M.id).padStart(2, '0')} completada</div><h2>${M.title}</h2>
      <div class="radio" id="rad"></div><div class="hint" id="rh">Clic, Espacio o Intro para continuar</div>
      <div id="res" hidden>
        <div class="rank"><div class="r">${r}</div><div class="n">RANGO<b>${rn}</b></div></div>
        <div class="stats"><div><span>Tiempo</span><b>${mm}:${String(ss).padStart(2, '0')}</b></div><div><span>Alertas</span><b>${s.alerts}</b></div><div><span>Guardias abatidos</span><b>${s.kills}</b></div><div><span>Neutralizaciones CQC</span><b>${s.takedowns}</b></div><div><span>Infectados</span><b>${s.infKills}</b></div><div><span>Daño recibido</span><b>${Math.round(s.damage)}</b></div><div><span>Documentos</span><b>${s.docs}/${(M.docs || []).length}</b></div></div>
      </div>
      <div class="btnrow" id="dbtn" hidden>${M.id < 20 ? '<button class="btn" id="bNext">Siguiente misión</button>' : '<button class="btn" id="bEnd">Epílogo</button>'}<button class="btn ghost" id="bRe">Repetir</button><button class="btn ghost" id="bMenu">Menú</button></div></div>`);
    const fin = () => { $('res').hidden = false; $('dbtn').hidden = false; $('rh').hidden = true; G.briefNext = null; const b = $('bNext') || $('bEnd'); b.focus(); };
    G.briefNext = radioSequence($('rad'), M.outro, fin);
    UI.querySelector('.card').addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON' && G.briefNext) G.briefNext(); });
    if ($('bNext')) $('bNext').onclick = () => { SFX.ui(); showBriefing(M.id); };
    if ($('bEnd')) $('bEnd').onclick = () => { SFX.ui(); showEpilogue(); };
    $('bRe').onclick = () => { SFX.ui(); showBriefing(M.id - 1); };
    $('bMenu').onclick = () => { SFX.ui(); showTitle(); };
  }, 1200);
}
function fail(reason) {
  if (G.done) return; G.done = true; SFX.setMusic(0);
  setTimeout(() => {
    G.mode = 'dead'; setHUD(false);
    screen(`<div class="card" style="width:min(560px,100%)"><div class="eyebrow red">Señal perdida</div><h2 class="red">Misión fallida</h2><p class="prose">${reason}</p>
      <p class="hint">Ibarra: «Sílex, ¿me recibes? Repite la aproximación».</p>
      <div class="btnrow"><button class="btn" id="bRe">Reintentar</button><button class="btn ghost" id="bBr">Ver informe</button><button class="btn ghost" id="bMenu">Menú</button></div></div>`);
    $('bRe').onclick = () => { SFX.ui(); startMission(G.idx); }; $('bRe').focus();
    $('bBr').onclick = () => { SFX.ui(); showBriefing(G.idx); };
    $('bMenu').onclick = () => { SFX.ui(); showTitle(); };
  }, 900);
}
function showEpilogue() {
  G.mode = 'brief'; setHUD(false);
  const el = screen(`<div class="card" style="width:min(780px,100%)"><div class="eyebrow">Epílogo</div><h2>Ceniza</h2><div class="prose" id="pr"></div>
    <p class="hint" style="margin-top:18px">PROTOCOLO CENIZA · Una historia original de infiltración y supervivencia.</p>
    <div class="btnrow"><button class="btn" id="bT">Volver al inicio</button><button class="btn ghost" id="bS">Seleccionar misión</button></div></div>`);
  const pr = $('pr'); EPILOGUE.forEach((p, i) => { const e = document.createElement('p'); e.textContent = p; e.style.animationDelay = (i * 1.1) + 's'; pr.appendChild(e); });
  $('bT').onclick = () => { SFX.ui(); showTitle(); }; $('bS').onclick = () => { SFX.ui(); showSelect(); };
}
function openDoc(doc) {
  G.paused = true; G.uiBlock = true; mouse.left = false;
  const el = screen(`<div class="doc"><h3>${doc.title}</h3><pre></pre><button class="btn" id="bClose">Guardar y continuar</button></div>`);
  el.querySelector('pre').textContent = doc.body; $('cursor').hidden = true; canvas.style.cursor = 'default';
  const close = () => { SFX.ui(); hideScreen(); G.paused = false; setTimeout(() => G.uiBlock = false, 150); $('cursor').hidden = touch.on; canvas.style.cursor = 'none'; if (G.M.docRadio && !G.docRadioDone) { G.docRadioDone = true; G.M.docRadio.forEach(l => subLine(l[0], null, l[1])); } G.closeDoc = null; };
  $('bClose').onclick = close; G.closeDoc = close; $('bClose').focus();
}
function pause() {
  if (G.mode !== 'play' || G.done) return;
  if (G.paused) { if (G.closeDoc) { G.closeDoc(); return; } resume(); return; }
  G.paused = true; mouse.left = false; $('cursor').hidden = true; canvas.style.cursor = 'default';
  const ob = curObj();
  screen(`<div class="card" style="width:min(520px,100%)"><div class="eyebrow">Pausa · Misión ${String(G.M.id).padStart(2, '0')}</div><h2>${G.M.title}</h2>
    <div class="objs"><div>${ob.label}</div></div>
    <div class="menu" style="margin-top:18px;width:100%"><button id="pR">Continuar</button><button id="pRe">Reiniciar misión</button><button id="pK">Controles</button><button id="pM">Abandonar al menú</button></div></div>`);
  $('pR').onclick = resume; $('pRe').onclick = () => { SFX.ui(); startMission(G.idx); }; $('pK').onclick = () => showKeys(() => { G.paused = false; pause(); }); $('pM').onclick = () => { SFX.ui(); showTitle(); };
  $('pR').focus();
}
function resume() { hideScreen(); G.paused = false; $('cursor').hidden = touch.on; canvas.style.cursor = 'none'; }

// ============================================================================
// Entrada
// ============================================================================
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.code) && G.mode === 'play') e.preventDefault();
  if ((G.mode === 'brief' || G.mode === 'debrief') && G.briefNext && (e.code === 'Space' || e.code === 'Enter') && !(document.activeElement && document.activeElement.tagName === 'BUTTON' && !document.activeElement.hidden && e.code === 'Enter')) { e.preventDefault(); G.briefNext(); return; }
  if (e.repeat) { keys[e.code] = true; return; }
  keys[e.code] = true; SFX.init();
  if (e.code === 'Escape' || e.code === 'KeyP') { pause(); return; }
  if (G.mode !== 'play' || G.paused) return;
  const P = G.player; if (!P || !P.alive) return;
  if (e.code === 'KeyC' || e.code === 'ControlLeft') P.crouch = !P.crouch;
  if (e.code === 'KeyF') { P.lamp = !P.lamp; SFX.ui(); }
  if (e.code === 'KeyR') startReload();
  if (e.code === 'Space') doCQC();
  if (e.code === 'KeyH') { if (P.med > 0 && P.hp < 100) { P.med--; P.hp = Math.min(100, P.hp + 45); SFX.pickup(); subLine('SYS', null, 'Botiquín aplicado'); } }
  if ((e.code === 'KeyQ' || e.code === 'Digit1' || e.code === 'Digit2') && P.hasShotgun) { const w = e.code === 'Digit1' ? 'pistol' : e.code === 'Digit2' ? 'shotgun' : (P.weapon === 'pistol' ? 'shotgun' : 'pistol'); if (w !== P.weapon) { P.weapon = w; P.reloadT = 0; P.fireT = 0.35; SFX.reload(); } }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.left = mouse.right = false; });
addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; const c = $('cursor'); c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
canvas.addEventListener('mousedown', (e) => { SFX.init(); if (e.button === 0) mouse.left = true; if (e.button === 2) mouse.right = true; });
addEventListener('mouseup', (e) => { if (e.button === 0) mouse.left = false; if (e.button === 2) mouse.right = false; });
addEventListener('contextmenu', (e) => { if (G.mode === 'play') e.preventDefault(); });
addEventListener('wheel', (e) => { if (G.mode === 'play' && !G.paused && G.player && G.player.hasShotgun && Math.abs(e.deltaY) > 20) { G.player.weapon = G.player.weapon === 'pistol' ? 'shotgun' : 'pistol'; G.player.reloadT = 0; SFX.reload(); } }, { passive: true });

// táctil
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  touch.on = matchMedia('(pointer: coarse)').matches;
  const stick = (id, cb) => {
    const el = $(id), knob = el.querySelector('i'); let pid = null, cx = 0, cy = 0;
    el.addEventListener('pointerdown', (e) => { SFX.init(); pid = e.pointerId; el.setPointerCapture(pid); const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); });
    const move = (e) => { if (e.pointerId !== pid) return; let dx = (e.clientX - cx) / 55, dy = (e.clientY - cy) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } knob.style.transform = `translate(${dx * 38}px,${dy * 38}px)`; cb(dx, dy); };
    el.addEventListener('pointermove', move);
    const up = (e) => { if (e.pointerId !== pid) return; pid = null; knob.style.transform = ''; cb(0, 0); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  stick('stickL', (x, y) => { touch.mx = x; touch.mz = y; });
  stick('stickR', (x, y) => { touch.ax = x; touch.az = y; touch.fire = Math.hypot(x, y) > 0.75; });
  document.querySelectorAll('.tbtns button').forEach(b => {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); const k = b.dataset.k; if (k === 'KeyE') { touch.act = true; return; } dispatchEvent(new KeyboardEvent('keydown', { code: k })); setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { code: k })), 60); });
    b.addEventListener('pointerup', () => { if (b.dataset.k === 'KeyE') touch.act = false; });
  });
}

function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  if (smaa) smaa.setSize(innerWidth * PR, innerHeight * PR);
  grade.uniforms.uRes.value.set(innerWidth * PR, innerHeight * PR);
}
addEventListener('resize', onResize); onResize();

// arranque
try {
  showTitle();
  $('loading').remove();
  requestAnimationFrame(loop);
} catch (err) { $('loading').textContent = 'ERROR: ' + err.message; console.error(err); }
// gancho de depuración (consola): __PC.start(n) inicia la misión n (1-20)
window.__PC = { G, start: (n) => startMission(n - 1), brief: (n) => showBriefing(n - 1), hurt: (a, n) => damageActor(a, n, true) };
