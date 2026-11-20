import * as THREE from './vendor/three.module.js';
import { MemorySound } from './sound.js';

const canvas = document.getElementById('viewport');
const curtainFade = document.getElementById('curtain-fade');
const bridgeMark = document.getElementById('bridge-mark');
const hud = document.getElementById('hud');
const btnPlay = document.getElementById('btn-play');
const btnReplay = document.getElementById('btn-replay');
const btnSound = document.getElementById('btn-sound');
const btnRecord = document.getElementById('btn-record');
const scrub = document.getElementById('scrub');
const hudRoom = document.getElementById('hud-room');

const sound = new MemorySound();

// ---------------------------------------------------------------------------
// 1. Renderer, Scene & Architectural Darkroom Museum Lighting
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
scene.fog = new THREE.FogExp2(0x09090d, 0.025);

const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 160);

scene.add(new THREE.HemisphereLight(0x474a5e, 0x261d16, 1.35));
scene.add(new THREE.AmbientLight(0x282522, 0.65));

const visitorLight = new THREE.PointLight(0xffdfb0, 2.1, 16, 1.6);
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
  tex.repeat.set(3, 44);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#191920');
  g.addColorStop(0.55, '#25242c');
  g.addColorStop(1, '#2b2624');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 26 + Math.floor(Math.random() * 20);
    ctx.fillStyle = `rgba(${v + 4}, ${v + 2}, ${v + 8}, 0.25)`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = 'rgba(8, 8, 12, 0.5)';
  for (let x = 0; x < 512; x += 128) {
    ctx.fillRect(x, 0, 2, 512);
  }
  ctx.fillStyle = 'rgba(255, 238, 210, 0.06)';
  ctx.fillRect(0, 488, 512, 3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 24, 512, 4);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(32, 1);
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
// 3. Gently Winding S-Curve Museum Corridor (Smooth bends, ending at the Bridge)
// ---------------------------------------------------------------------------
const controlPoints = [
  new THREE.Vector3(0.0,   0,   2.0),    // Entrance
  new THREE.Vector3(2.4,   0, -10.5),    // Gentle bend right -> Room I on LEFT wall
  new THREE.Vector3(-2.5,  0, -23.5),    // Gentle bend left  -> Room II on RIGHT wall
  new THREE.Vector3(2.6,   0, -36.5),    // Room III on LEFT wall
  new THREE.Vector3(-2.6,  0, -49.5),    // Room IV on RIGHT wall
  new THREE.Vector3(2.5,   0, -62.5),    // Room V on LEFT wall
  new THREE.Vector3(-2.4,  0, -75.5),    // Room VI on RIGHT wall
  new THREE.Vector3(2.2,   0, -88.5),    // Room VII on LEFT wall
  new THREE.Vector3(-1.9,  0, -101.0),   // Room VIII on RIGHT wall
  new THREE.Vector3(0.0,   0, -113.0),   // Museum exit archway opening to night sky
  new THREE.Vector3(0.0,   0, -122.0)    // Bridge overlook railing
];

const pathCurve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
const TOTAL_LEN = pathCurve.getLength();

function getRightVec(t) {
  const tan = pathCurve.getTangentAt(Math.max(0, Math.min(1, t))).normalize();
  return new THREE.Vector3(-tan.z, 0, tan.x).normalize();
}

const CORRIDOR_END_T = 0.905;
const HALF_W = 3.65;
const WALL_H = 4.85;
const SEGMENTS = 260;

function buildRibbon(sideFn, yBottom, yTop, tMin = 0, tMax = CORRIDOR_END_T, segs = SEGMENTS) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const t = tMin + u * (tMax - tMin);
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
  roughness: 0.42,
  metalness: 0.08
});

const wallMat = new THREE.MeshStandardMaterial({
  map: makeWallTexture(),
  roughness: 0.82,
  metalness: 0.05,
  side: THREE.DoubleSide
});

const ceilingMat = new THREE.MeshStandardMaterial({
  color: 0x101015,
  roughness: 0.92,
  side: THREE.DoubleSide
});

// Museum hardwood floor
scene.add(new THREE.Mesh(
  buildRibbon((p, r) => ({
    x1: p.x - r.x * HALF_W, z1: p.z - r.z * HALF_W,
    x2: p.x + r.x * HALF_W, z2: p.z + r.z * HALF_W
  }), 0, 0),
  floorMat
));

