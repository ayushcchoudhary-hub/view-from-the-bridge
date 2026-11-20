import * as THREE from './vendor/three.module.js';
import { MemorySound } from './sound.js';

const canvas = document.getElementById('viewport');
const titleCard = document.getElementById('title-card');
const btnBegin = document.getElementById('btn-begin');
const bridgeMark = document.getElementById('bridge-mark');
const hud = document.getElementById('hud');
const btnPlay = document.getElementById('btn-play');
const btnReplay = document.getElementById('btn-replay');
const btnSound = document.getElementById('btn-sound');
const btnRecord = document.getElementById('btn-record');
const scrub = document.getElementById('scrub');
const hudRoom = document.getElementById('hud-room');

const sound = new MemorySound();

// Optional clean capture mode via URL query (?capture=1) for frame-perfect MP4/GIF exports
const params = new URLSearchParams(window.location.search);
const captureMode = params.get('capture') === '1';

// ---------------------------------------------------------------------------
// 1. Renderer, Scene & Grand Cinema-Lens Museum Setup (42° FOV = Zero Distortion!)
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09090d);
scene.fog = new THREE.FogExp2(0x09090d, 0.0175);

// 42° vertical cinema lens removes wide-angle stretching on large flat canvases!
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 260);

scene.add(new THREE.HemisphereLight(0x4a4d62, 0x2a2018, 1.4));
scene.add(new THREE.AmbientLight(0x282522, 0.65));

const visitorLight = new THREE.PointLight(0xffdfb0, 2.4, 24, 1.45);
scene.add(visitorLight);

// ---------------------------------------------------------------------------
// 2. Procedural Museum Textures
// ---------------------------------------------------------------------------
function makeFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#292019';
  ctx.fillRect(0, 0, 512, 512);

  const planks = 8;
  const pw = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const shade = 34 + ((i * 17) % 14);
    ctx.fillStyle = `rgb(${shade + 10}, ${shade + 2}, ${shade - 5})`;
    ctx.fillRect(i * pw + 1.5, 0, pw - 3, 512);

    ctx.strokeStyle = 'rgba(255, 232, 200, 0.05)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 22; g++) {
      const gx = i * pw + Math.random() * pw;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (Math.random() - 0.5) * 6, 512);
      ctx.stroke();
    }

    ctx.fillStyle = '#120e0b';
    ctx.fillRect(i * pw, 0, 2, 512);
  }

  ctx.fillStyle = 'rgba(14, 10, 8, 0.72)';
  for (let j = 0; j < 6; j++) {
    const y = (j * 97) % 512;
    ctx.fillRect(0, y, 512, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 62);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#18181f');
  g.addColorStop(0.52, '#24232c');
  g.addColorStop(1, '#2b2624');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 26 + Math.floor(Math.random() * 20);
    ctx.fillStyle = `rgba(${v + 4}, ${v + 2}, ${v + 8}, 0.24)`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = 'rgba(8, 8, 12, 0.45)';
  for (let x = 0; x < 512; x += 128) {
    ctx.fillRect(x, 0, 2, 512);
  }
  ctx.fillStyle = 'rgba(255, 238, 210, 0.06)';
  ctx.fillRect(0, 488, 512, 3);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(44, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSoftDotTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  g.addColorStop(0, 'rgba(255, 244, 222, 1)');
  g.addColorStop(0.35, 'rgba(255, 232, 192, 0.55)');
  g.addColorStop(1, 'rgba(255, 220, 170, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePlaqueTexture(roman) {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#181512';
  ctx.fillRect(0, 0, 160, 96);
  ctx.strokeStyle = 'rgba(226, 167, 92, 0.65)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 144, 80);
  ctx.fillStyle = '#efe2c8';
  ctx.font = '500 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(roman, 80, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// 3. Grand Serpentine Museum Floorplan:
//    Straight flat gallery walls at each painting + smooth winding bends between!
// ---------------------------------------------------------------------------
const HALF_W = 5.1;   // 10.2m wide grand gallery hall (open, breathable, museum-scale)
const WALL_H = 6.5;   // 6.5m tall gallery ceiling

const BAY_SPECS = [
  { x: -3.6, zMid:  -20, side: -1, roman: 'I',    label: 'ROOM I',    mood: 'docks',    img: './assets/scene_01.jpg', lightColor: 0x8db8ff },
  { x:  3.6, zMid:  -44, side:  1, roman: 'II',   label: 'ROOM II',   mood: 'warm',     img: './assets/scene_02.jpg', lightColor: 0xffd599 },
  { x: -3.6, zMid:  -68, side: -1, roman: 'III',  label: 'ROOM III',  mood: 'warm',     img: './assets/scene_03.jpg', lightColor: 0x9ce8dc },
  { x:  3.6, zMid:  -92, side:  1, roman: 'IV',   label: 'ROOM IV',   mood: 'tension',  img: './assets/scene_04.jpg', lightColor: 0xffdca8 },
  { x: -3.6, zMid: -116, side: -1, roman: 'V',    label: 'ROOM V',    mood: 'crimson',  img: './assets/scene_05.jpg', lightColor: 0xff7e75 },
  { x:  3.6, zMid: -140, side:  1, roman: 'VI',   label: 'ROOM VI',   mood: 'cell',     img: './assets/scene_06.jpg', lightColor: 0xd0e2f7 },
  { x: -3.6, zMid: -164, side: -1, roman: 'VII',  label: 'ROOM VII',  mood: 'tension',  img: './assets/scene_07.jpg', lightColor: 0xffcf88 },
  { x:  3.6, zMid: -188, side:  1, roman: 'VIII', label: 'ROOM VIII', mood: 'epilogue', img: './assets/scene_08.jpg', lightColor: 0xe3ecfa }
];

// Build piecewise path: straight 9m-long gallery bays at each painting + smooth cosine S-bends between bays!
function buildGalleryPath() {
  const pts = [];
  // Entrance straight run
  pts.push(new THREE.Vector3(0, 0, 2));
  pts.push(new THREE.Vector3(0, 0, -4));

  const addBend = (x1, z1, x2, z2, steps = 8) => {
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * f);
      pts.push(new THREE.Vector3(x1 + (x2 - x1) * ease, 0, z1 + (z2 - z1) * f));
    }
  };

  // Entrance to Bay 1
  addBend(0, -4, BAY_SPECS[0].x, BAY_SPECS[0].zMid + 5.5, 8);

  for (let i = 0; i < BAY_SPECS.length; i++) {
    const b = BAY_SPECS[i];
    // Perfectly straight 11m gallery bay so the painting wall is 100% FLAT!
    pts.push(new THREE.Vector3(b.x, 0, b.zMid + 3.0));
    pts.push(new THREE.Vector3(b.x, 0, b.zMid));
    pts.push(new THREE.Vector3(b.x, 0, b.zMid - 3.0));
    pts.push(new THREE.Vector3(b.x, 0, b.zMid - 5.5));

    if (i < BAY_SPECS.length - 1) {
      const next = BAY_SPECS[i + 1];
      addBend(b.x, b.zMid - 5.5, next.x, next.zMid + 5.5, 9);
    }
  }

  // Final bend back to center museum archway & straight walk onto the Bridge
  const last = BAY_SPECS[BAY_SPECS.length - 1];
  addBend(last.x, last.zMid - 5.5, 0, -206, 9);
  pts.push(new THREE.Vector3(0, 0, -211));
  pts.push(new THREE.Vector3(0, 0, -219));
  pts.push(new THREE.Vector3(0, 0, -226));

  return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.25);
}