// Left & Right curving museum walls
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

// Ceiling
scene.add(new THREE.Mesh(
  buildRibbon((p, r) => ({
    x1: p.x - r.x * HALF_W, z1: p.z - r.z * HALF_W,
    x2: p.x + r.x * HALF_W, z2: p.z + r.z * HALF_W
  }), WALL_H, WALL_H),
  ceilingMat
));

// Warm architectural baseboard cove-lighting strips tracing both curved walls
const coveMat = new THREE.MeshBasicMaterial({
  color: 0xe3a85c,
  transparent: true,
  opacity: 0.42
});
[-1, 1].forEach((side) => {
  scene.add(new THREE.Mesh(
    buildRibbon((p, r) => ({
      x1: p.x + r.x * side * (HALF_W - 0.04), z1: p.z + r.z * side * (HALF_W - 0.04),
      x2: p.x + r.x * side * (HALF_W - 0.04), z2: p.z + r.z * side * (HALF_W - 0.04)
    }), 0.04, 0.095),
    coveMat
  ));
});

// Exposed museum ceiling rafters & dim aisle lights
const ribMat = new THREE.MeshStandardMaterial({ color: 0x1d1d24, roughness: 0.65, metalness: 0.35 });
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe0b2 });

for (let i = 1; i <= 24; i++) {
  const t = (i / 25) * CORRIDOR_END_T;
  const p = pathCurve.getPointAt(t);
  const tan = pathCurve.getTangentAt(t);
  const angle = Math.atan2(tan.x, tan.z);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(HALF_W * 2 + 0.1, 0.14, 0.16), ribMat);
  beam.position.set(p.x, WALL_H - 0.14, p.z);
  beam.rotation.y = angle;
  scene.add(beam);

  if (i % 2 === 1) {
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 10), bulbMat);
    fixture.position.set(p.x, WALL_H - 0.22, p.z);
    scene.add(fixture);
  }
}

// ---------------------------------------------------------------------------
// 4. The 8 Monumental FLUSH-CURVED Museum Murals Hugging the Winding Walls
//    (Zero edges jutting into the corridor — curved seamlessly along pathCurve!)
// ---------------------------------------------------------------------------
const EXHIBITS = [
  { t: 0.095, side: -1, roman: 'I',    label: 'ROOM I',    mood: 'docks',    img: './assets/scene_01.jpg', lightColor: 0x8db8ff },
  { t: 0.200, side:  1, roman: 'II',   label: 'ROOM II',   mood: 'warm',     img: './assets/scene_02.jpg', lightColor: 0xffd599 },
  { t: 0.305, side: -1, roman: 'III',  label: 'ROOM III',  mood: 'warm',     img: './assets/scene_03.jpg', lightColor: 0x9ce8dc },
  { t: 0.415, side:  1, roman: 'IV',   label: 'ROOM IV',   mood: 'tension',  img: './assets/scene_04.jpg', lightColor: 0xffdca8 },
  { t: 0.525, side: -1, roman: 'V',    label: 'ROOM V',    mood: 'crimson',  img: './assets/scene_05.jpg', lightColor: 0xff7e75 },
  { t: 0.635, side:  1, roman: 'VI',   label: 'ROOM VI',   mood: 'cell',     img: './assets/scene_06.jpg', lightColor: 0xd0e2f7 },
  { t: 0.745, side: -1, roman: 'VII',  label: 'ROOM VII',  mood: 'tension',  img: './assets/scene_07.jpg', lightColor: 0xffcf88 },
  { t: 0.848, side:  1, roman: 'VIII', label: 'ROOM VIII', mood: 'epilogue', img: './assets/scene_08.jpg', lightColor: 0xe3ecfa }
];

// Build a curved vertical surface hugging the exact wall curve at distance `wallOffset` from centerline
// Ensures left-to-right UV reads naturally from the viewer standing inside the corridor!
function buildWallCurvedPanel(tCenter, widthMeters, yBottom, yTop, side, wallOffset, flipU = false, segs = 24) {
  const halfSpanT = (widthMeters / 2) / TOTAL_LEN;
  const tStart = Math.max(0.002, tCenter - halfSpanT);
  const tEnd = Math.min(CORRIDOR_END_T - 0.002, tCenter + halfSpanT);

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segs; i++) {
    const frac = i / segs;
    // Left wall (-1): looking at wall from corridor, left edge is smaller t (behind) and right edge is larger t (ahead) -> u = frac
    // Right wall (+1): looking at wall from corridor, left edge is larger t (ahead) and right edge is smaller t (behind) -> u = 1 - frac
    const t = tStart + frac * (tEnd - tStart);
    const p = pathCurve.getPointAt(t);
    const r = getRightVec(t);
    const px = p.x + r.x * side * wallOffset;
    const pz = p.z + r.z * side * wallOffset;
    const u = (side === -1 ? frac : 1 - frac);
    const finalU = flipU ? 1 - u : u;

    positions.push(px, yBottom, pz);
    uvs.push(finalU, 0);
    positions.push(px, yTop, pz);
    uvs.push(finalU, 1);

    if (i < segs) {
      const b = i * 2;
      if (side === -1) {
        indices.push(b, b + 2, b + 1);
        indices.push(b + 1, b + 2, b + 3);
      } else {
        indices.push(b, b + 1, b + 2);
        indices.push(b + 1, b + 3, b + 2);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

const texLoader = new THREE.TextureLoader();
const frameDarkMat = new THREE.MeshStandardMaterial({ color: 0x13100e, roughness: 0.48, metalness: 0.2, side: THREE.DoubleSide });
const brassMat = new THREE.MeshStandardMaterial({ color: 0xd2a866, roughness: 0.3, metalness: 0.82, side: THREE.DoubleSide });
const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6 });
const softGlowTex = makeSoftDotTexture();

const exhibitMeta = [];

EXHIBITS.forEach((ex) => {
  const W = 4.75;
  const H = W * (9 / 16); // ~2.67m tall!
  const yCenter = 2.02;
  const yBot = yCenter - H / 2; // 0.68m off floor (clear above baseboard cove strip!)
  const yTop = yCenter + H / 2; // 3.36m (generous headroom below 4.85m ceiling!)

  // 1) Flush curved dark museum surround backing hugging the corridor wall
  const backingMesh = new THREE.Mesh(
    buildWallCurvedPanel(ex.t, W + 0.34, yBot - 0.17, yTop + 0.17, ex.side, HALF_W - 0.05),
    frameDarkMat
  );
  scene.add(backingMesh);

  // 2) Flush curved brass inner frame trim
  const trimMesh = new THREE.Mesh(
    buildWallCurvedPanel(ex.t, W + 0.09, yBot - 0.045, yTop + 0.045, ex.side, HALF_W - 0.085),
    brassMat
  );
  scene.add(trimMesh);

  // 3) Monumental flush-curved Edward Hopper oil painting
  const map = texLoader.load(ex.img);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const artMat = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.72,
    metalness: 0.02,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: map,
    emissiveIntensity: 0.56,
    side: THREE.DoubleSide
  });
  const artMesh = new THREE.Mesh(
    buildWallCurvedPanel(ex.t, W, yBot, yTop, ex.side, HALF_W - 0.115),
    artMat
  );
  scene.add(artMesh);

  // 4) Brass overhead gallery picture-light & soft glow mounted cleanly above the center of the canvas
  const p = pathCurve.getPointAt(ex.t);
  const right = getRightVec(ex.t);
  const inward = new THREE.Vector3(-right.x * ex.side, 0, -right.z * ex.side).normalize();
  const wallCenter = new THREE.Vector3(
    p.x + right.x * ex.side * (HALF_W - 0.12),
    yCenter,
    p.z + right.z * ex.side * (HALF_W - 0.12)
  );

  const lampGroup = new THREE.Group();
  lampGroup.position.set(wallCenter.x, yTop + 0.34, wallCenter.z);
  lampGroup.lookAt(wallCenter.x + inward.x, yTop + 0.34, wallCenter.z + inward.z);

  const lampBar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.55, 12), brassMat);
  lampBar.rotation.z = Math.PI / 2;
  lampBar.position.set(0, 0, 0.36);
  lampGroup.add(lampBar);

  const bulbStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.032), lampBulbMat);
  bulbStrip.rotation.x = Math.PI / 2;
  bulbStrip.position.set(0, -0.025, 0.36);
  lampGroup.add(bulbStrip);

  [-0.5, 0.5].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.38, 8), brassMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(ax, 0, 0.17);
    lampGroup.add(arm);
  });

  // Soft circular halo sprite (no hard cone edges!)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softGlowTex,
    color: ex.lightColor,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  halo.scale.set(2.9, 1.1, 1);
  halo.position.set(0, -0.04, 0.3);
  lampGroup.add(halo);

  // Real 3D gallery PointLight casting soft colored warmth onto the walnut floor & plaster wall
  const pLight = new THREE.PointLight(ex.lightColor, 5.8, 16, 1.55);
  pLight.position.set(0, -0.1, 1.85);
  lampGroup.add(pLight);

  scene.add(lampGroup);

  // Flush Roman numeral plaque mounted right beside the frame along the wall curve
  const plaqueT = ex.t - ex.side * ((W / 2 + 0.42) / TOTAL_LEN);
  const plaqueMesh = new THREE.Mesh(
    buildWallCurvedPanel(plaqueT, 0.28, yCenter - 0.65, yCenter - 0.48, ex.side, HALF_W - 0.09, false, 4),
    new THREE.MeshBasicMaterial({ map: makePlaqueTexture(ex.roman), side: THREE.DoubleSide })
  );
  scene.add(plaqueMesh);

  const worldFocus = wallCenter.clone().add(inward.clone().multiplyScalar(0.05));
  exhibitMeta.push({ ...ex, worldFocus, artMat, pLight, halo });
});