const pathCurve = buildGalleryPath();

// Find exact arc-length parameter t along pathCurve for any target Z
function findTForZ(targetZ) {
  let bestT = 0;
  let bestErr = Infinity;
  const steps = 1600;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = pathCurve.getPointAt(t);
    const err = Math.abs(p.z - targetZ);
    if (err < bestErr) {
      bestErr = err;
      bestT = t;
    }
  }
  return bestT;
}

const CORRIDOR_END_T = findTForZ(-211);

function getRightVec(t) {
  const tan = pathCurve.getTangentAt(Math.max(0, Math.min(1, t))).normalize();
  return new THREE.Vector3(-tan.z, 0, tan.x).normalize();
}

function buildRibbon(sideFn, yBottom, yTop, tMax = CORRIDOR_END_T, segs = 340) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const t = u * tMax;
    const p = pathCurve.getPointAt(t);
    const right = getRightVec(t);
    const { x1, z1, x2, z2 } = sideFn(p, right);

    positions.push(x1, yBottom, z1);
    uvs.push(u, 0);
    positions.push(x2, yTop, z2);
    uvs.push(u, 1);

    if (i < segs) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

const floorMat = new THREE.MeshStandardMaterial({
  map: makeFloorTexture(),
  roughness: 0.44,
  metalness: 0.08
});

const wallMat = new THREE.MeshStandardMaterial({
  map: makeWallTexture(),
  roughness: 0.84,
  metalness: 0.04,
  side: THREE.DoubleSide
});

const ceilingMat = new THREE.MeshStandardMaterial({
  color: 0x0f0f14,
  roughness: 0.92,
  side: THREE.DoubleSide
});

// Grand walnut floor, curving plaster walls, ceiling
scene.add(new THREE.Mesh(
  buildRibbon((p, r) => ({
    x1: p.x - r.x * HALF_W, z1: p.z - r.z * HALF_W,
    x2: p.x + r.x * HALF_W, z2: p.z + r.z * HALF_W
  }), 0, 0),
  floorMat
));

scene.add(new THREE.Mesh(
  buildRibbon((p, r) => ({
    x1: p.x - r.x * HALF_W, z1: p.z - r.z * HALF_W,
    x2: p.x - r.x * HALF_W, z2: p.z - r.z * HALF_W
  }), 0, WALL_H),
  wallMat
));

scene.add(new THREE.Mesh(
  buildRibbon((p, r) => ({
    x1: p.x + r.x * HALF_W, z1: p.z + r.z * HALF_W,
    x2: p.x + r.x * HALF_W, z2: p.z + r.z * HALF_W
  }), 0, WALL_H),
  wallMat
));

scene.add(new THREE.Mesh(
  buildRibbon((p, r) => ({
    x1: p.x - r.x * HALF_W, z1: p.z - r.z * HALF_W,
    x2: p.x + r.x * HALF_W, z2: p.z + r.z * HALF_W
  }), WALL_H, WALL_H),
  ceilingMat
));

// Golden architectural baseboard cove lighting tracing BOTH sides of the winding hall
const coveMat = new THREE.MeshBasicMaterial({
  color: 0xe3a85c,
  transparent: true,
  opacity: 0.42
});
[-1, 1].forEach((side) => {
  scene.add(new THREE.Mesh(
    buildRibbon((p, r) => ({
      x1: p.x + r.x * side * (HALF_W - 0.05), z1: p.z + r.z * side * (HALF_W - 0.05),
      x2: p.x + r.x * side * (HALF_W - 0.05), z2: p.z + r.z * side * (HALF_W - 0.05)
    }), 0.05, 0.12),
    coveMat
  ));
});

// Overhead museum ceiling beams & soft ceiling track lights
const ribMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.65, metalness: 0.35 });
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe0b2 });

for (let i = 1; i <= 32; i++) {
  const t = (i / 33) * CORRIDOR_END_T;
  const p = pathCurve.getPointAt(t);
  const tan = pathCurve.getTangentAt(t);
  const angle = Math.atan2(tan.x, tan.z);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(HALF_W * 2 + 0.2, 0.18, 0.22), ribMat);
  beam.position.set(p.x, WALL_H - 0.16, p.z);
  beam.rotation.y = angle;
  scene.add(beam);

  if (i % 2 === 1) {
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10), bulbMat);
    fixture.position.set(p.x, WALL_H - 0.28, p.z);
    scene.add(fixture);
  }
}

// ---------------------------------------------------------------------------
// 4. The 8 Monumental FLAT Museum Paintings (6.4m × 3.6m, ZERO Distortion!)
// ---------------------------------------------------------------------------
const texLoader = new THREE.TextureLoader();
const frameWoodMat = new THREE.MeshStandardMaterial({ color: 0x14100e, roughness: 0.45, metalness: 0.2 });
const brassMat = new THREE.MeshStandardMaterial({ color: 0xd2a866, roughness: 0.3, metalness: 0.82 });
const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6 });
const softGlowTex = makeSoftDotTexture();

const exhibitMeta = [];

BAY_SPECS.forEach((bay) => {
  const tCenter = findTForZ(bay.zMid);
  const wallX = bay.x + bay.side * (HALF_W - 0.10);
  const yCenter = 2.68;

  // Monumental museum-scale FLAT canvas (6.4m × 3.6m, exact 16:9, zero warp!)
  const W = 6.4;
  const H = W * (9 / 16); // 3.60m tall -> bottom at 0.88m, top at 4.48m inside 6.5m tall hall!

  const group = new THREE.Group();
  group.position.set(wallX, yCenter, bay.zMid);
  // Left wall (-1) faces +X (Math.PI / 2); Right wall (+1) faces -X (-Math.PI / 2)
  group.rotation.y = bay.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  // Deep architectural gallery frame flush against the flat straight bay wall
  const backing = new THREE.Mesh(new THREE.BoxGeometry(W + 0.36, H + 0.36, 0.16), frameWoodMat);
  backing.position.z = -0.05;
  group.add(backing);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, H + 0.08, 0.11), brassMat);
  trim.position.z = -0.01;
  group.add(trim);

  const map = texLoader.load(bay.img);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const artMat = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.72,
    metalness: 0.02,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: map,
    emissiveIntensity: 0.56
  });
  const artMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), artMat);
  artMesh.position.z = 0.055;
  group.add(artMesh);

  // Brass gallery picture-light mounted cleanly above frame
  const lampBar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.2, 12), brassMat);
  lampBar.rotation.z = Math.PI / 2;
  lampBar.position.set(0, H / 2 + 0.38, 0.48);
  group.add(lampBar);

  const bulbStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.042), lampBulbMat);
  bulbStrip.rotation.x = Math.PI / 2;
  bulbStrip.position.set(0, H / 2 + 0.345, 0.48);
  group.add(bulbStrip);

  [-0.72, 0.72].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8), brassMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(ax, H / 2 + 0.38, 0.22);
    group.add(arm);
  });

  // Soft circular warm glow halo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softGlowTex,
    color: bay.lightColor,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  halo.scale.set(3.8, 1.35, 1);
  halo.position.set(0, H / 2 + 0.28, 0.36);
  group.add(halo);

  // Real 3D gallery PointLight bathing the monumental canvas, wall, and walnut floor
  const pLight = new THREE.PointLight(bay.lightColor, 8.2, 22, 1.45);
  pLight.position.set(0, H / 2 + 0.2, 2.6);
  group.add(pLight);

  // Brass-bordered Roman numeral plaque beside the frame
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.22),
    new THREE.MeshBasicMaterial({ map: makePlaqueTexture(bay.roman) })
  );
  plaque.position.set(bay.side * -(W / 2 + 0.52), -0.82, 0.03);
  group.add(plaque);

  scene.add(group);

  const worldFocus = new THREE.Vector3(wallX - bay.side * 0.1, yCenter, bay.zMid);
  exhibitMeta.push({ ...bay, t: tCenter, worldFocus, artMat, pLight, halo });
});