// ---------------------------------------------------------------------------
// 5. The Finale — Stepping Out of the Archway Onto THE BRIDGE at Night
// ---------------------------------------------------------------------------
const archPos = pathCurve.getPointAt(CORRIDOR_END_T);
const bridgeEnd = pathCurve.getPointAt(1.0);
const railZ = bridgeEnd.z - 1.35;

const deckLen = Math.abs(railZ - archPos.z) + 1.4;
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
deckTex.repeat.set(2, 4);
deckTex.colorSpace = THREE.SRGBColorSpace;

const bridgeDeck = new THREE.Mesh(
  new THREE.PlaneGeometry(HALF_W * 2.1, deckLen),
  new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.72, metalness: 0.15 })
);
bridgeDeck.rotation.x = -Math.PI / 2;
bridgeDeck.position.set(bridgeEnd.x, 0.005, (archPos.z + railZ) / 2);
scene.add(bridgeDeck);

const archMat = new THREE.MeshStandardMaterial({ color: 0x16161c, roughness: 0.78 });
[-HALF_W, HALF_W].forEach((ox) => {
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, WALL_H + 0.4, 0.65), archMat);
  pillar.position.set(archPos.x + ox, (WALL_H + 0.4) / 2, archPos.z);
  scene.add(pillar);
});
const lintel = new THREE.Mesh(new THREE.BoxGeometry(HALF_W * 2 + 0.9, 0.55, 0.65), archMat);
lintel.position.set(archPos.x, WALL_H + 0.1, archPos.z);
scene.add(lintel);

const ironMat = new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.36, metalness: 0.75 });
const railW = HALF_W * 2.1;

const topRail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.075, 0.11), ironMat);
topRail.position.set(bridgeEnd.x, 1.06, railZ);
scene.add(topRail);

const midRail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.04, 0.06), ironMat);
midRail.position.set(bridgeEnd.x, 0.54, railZ);
scene.add(midRail);

for (let i = -10; i <= 10; i++) {
  const x = bridgeEnd.x + (i / 10) * (railW / 2);
  const isEnd = Math.abs(i) === 10;
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(isEnd ? 0.16 : 0.042, isEnd ? 1.22 : 1.06, isEnd ? 0.16 : 0.042),
    ironMat
  );
  post.position.set(x, (isEnd ? 1.22 : 1.06) / 2, railZ);
  scene.add(post);
}

[-HALF_W, HALF_W].forEach((sx) => {
  const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, Math.abs(railZ - archPos.z)), ironMat);
  sideRail.position.set(bridgeEnd.x + sx, 1.06, (archPos.z + railZ) / 2);
  scene.add(sideRail);
});

const bridgeTex = texLoader.load('./assets/scene_09.jpg');
bridgeTex.colorSpace = THREE.SRGBColorSpace;
const bridgePanel = new THREE.Mesh(
  new THREE.PlaneGeometry(36, 20.25),
  new THREE.MeshBasicMaterial({ map: bridgeTex, fog: false })
);
bridgePanel.position.set(bridgeEnd.x, 2.3, railZ - 16.5);
scene.add(bridgePanel);