// ---------------------------------------------------------------------------
// 5. The Finale — Stepping Out Onto THE BRIDGE Looking Down Over the Harbor
// ---------------------------------------------------------------------------
const archPos = pathCurve.getPointAt(CORRIDOR_END_T);
const bridgeEnd = pathCurve.getPointAt(1.0);
const railZ = bridgeEnd.z - 1.6;

const deckLen = Math.abs(railZ - archPos.z) + 1.8;
const deckCanvas = document.createElement('canvas');
deckCanvas.width = 256;
deckCanvas.height = 256;
const dctx = deckCanvas.getContext('2d');
dctx.fillStyle = '#1b1d22';
dctx.fillRect(0, 0, 256, 256);
for (let y = 0; y < 256; y += 16) {
  dctx.fillStyle = y % 32 === 0 ? '#22242b' : '#191b21';
  dctx.fillRect(0, y, 256, 14);
  dctx.fillStyle = '#0c0d11';
  dctx.fillRect(0, y + 14, 256, 2);
}
const deckTex = new THREE.CanvasTexture(deckCanvas);
deckTex.wrapS = THREE.RepeatWrapping;
deckTex.wrapT = THREE.RepeatWrapping;
deckTex.repeat.set(3, 5);
deckTex.colorSpace = THREE.SRGBColorSpace;

const bridgeDeck = new THREE.Mesh(
  new THREE.PlaneGeometry(HALF_W * 2.05, deckLen),
  new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.72, metalness: 0.15 })
);
bridgeDeck.rotation.x = -Math.PI / 2;
bridgeDeck.position.set(bridgeEnd.x, 0.005, (archPos.z + railZ) / 2);
scene.add(bridgeDeck);

const archMat = new THREE.MeshStandardMaterial({ color: 0x16161c, roughness: 0.78 });
[-HALF_W, HALF_W].forEach((ox) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, WALL_H + 0.5, 0.8), archMat);
  pillar.position.set(archPos.x + ox, (WALL_H + 0.5) / 2, archPos.z);
  scene.add(pillar);
});
const lintel = new THREE.Mesh(new THREE.BoxGeometry(HALF_W * 2 + 1.1, 0.7, 0.8), archMat);
lintel.position.set(archPos.x, WALL_H + 0.15, archPos.z);
scene.add(lintel);

const ironMat = new THREE.MeshStandardMaterial({ color: 0x2c3445, roughness: 0.36, metalness: 0.76 });
const railW = HALF_W * 2.05;

const topRail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.085, 0.12), ironMat);
topRail.position.set(bridgeEnd.x, 1.12, railZ);
scene.add(topRail);

const midRail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.045, 0.07), ironMat);
midRail.position.set(bridgeEnd.x, 0.58, railZ);
scene.add(midRail);

for (let i = -12; i <= 12; i++) {
  const x = bridgeEnd.x + (i / 12) * (railW / 2);
  const isEnd = Math.abs(i) === 12;
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(isEnd ? 0.18 : 0.045, isEnd ? 1.28 : 1.12, isEnd ? 0.18 : 0.045),
    ironMat
  );
  post.position.set(x, (isEnd ? 1.28 : 1.12) / 2, railZ);
  scene.add(post);
}

[-HALF_W, HALF_W].forEach((sx) => {
  const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, Math.abs(railZ - archPos.z)), ironMat);
  sideRail.position.set(bridgeEnd.x + sx, 1.12, (archPos.z + railZ) / 2);
  scene.add(sideRail);
});

const bridgeTex = texLoader.load('./assets/scene_09.jpg');
bridgeTex.colorSpace = THREE.SRGBColorSpace;
const bridgePanel = new THREE.Mesh(
  new THREE.PlaneGeometry(46, 25.8),
  new THREE.MeshBasicMaterial({ map: bridgeTex, fog: false })
);
bridgePanel.position.set(bridgeEnd.x, 3.2, railZ - 26);
scene.add(bridgePanel);