const waterCanvas = document.createElement('canvas');
waterCanvas.width = 512;
waterCanvas.height = 512;
const wctx = waterCanvas.getContext('2d');
wctx.fillStyle = '#050912';
wctx.fillRect(0, 0, 512, 512);
for (let i = 0; i < 800; i++) {
  const x = Math.random() * 512;
  const y = Math.random() * 512;
  const w = 12 + Math.random() * 44;
  const isWarm = Math.random() > 0.58;
  wctx.fillStyle = isWarm
    ? `rgba(232, 168, 86, ${0.07 + Math.random() * 0.19})`
    : `rgba(82, 144, 240, ${0.07 + Math.random() * 0.16})`;
  wctx.fillRect(x, y, w, 1.8);
}
const waterTex = new THREE.CanvasTexture(waterCanvas);
waterTex.wrapS = THREE.RepeatWrapping;
waterTex.wrapT = THREE.RepeatWrapping;
waterTex.repeat.set(3, 3);
waterTex.colorSpace = THREE.SRGBColorSpace;

const waterMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 40),
  new THREE.MeshBasicMaterial({ map: waterTex, fog: false })
);
waterMesh.rotation.x = -Math.PI / 2;
waterMesh.position.set(bridgeEnd.x, -6.5, railZ - 12);
scene.add(waterMesh);

const bridgeMoon = new THREE.PointLight(0x8bb4eb, 4.5, 16, 1.4);
bridgeMoon.position.set(bridgeEnd.x, 3.0, railZ + 1.2);
scene.add(bridgeMoon);