const waterCanvas = document.createElement('canvas');
waterCanvas.width = 512;
waterCanvas.height = 512;
const wctx = waterCanvas.getContext('2d');
wctx.fillStyle = '#050912';
wctx.fillRect(0, 0, 512, 512);
for (let i = 0; i < 900; i++) {
  const x = Math.random() * 512;
  const y = Math.random() * 512;
  const w = 14 + Math.random() * 48;
  const isWarm = Math.random() > 0.58;
  wctx.fillStyle = isWarm
    ? `rgba(232, 168, 86, ${0.07 + Math.random() * 0.19})`
    : `rgba(82, 144, 240, ${0.07 + Math.random() * 0.16})`;
  wctx.fillRect(x, y, w, 1.8);
}
const waterTex = new THREE.CanvasTexture(waterCanvas);
waterTex.wrapS = THREE.RepeatWrapping;
waterTex.wrapT = THREE.RepeatWrapping;
waterTex.repeat.set(4, 4);
waterTex.colorSpace = THREE.SRGBColorSpace;

const waterMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 60),
  new THREE.MeshBasicMaterial({ map: waterTex, fog: false })
);
waterMesh.rotation.x = -Math.PI / 2;
waterMesh.position.set(bridgeEnd.x, -8.5, railZ - 18);
scene.add(waterMesh);

const bridgeMoon = new THREE.PointLight(0x8bb4eb, 5.2, 22, 1.35);
bridgeMoon.position.set(bridgeEnd.x, 4.0, railZ + 1.8);
scene.add(bridgeMoon);

// ---------------------------------------------------------------------------
// 6. Soft Circular Bokeh 3D Dust Motes
// ---------------------------------------------------------------------------
const dustCount = 340;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  const t = Math.random() * 0.94;
  const p = pathCurve.getPointAt(t);
  const r = getRightVec(t);
  const lat = (Math.random() - 0.5) * (HALF_W * 1.75);
  dustPos[i * 3]     = p.x + r.x * lat;
  dustPos[i * 3 + 1] = 0.4 + Math.random() * (WALL_H - 0.8);
  dustPos[i * 3 + 2] = p.z + r.z * lat;
}
const dustGeom = new THREE.BufferGeometry();
dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustPoints = new THREE.Points(
  dustGeom,
  new THREE.PointsMaterial({
    map: softGlowTex,
    color: 0xffeacc,
    size: 0.11,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
);
scene.add(dustPoints);

// Pre-sample centerline points for fast 2D corridor boundary collision during Free-Roam!
const COLLISION_SAMPLES = 420;
const pathSamples = [];
for (let i = 0; i <= COLLISION_SAMPLES; i++) {
  const t = i / COLLISION_SAMPLES;
  const pt = pathCurve.getPointAt(t);
  const right = getRightVec(t);
  pathSamples.push({ t, x: pt.x, z: pt.z, rx: right.x, rz: right.z });
}

function clampToCorridor(pos) {
  let best = pathSamples[0];
  let bestDistSq = Infinity;
  for (let i = 0; i < pathSamples.length; i++) {
    const s = pathSamples[i];
    const dx = pos.x - s.x;
    const dz = pos.z - s.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = s;
    }
  }
  // Keep visitor cleanly inside the wide 10.2m gallery walls (0.85m clearance)
  const dx = pos.x - best.x;
  const dz = pos.z - best.z;
  const lateral = dx * best.rx + dz * best.rz;
  const maxLat = HALF_W - 0.85;
  if (Math.abs(lateral) > maxLat) {
    const excess = lateral - Math.sign(lateral) * maxLat;
    pos.x -= best.rx * excess;
    pos.z -= best.rz * excess;
  }
  // Clamp behind entrance & safely in front of the Bridge iron railing
  if (pos.z > 2.2) pos.z = 2.2;
  if (pos.z < railZ + 0.72) pos.z = railZ + 0.72;
  return best.t;
}

// ---------------------------------------------------------------------------
// 7. Auto-Tour + TRUE First-Person Free-Roam (WASD Strafe + 360° Mouse Look)
// ---------------------------------------------------------------------------
let hasStarted = captureMode;
let mode = 'tour'; // 'tour' (guided auto-walk / scroll) | 'free' (true FPS free-roam!)
let progress = 0.0;
let playing = captureMode;
let walkClock = 0;
let endHoldTimer = 0;
let currentMood = '';
const smoothLook = new THREE.Vector3(0, 2.35, -14);

// True first-person free-roam state
const freePos = new THREE.Vector3(0, 2.48, 2);
let freeYaw = 0;   // radians around Y (0 = looking down -Z)
let freePitch = 0; // radians up/down
const keysHeld = { forward: false, backward: false, left: false, right: false };
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

if (captureMode) {
  titleCard.classList.add('dismissed');
  hud.classList.add('hidden-rec');
}

function enterFreeRoam() {
  if (mode === 'free') return;
  mode = 'free';
  playing = false;
  btnPlay.textContent = 'Auto-Walk';
  btnPlay.classList.remove('active');

  // Seamless handoff from exact current camera position & orientation (zero snap!)
  freePos.copy(camera.position);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  freeYaw = Math.atan2(-dir.x, -dir.z);
  freePitch = Math.asin(Math.max(-0.95, Math.min(0.95, dir.y)));
}

function resumeTourFromCurrent() {
  mode = 'tour';
  progress = clampToCorridor(camera.position.clone());
  if (progress >= 0.995) {
    progress = 0;
    walkClock = 0;
  }
  playing = true;
  endHoldTimer = 0;
  btnPlay.textContent = 'Pause';
  btnPlay.classList.add('active');
}

function getWalkSpeed(t) {
  let slow = 1.0;
  for (const ex of exhibitMeta) {
    // Graceful museum pause squarely opposite each 6.4m flat canvas
    const d = Math.abs(t - ex.t);
    if (d < 0.032) {
      slow = Math.min(slow, 0.25 + (d / 0.032) * 0.75);
    }
  }
  if (t > 0.93) {
    slow *= Math.max(0.26, 1 - ((t - 0.93) / 0.07) * 0.74);
  }
  return 0.034 * slow;
}

function computeCameraState(t, stridePhase) {
  const p = pathCurve.getPointAt(t);
  const right = getRightVec(t);

  let lateralBias = 0;
  let activeLabel = t < 0.04 ? 'ENTRANCE' : 'GALLERY';
  let activeMood = 'docks';

  const aheadT = Math.min(1.0, t + 0.048);
  const aheadP = pathCurve.getPointAt(aheadT);
  const targetLook = new THREE.Vector3(aheadP.x, 2.45, aheadP.z);

  for (const ex of exhibitMeta) {
    const delta = ex.t - t;
    if (delta > -0.034 && delta < 0.042) {
      const norm = 1 - Math.abs(delta - 0.002) / 0.039;
      const w = Math.max(0, Math.min(1, norm));
      const smoothW = w * w * (3 - 2 * w);

      // Stand ~7.9m back across the 10.2m-wide grand gallery so the 6.4m flat canvas fills the frame cleanly!
      lateralBias += -ex.side * 2.9 * smoothW;
      targetLook.lerp(ex.worldFocus, smoothW * 0.99);

      ex.artMat.emissiveIntensity = 0.56 + smoothW * 0.34;
      ex.halo.material.opacity = 0.26 + smoothW * 0.24;

      if (smoothW > 0.22) {
        activeLabel = ex.label;
        activeMood = ex.mood;
      }
    } else {
      ex.artMat.emissiveIntensity = 0.56;
      ex.halo.material.opacity = 0.26;
    }
  }

  const strideDamp = (!hasStarted || t > 0.94) ? Math.max(0, 1 - Math.max(0, t - 0.94) / 0.055) * (hasStarted ? 1 : 0) : 1.0;
  const bobY = Math.sin(stridePhase * 2.0) * 0.024 * strideDamp;
  const swayX = Math.cos(stridePhase) * 0.028 * strideDamp;

  const camPos = new THREE.Vector3(
    p.x + right.x * (swayX + lateralBias),
    2.48 + bobY,
    p.z + right.z * (swayX + lateralBias)
  );

  if (t > 0.915) {
    const bt = Math.min(1, (t - 0.915) / 0.085);
    const ease = bt * bt * (3 - 2 * bt);
    const lookY = bt < 0.52
      ? 2.65
      : 2.65 - ((bt - 0.52) / 0.48) * 3.85;
    const bridgeTarget = new THREE.Vector3(bridgeEnd.x, lookY, railZ - 20);
    targetLook.lerp(bridgeTarget, ease);
    activeLabel = 'THE BRIDGE';
    activeMood = 'bridge';
  }

  return { camPos, targetLook, activeLabel, activeMood };
}

function beginWalk() {
  if (hasStarted) return;
  hasStarted = true;
  mode = 'tour';
  playing = true;
  titleCard.classList.add('dismissed');
  hud.classList.remove('hidden-init');
  btnPlay.textContent = 'Pause';
  btnPlay.classList.add('active');
  const on = sound.enable();
  btnSound.textContent = on ? 'Sound: On' : 'Sound';
  btnSound.classList.toggle('active', on);
  sound.setMood('docks');
}

function startRecording() {
  if (isRecording) return;
  if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
    alert('Video recording is not supported in this browser.');
    return;
  }

  const stream = canvas.captureStream(60);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'a-walk-down-memory-lane-2014.webm';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    isRecording = false;
    hud.classList.remove('hidden-rec');
    btnRecord.textContent = '● Record';
    btnRecord.classList.remove('rec-live');
  };

  hasStarted = true;
  mode = 'tour';
  titleCard.classList.add('dismissed');
  progress = 0;
  walkClock = 0;
  endHoldTimer = 0;
  playing = true;
  isRecording = true;
  hud.classList.add('hidden-rec');
  btnRecord.textContent = '■ Recording';
  btnRecord.classList.add('rec-live');
  bridgeMark.classList.remove('visible');

  mediaRecorder.start();
}