// ---------------------------------------------------------------------------
// 6. Soft Circular Bokeh 3D Dust Motes
// ---------------------------------------------------------------------------
const dustCount = 280;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  const t = Math.random() * 0.94;
  const p = pathCurve.getPointAt(t);
  const r = getRightVec(t);
  const lat = (Math.random() - 0.5) * (HALF_W * 1.75);
  dustPos[i * 3]     = p.x + r.x * lat;
  dustPos[i * 3 + 1] = 0.3 + Math.random() * (WALL_H - 0.6);
  dustPos[i * 3 + 2] = p.z + r.z * lat;
}
const dustGeom = new THREE.BufferGeometry();
dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustPoints = new THREE.Points(
  dustGeom,
  new THREE.PointsMaterial({
    map: softGlowTex,
    color: 0xffeacc,
    size: 0.085,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
);
scene.add(dustPoints);

// ---------------------------------------------------------------------------
// 7. Square Museum Viewing Choreography + Smooth Forward/Backward Walking
// ---------------------------------------------------------------------------
let progress = 0.0;
let playing = true;
let walkClock = 0;
let endHoldTimer = 0;
let currentMood = '';
const smoothLook = new THREE.Vector3(0, 1.9, -6);

// Keyboard hold walking (W/S or Up/Down) + smooth look-left/right (A/D or Left/Right) + mouse look
const keysHeld = { forward: false, backward: false, lookLeft: false, lookRight: false };
let keyYaw = 0; // manual left/right look offset in radians
const mouseNudge = { x: 0, y: 0, tx: 0, ty: 0 };
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragYaw = 0;
let dragPitch = 0;

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function getWalkSpeed(t) {
  let slow = 1.0;
  for (const ex of exhibitMeta) {
    // Pause gracefully directly opposite the center of each flush-curved mural (t ≈ ex.t)
    const d = Math.abs(t - ex.t);
    if (d < 0.036) {
      slow = Math.min(slow, 0.24 + (d / 0.036) * 0.76);
    }
  }
  if (t > 0.92) {
    slow *= Math.max(0.26, 1 - ((t - 0.92) / 0.08) * 0.74);
  }
  return 0.033 * slow;
}

function computeCameraState(t, stridePhase) {
  const p = pathCurve.getPointAt(t);
  const right = getRightVec(t);

  let lateralBias = 0;
  let activeLabel = t < 0.04 ? 'ENTRANCE' : 'CORRIDOR';
  let activeMood = 'docks';

  const aheadT = Math.min(1.0, t + 0.055);
  const aheadP = pathCurve.getPointAt(aheadT);
  const targetLook = new THREE.Vector3(aheadP.x, 1.92, aheadP.z);

  for (const ex of exhibitMeta) {
    // Peak viewing directly opposite the center of the mural (`delta ≈ 0`)!
    // Stepping 1.85m toward the opposite wall gives a crisp ~5.4m square gallery viewing distance!
    const delta = ex.t - t;
    if (delta > -0.038 && delta < 0.052) {
      const norm = 1 - Math.abs(delta - 0.004) / 0.046;
      const w = Math.max(0, Math.min(1, norm));
      const smoothW = w * w * (3 - 2 * w);

      lateralBias += -ex.side * 1.85 * smoothW;
      targetLook.lerp(ex.worldFocus, smoothW * 0.98);

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

  const strideDamp = t > 0.93 ? Math.max(0, 1 - (t - 0.93) / 0.065) : 1.0;
  const bobY = Math.sin(stridePhase * 2.0) * 0.022 * strideDamp;
  const swayX = Math.cos(stridePhase) * 0.026 * strideDamp;

  const camPos = new THREE.Vector3(
    p.x + right.x * (swayX + lateralBias),
    1.94 + bobY,
    p.z + right.z * (swayX + lateralBias)
  );

  if (t > 0.895) {
    const bt = Math.min(1, (t - 0.895) / 0.105);
    const ease = bt * bt * (3 - 2 * bt);
    const lookY = bt < 0.55
      ? 1.95
      : 1.95 - ((bt - 0.55) / 0.45) * 3.15;
    const bridgeTarget = new THREE.Vector3(bridgeEnd.x, lookY, railZ - 14.5);
    targetLook.lerp(bridgeTarget, ease);
    activeLabel = 'THE BRIDGE';
    activeMood = 'bridge';
  }

  // Intuitive look offset: A/D (Left/Right arrows), click-drag, or subtle mouse hover
  if (!isRecording) {
    const totalYaw = keyYaw + dragYaw + mouseNudge.x * 0.24;
    const totalPitch = dragPitch + mouseNudge.y * 0.14;
    if (Math.abs(totalYaw) > 0.001 || Math.abs(totalPitch) > 0.001) {
      const lookVec = targetLook.clone().sub(camPos);
      lookVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), -totalYaw);
      lookVec.y += totalPitch * lookVec.length() * 0.65;
      targetLook.copy(camPos).add(lookVec);
    }
  }

  return { camPos, targetLook, activeLabel, activeMood };
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
  mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'memory-palace-bridge-2014.webm';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    isRecording = false;
    hud.classList.remove('hidden-rec');
    btnRecord.textContent = '● Record';
    btnRecord.classList.remove('rec-live');
  };

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

// ---------------------------------------------------------------------------
// 8. Animation Loop
// ---------------------------------------------------------------------------
let lastTs = 0;
function animate(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;

  // Smooth keyboard forward/backward walking & A/D look-around
  if (keysHeld.lookLeft) keyYaw = Math.max(-1.05, keyYaw - dt * 1.45);
  if (keysHeld.lookRight) keyYaw = Math.min(1.05, keyYaw + dt * 1.45);

  if (keysHeld.forward || keysHeld.backward) {
    playing = false;
    btnPlay.textContent = 'Walk';
    btnPlay.classList.remove('active');
    const dir = (keysHeld.forward ? 1 : 0) - (keysHeld.backward ? 1 : 0);
    progress = Math.max(0, Math.min(1, progress + dir * dt * 0.055));
    walkClock += Math.abs(dir) * dt * 5.2;
    // Gently recenter manual look-yaw as you walk onward unless holding A/D
    if (!keysHeld.lookLeft && !keysHeld.lookRight && !isDragging) {
      keyYaw *= Math.max(0, 1 - dt * 1.8);
      dragYaw *= Math.max(0, 1 - dt * 1.8);
      dragPitch *= Math.max(0, 1 - dt * 1.8);
    }
  } else if (playing) {
    if (!keysHeld.lookLeft && !keysHeld.lookRight && !isDragging) {
      keyYaw *= Math.max(0, 1 - dt * 1.5);
      dragYaw *= Math.max(0, 1 - dt * 1.5);
      dragPitch *= Math.max(0, 1 - dt * 1.5);
    }
    if (progress < 1.0) {
      const spd = getWalkSpeed(progress);
      progress = Math.min(1.0, progress + dt * spd);
      walkClock += dt * (spd / 0.033) * 4.4;
      endHoldTimer = 0;
    } else {
      endHoldTimer += dt;
      if (isRecording && endHoldTimer >= 3.2 && mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }
  }

  mouseNudge.x += (mouseNudge.tx - mouseNudge.x) * Math.min(1, dt * 4);
  mouseNudge.y += (mouseNudge.ty - mouseNudge.y) * Math.min(1, dt * 4);

  waterTex.offset.x += dt * 0.012;
  waterTex.offset.y += dt * 0.008;

  const dp = dustGeom.attributes.position.array;
  for (let i = 0; i < dustCount; i++) {
    dp[i * 3 + 1] += dt * 0.03;
    if (dp[i * 3 + 1] > WALL_H - 0.3) dp[i * 3 + 1] = 0.3;
  }
  dustGeom.attributes.position.needsUpdate = true;

  const { camPos, targetLook, activeLabel, activeMood } = computeCameraState(progress, walkClock);
  camera.position.copy(camPos);

  smoothLook.lerp(targetLook, Math.min(1, dt * 4.8));
  camera.lookAt(smoothLook);

  visitorLight.position.set(camPos.x, camPos.y + 0.55, camPos.z);

  scene.fog.density = progress > 0.87
    ? 0.025 - ((progress - 0.87) / 0.13) * 0.015
    : 0.025;

  if (activeMood !== currentMood) {
    currentMood = activeMood;
    sound.setMood(activeMood);
  }
  hudRoom.textContent = activeLabel;
  scrub.value = Math.round(progress * 1000);
  bridgeMark.classList.toggle('visible', progress >= 0.992);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ---------------------------------------------------------------------------
// 9. Controls (Auto-Walk, Scroll, Touch Swipe, W/S / Arrow Keys, Record)
// ---------------------------------------------------------------------------
btnPlay.addEventListener('click', () => {
  if (progress >= 0.999) {
    progress = 0;
    walkClock = 0;
    endHoldTimer = 0;
  }
  playing = !playing;
  btnPlay.textContent = playing ? 'Pause' : 'Walk';
  btnPlay.classList.toggle('active', playing);
});

btnReplay.addEventListener('click', () => {
  progress = 0;
  walkClock = 0;
  endHoldTimer = 0;
  playing = true;
  btnPlay.textContent = 'Pause';
  btnPlay.classList.add('active');
});

scrub.addEventListener('input', () => {
  progress = Number(scrub.value) / 1000;
  playing = false;
  btnPlay.textContent = 'Walk';
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
  e.preventDefault();
  playing = false;
  btnPlay.textContent = 'Walk';
  btnPlay.classList.remove('active');
  progress = Math.max(0, Math.min(1, progress + e.deltaY * 0.00035));
  walkClock += Math.abs(e.deltaY) * 0.012;
}, { passive: false });

let touchY = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) touchY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchmove', (e) => {
  if (touchY === null) return;
  const dy = touchY - e.touches[0].clientY;
  touchY = e.touches[0].clientY;
  playing = false;
  btnPlay.textContent = 'Walk';
  btnPlay.classList.remove('active');
  progress = Math.max(0, Math.min(1, progress + dy * 0.0012));
  walkClock += Math.abs(dy) * 0.03;
}, { passive: true });

window.addEventListener('pointerdown', (e) => {
  if (e.target !== canvas) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

window.addEventListener('pointermove', (e) => {
  mouseNudge.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseNudge.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
  if (isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragYaw = Math.max(-1.1, Math.min(1.1, dragYaw - dx * 0.004));
    dragPitch = Math.max(-0.45, Math.min(0.45, dragPitch - dy * 0.003));
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    e.preventDefault();
    btnPlay.click();
  } else if (e.key === 'r' || e.key === 'R') {
    btnReplay.click();
  } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    keysHeld.forward = true;
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    keysHeld.backward = true;
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keysHeld.lookLeft = true;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keysHeld.lookRight = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    keysHeld.forward = false;
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    keysHeld.backward = false;
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keysHeld.lookLeft = false;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keysHeld.lookRight = false;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const initState = computeCameraState(0, 0);
camera.position.copy(initState.camPos);
smoothLook.copy(initState.targetLook);
camera.lookAt(smoothLook);

requestAnimationFrame(() => {
  setTimeout(() => curtainFade.classList.add('lifted'), 160);
});
requestAnimationFrame(animate);