// Expose deterministic frame render hook for clean headless MP4/GIF rendering
window.__renderFrameAt = (tVal, strideVal = 0) => {
  hasStarted = true;
  mode = 'tour';
  playing = false;
  progress = Math.max(0, Math.min(1, tVal));
  const st = computeCameraState(progress, strideVal);
  camera.position.copy(st.camPos);
  smoothLook.copy(st.targetLook);
  camera.lookAt(smoothLook);
  visitorLight.position.set(st.camPos.x, st.camPos.y + 0.8, st.camPos.z);
  scene.fog.density = progress > 0.90
    ? 0.0175 - ((progress - 0.90) / 0.10) * 0.011
    : 0.0175;
  bridgeMark.classList.toggle('visible', progress >= 0.99);
  renderer.render(scene, camera);
};

// ---------------------------------------------------------------------------
// 8. Animation Loop (Seamless Auto-Tour + True 360° Free-Roam)
// ---------------------------------------------------------------------------
let lastTs = 0;
function animate(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;

  waterTex.offset.x += dt * 0.012;
  waterTex.offset.y += dt * 0.008;

  const dp = dustGeom.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    dp[i * 3 + 1] += dt * 0.035;
    if (dp[i * 3 + 1] > WALL_H - 0.4) dp[i * 3 + 1] = 0.4;
  }
  dustGeom.attributes.position.needsUpdate = true;

  let activeLabel = 'ENTRANCE';
  let activeMood = 'docks';

  if (hasStarted && mode === 'free') {
    // True first-person 360° WASD movement along whatever direction you're facing!
    const moveFwd = (keysHeld.forward ? 1 : 0) - (keysHeld.backward ? 1 : 0);
    const moveRight = (keysHeld.right ? 1 : 0) - (keysHeld.left ? 1 : 0);
    const moveSpeed = 7.4; // natural museum walking pace in meters/sec

    if (moveFwd !== 0 || moveRight !== 0) {
      const fwdX = -Math.sin(freeYaw);
      const fwdZ = -Math.cos(freeYaw);
      const rgtX = Math.cos(freeYaw);
      const rgtZ = -Math.sin(freeYaw);

      let vx = fwdX * moveFwd + rgtX * moveRight;
      let vz = fwdZ * moveFwd + rgtZ * moveRight;
      const len = Math.hypot(vx, vz) || 1;
      vx /= len;
      vz /= len;

      freePos.x += vx * moveSpeed * dt;
      freePos.z += vz * moveSpeed * dt;
      walkClock += dt * 5.6;
    }

    progress = clampToCorridor(freePos);
    const isMoving = moveFwd !== 0 || moveRight !== 0;
    const bob = isMoving ? Math.sin(walkClock * 2.0) * 0.032 : 0;
    camera.position.set(freePos.x, 2.48 + bob, freePos.z);

    // Full 360° yaw + pitch first-person look
    const lookDir = new THREE.Vector3(
      -Math.sin(freeYaw) * Math.cos(freePitch),
      Math.sin(freePitch),
      -Math.cos(freeYaw) * Math.cos(freePitch)
    );
    smoothLook.copy(camera.position).add(lookDir.multiplyScalar(10));
    camera.lookAt(smoothLook);

    // Highlight nearest exhibit dynamically as you walk around freely
    activeLabel = progress > 0.91 ? 'THE BRIDGE' : 'FREE ROAM';
    activeMood = progress > 0.91 ? 'bridge' : 'docks';
    for (const ex of exhibitMeta) {
      const dist = camera.position.distanceTo(ex.worldFocus);
      const near = Math.max(0, 1 - dist / 14);
      ex.artMat.emissiveIntensity = 0.56 + near * 0.34;
      ex.halo.material.opacity = 0.26 + near * 0.24;
      if (dist < 10.5) {
        activeLabel = ex.label;
        activeMood = ex.mood;
      }
    }
  } else {
    // Guided Cinema Auto-Tour (default)
    if (hasStarted && playing) {
      if (progress < 1.0) {
        const spd = getWalkSpeed(progress);
        progress = Math.min(1.0, progress + dt * spd);
        walkClock += dt * (spd / 0.034) * 4.4;
        endHoldTimer = 0;
      } else {
        endHoldTimer += dt;
        if (isRecording && endHoldTimer >= 3.2 && mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }
    }

    const st = computeCameraState(progress, walkClock);
    camera.position.copy(st.camPos);
    smoothLook.lerp(st.targetLook, Math.min(1, dt * 4.5));
    camera.lookAt(smoothLook);
    activeLabel = st.activeLabel;
    activeMood = st.activeMood;
  }

  visitorLight.position.set(camera.position.x, camera.position.y + 0.8, camera.position.z);

  scene.fog.density = progress > 0.90
    ? 0.0175 - ((progress - 0.90) / 0.10) * 0.011
    : 0.0175;

  if (activeMood !== currentMood) {
    currentMood = activeMood;
    sound.setMood(activeMood);
  }
  hudRoom.textContent = activeLabel;
  scrub.value = Math.round(progress * 1000);
  bridgeMark.classList.toggle('visible', hasStarted && progress >= 0.985);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ---------------------------------------------------------------------------
// 9. Controls (Auto-Tour + Free-Roam WASD / Arrows + 360° Drag Look + Scroll)
// ---------------------------------------------------------------------------
btnBegin.addEventListener('click', beginWalk);

btnPlay.addEventListener('click', () => {
  if (!hasStarted) { beginWalk(); return; }
  if (mode === 'free') {
    resumeTourFromCurrent();
    return;
  }
  if (progress >= 0.999) {
    progress = 0;
    walkClock = 0;
    endHoldTimer = 0;
  }
  playing = !playing;
  btnPlay.textContent = playing ? 'Pause' : 'Auto-Walk';
  btnPlay.classList.toggle('active', playing);
});

btnReplay.addEventListener('click', () => {
  hasStarted = true;
  mode = 'tour';
  titleCard.classList.add('dismissed');
  hud.classList.remove('hidden-init');
  progress = 0;
  walkClock = 0;
  endHoldTimer = 0;
  playing = true;
  btnPlay.textContent = 'Pause';
  btnPlay.classList.add('active');
});

scrub.addEventListener('input', () => {
  if (!hasStarted) beginWalk();
  mode = 'tour';
  progress = Number(scrub.value) / 1000;
  playing = false;
  btnPlay.textContent = 'Auto-Walk';
  btnPlay.classList.remove('active');
  const st = computeCameraState(progress, walkClock);
  smoothLook.copy(st.targetLook);
});

btnSound.addEventListener('click', () => {
  const on = sound.toggle();
  btnSound.textContent = on ? 'Sound: On' : 'Sound';
  btnSound.classList.toggle('active', on);
  if (on) sound.setMood(currentMood || 'docks');
});

btnRecord.addEventListener('click', startRecording);

window.addEventListener('wheel', (e) => {
  if (!hasStarted) return;
  e.preventDefault();
  mode = 'tour';
  playing = false;
  btnPlay.textContent = 'Auto-Walk';
  btnPlay.classList.remove('active');
  progress = Math.max(0, Math.min(1, progress + e.deltaY * 0.00032));
  walkClock += Math.abs(e.deltaY) * 0.012;
}, { passive: false });

let touchX = null;
let touchY = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }
}, { passive: true });
window.addEventListener('touchmove', (e) => {
  if (!hasStarted || touchY === null) return;
  const dx = e.touches[0].clientX - touchX;
  const dy = touchY - e.touches[0].clientY;
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
  // Horizontal swipe rotates gaze freely; vertical swipe walks forward/back
  if (Math.abs(dx) > Math.abs(dy) * 1.2) {
    enterFreeRoam();
    freeYaw += dx * 0.0045;
  } else {
    mode = 'tour';
    playing = false;
    btnPlay.textContent = 'Auto-Walk';
    btnPlay.classList.remove('active');
    progress = Math.max(0, Math.min(1, progress + dy * 0.0011));
    walkClock += Math.abs(dy) * 0.03;
  }
}, { passive: true });

window.addEventListener('pointerdown', (e) => {
  if (!hasStarted || e.target !== canvas) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  canvas.style.cursor = 'grabbing';
});

window.addEventListener('pointerup', () => {
  isDragging = false;
  canvas.style.cursor = 'grab';
});

window.addEventListener('pointermove', (e) => {
  if (!hasStarted || !isDragging) return;
  enterFreeRoam();
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  freeYaw += dx * 0.0042;
  freePitch = Math.max(-0.85, Math.min(0.65, freePitch + dy * 0.0032));
});

window.addEventListener('keydown', (e) => {
  if (!hasStarted) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      beginWalk();
    }
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    btnPlay.click();
  } else if (e.key === 'r' || e.key === 'R') {
    btnReplay.click();
  } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    enterFreeRoam();
    keysHeld.forward = true;
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    enterFreeRoam();
    keysHeld.backward = true;
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    enterFreeRoam();
    keysHeld.left = true;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    enterFreeRoam();
    keysHeld.right = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysHeld.forward = false;
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysHeld.backward = false;
  else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysHeld.left = false;
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysHeld.right = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

canvas.style.cursor = 'grab';
const initState = computeCameraState(0, 0);
camera.position.copy(initState.camPos);
smoothLook.copy(initState.targetLook);
camera.lookAt(smoothLook);

if (!captureMode) {
  requestAnimationFrame(animate);
}
