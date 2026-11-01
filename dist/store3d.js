/* LeadsGate 3D store — an illustrative concept of a LeadsGate superstore.
   Built with three.js (MIT). Loaded on demand by app.js when the section nears the viewport. */
import * as THREE from 'three';
import { OrbitControls } from './vendor/three/OrbitControls.js';

const BRAND = { navy: 0x033067, navyDeep: 0x021f45, blue: 0x006bca, blueLight: 0x5ca9f2, white: 0xffffff, gold: 0xffd27a };

export async function init(root, opts) {
  const stage = root.querySelector('#store-stage');
  const hotLayer = root.querySelector('#store-hotspots');
  const reduceMotion = !!opts.reduceMotion;
  let promo = !!opts.promo;

  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }

  /* renderer */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'store3d-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.insertBefore(renderer.domElement, hotLayer);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe3ecf6, 80, 190);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 400);

  /* helpers */
  function canvasTex(w, h, draw, repeatX = 1, repeatY = 1) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    if (repeatX !== 1 || repeatY !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeatX, repeatY); }
    return t;
  }
  const loader = new THREE.TextureLoader();
  function imgTex(src) { return new Promise((res) => loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; res(t); }, undefined, () => res(null))); }
  function mesh(geo, mat, { cast = true, receive = false } = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m; }

  function cladding(hex, w, h) {
    return canvasTex(256, 256, (g, W, H) => {
      g.fillStyle = hex; g.fillRect(0, 0, W, H);
      const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, 'rgba(255,255,255,.05)'); grad.addColorStop(1, 'rgba(0,0,0,.08)');
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 51.2) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, 0, 2, H); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 2, 0, 1, H); }
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, H / 2, W, 2);
    }, w / 6, h / 6);
  }

  /* lights */
  const hemi = new THREE.HemisphereLight(0xdbe8ff, 0xb8b1a6, 1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
  sun.position.set(34, 46, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 40, bottom: -30, near: 1, far: 140 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const doorLight = new THREE.PointLight(0xffc98a, 0, 30, 1.6); doorLight.position.set(0, 5, 6); scene.add(doorLight);

  /* ground: interlocking pavers, parking lines, grass islands */
  const paver = canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = '#c7ced6'; g.fillRect(0, 0, W, H);
    const bw = 32, bh = 16;
    for (let y = 0, r = 0; y < H; y += bh, r++) {
      for (let x = (r % 2) * bw / 2 - bw; x < W; x += bw) {
        const v = 196 + Math.floor(Math.random() * 18);
        g.fillStyle = `rgb(${v},${v + 4},${v + 10})`; g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    }
  }, 60, 60);
  const ground = mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ map: paver, roughness: 0.95 }), { cast: false, receive: true });
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const lines = new THREE.Group();
  for (const zRow of [16, 31]) {
    for (let x = -36; x <= 36; x += 3.2) { if (Math.abs(x) < 4) continue; const l = mesh(new THREE.BoxGeometry(0.14, 0.02, 5.2), lineMat, { cast: false, receive: true }); l.position.set(x, 0.011, zRow); lines.add(l); }
    const back = mesh(new THREE.BoxGeometry(72, 0.02, 0.14), lineMat, { cast: false }); back.position.set(0, 0.011, zRow - 2.6); lines.add(back);
  }
  const arrow = mesh(new THREE.BoxGeometry(0.25, 0.02, 3), lineMat, { cast: false }); arrow.position.set(0, 0.011, 24); lines.add(arrow);
  scene.add(lines);

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x4f9a4a, roughness: 1 });
  const kerbMat = new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.9 });
  function island(x, z, w, d) {
    const k = mesh(new THREE.BoxGeometry(w + 0.4, 0.22, d + 0.4), kerbMat, { receive: true }); k.position.set(x, 0.11, z);
    const gr = mesh(new THREE.BoxGeometry(w, 0.26, d), grassMat, { receive: true }); gr.position.set(x, 0.13, z);
    scene.add(k, gr);
  }
  island(-18, 23.5, 22, 2.4); island(18, 23.5, 22, 2.4); island(-30, 6, 6, 3); island(32, 6, 6, 3);

  /* building */
  const navyClad = cladding('#033067', 13, 13), blueClad = cladding('#006BCA', 22, 18), navyClad2 = cladding('#033067', 14, 15);
  const matL = new THREE.MeshStandardMaterial({ map: navyClad, roughness: 0.55, metalness: 0.2 });
  const matC = new THREE.MeshStandardMaterial({ map: blueClad, roughness: 0.5, metalness: 0.2 });
  const matR = new THREE.MeshStandardMaterial({ map: navyClad2, roughness: 0.55, metalness: 0.2 });
  const building = new THREE.Group(); scene.add(building);
  const left = mesh(new THREE.BoxGeometry(13, 13, 22), matL, { receive: true }); left.position.set(-17.5, 6.5, -11);
  const centre = mesh(new THREE.BoxGeometry(22, 18, 23), matC, { receive: true }); centre.position.set(0, 9, -10.5);
  const right = mesh(new THREE.BoxGeometry(14, 15, 22.5), matR, { receive: true }); right.position.set(18, 7.5, -10.75);
  building.add(left, centre, right);
  // plinth band
  const plinth = mesh(new THREE.BoxGeometry(50, 0.9, 0.3), new THREE.MeshStandardMaterial({ color: 0x0e1a2b, roughness: 0.7 }), { cast: false }); plinth.position.set(0.5, 0.45, 0.65); building.add(plinth);

  // pitched roof on the centre block: the LeadsGate house, in steel
  const gable = new THREE.Shape(); gable.moveTo(-11.6, 0); gable.lineTo(0, 6.2); gable.lineTo(11.6, 0); gable.lineTo(-11.6, 0);
  const roof = mesh(new THREE.ExtrudeGeometry(gable, { depth: 23.4, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: BRAND.navy, roughness: 0.45, metalness: 0.35 }));
  roof.position.set(0, 18, -22.2); building.add(roof);
  // the logo's roof stroke: a Gate Blue chevron on the gable front
  const chev = new THREE.Shape();
  chev.moveTo(-12.2, -0.2); chev.lineTo(0, 6.3); chev.lineTo(12.2, -0.2); chev.lineTo(10.6, -0.2); chev.lineTo(0, 5.3); chev.lineTo(-10.6, -0.2); chev.lineTo(-12.2, -0.2);
  const chevron = mesh(new THREE.ExtrudeGeometry(chev, { depth: 0.5, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: BRAND.blueLight, roughness: 0.4, metalness: 0.3, emissive: BRAND.blueLight, emissiveIntensity: 0 }));
  chevron.position.set(0, 18.05, 1.25); building.add(chevron);
  const chimney = mesh(new THREE.BoxGeometry(1.6, 4, 1.6), new THREE.MeshStandardMaterial({ color: BRAND.navy, roughness: 0.5 })); chimney.position.set(6.5, 22.2, -6); building.add(chimney);

  // entrance: dark frame, glass curtain wall with store interior, canopy
  const doorFrame = mesh(new THREE.BoxGeometry(17.2, 11.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x0b1626, roughness: 0.6 })); doorFrame.position.set(0, 5.6, 1.15); building.add(doorFrame);
  const glassDay = canvasTex(1024, 640, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#3b6a96'); grad.addColorStop(0.45, '#1c3653'); grad.addColorStop(1, '#0d1b2c');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.16; g.fillStyle = '#ffffff';
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(i * 180 - 120, H); g.lineTo(i * 180 - 40, H); g.lineTo(i * 180 + 120, 0); g.lineTo(i * 180 + 60, 0); g.fill(); }
    g.globalAlpha = 1;
    drawInterior(g, W, H, 0.38);
    drawMullions(g, W, H);
  });
  const glassNight = canvasTex(1024, 640, (g, W, H) => {
    g.fillStyle = '#ffe2b0'; g.fillRect(0, 0, W, H);
    drawInterior(g, W, H, 1);
    drawMullions(g, W, H);
  });
  function drawInterior(g, W, H, a) {
    g.globalAlpha = a;
    const shelfCols = ['#0a3d7a', '#006bca', '#033067'];
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 110, top = H * 0.42 + (i % 2) * 18;
      g.fillStyle = shelfCols[i % 3]; g.fillRect(x, top, 70, H - top - 30);
      g.fillStyle = 'rgba(255,255,255,.75)';
      for (let s = 0; s < 4; s++) g.fillRect(x + 4, top + 16 + s * ((H - top - 50) / 4), 62, 4);
      const goods = ['#ffd27a', '#e5f0fb', '#5ca9f2', '#ffffff', '#f2b84b'];
      for (let s = 0; s < 4; s++) for (let k = 0; k < 4; k++) { g.fillStyle = goods[(i + s + k) % 5]; g.fillRect(x + 6 + k * 15, top + 4 + s * ((H - top - 50) / 4), 11, 11); }
    }
    g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 8; i++) g.fillRect(70 + i * 120, 40, 60, 6);
    g.globalAlpha = 1;
  }
  function drawMullions(g, W, H) {
    g.fillStyle = '#0a1220';
    for (let i = 0; i <= 8; i++) g.fillRect(i * (W / 8) - 5, 0, 10, H);
    for (const r of [0, H / 3, (2 * H) / 3, H]) g.fillRect(0, r - 5, W, 10);
    g.fillRect(W * 0.375, H * 0.62, W * 0.25, 8);
  }
  const glassMat = new THREE.MeshStandardMaterial({ map: glassDay, roughness: 0.15, metalness: 0.6, emissive: 0xffffff, emissiveMap: glassNight, emissiveIntensity: 0 });
  const glass = mesh(new THREE.PlaneGeometry(15.6, 9.8), glassMat, { cast: false }); glass.position.set(0, 5.1, 1.36); building.add(glass);
  const canopy = mesh(new THREE.BoxGeometry(19, 0.45, 3), new THREE.MeshStandardMaterial({ color: BRAND.navy, roughness: 0.5 })); canopy.position.set(0, 10.95, 2.6); building.add(canopy);
  const downMat = new THREE.MeshBasicMaterial({ color: 0x334455 });
  for (let x = -8; x <= 8; x += 2) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), downMat); d.position.set(x, 10.7, 3.2); building.add(d); }

  // signage
  const [wordmark, monogram] = await Promise.all([imgTex('assets/leadsgate-wordmark-white.png'), imgTex('assets/leadsgate-monogram.png')]);
  if (wordmark) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(17.4, 3.5), new THREE.MeshBasicMaterial({ map: wordmark, transparent: true, toneMapped: false }));
    sign.position.set(0, 14.4, 1.03); building.add(sign);
  }
  const panel = mesh(new THREE.BoxGeometry(8.4, 6.6, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })); panel.position.set(18, 9.6, 0.65); building.add(panel);
  if (monogram) {
    const mono = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 4.7), new THREE.MeshBasicMaterial({ map: monogram, transparent: true, toneMapped: false }));
    mono.position.set(18, 9.7, 0.82); building.add(mono);
  }
  const stripTex = canvasTex(1024, 160, (g, W, H) => {
    g.fillStyle = '#006BCA'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffffff'; g.font = '700 54px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('KITCHEN · DINING · STORAGE', W / 2, H / 2 + 2);
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1.5), new THREE.MeshBasicMaterial({ map: stripTex, toneMapped: false })); strip.position.set(18, 4.6, 0.53); building.add(strip);

  function bannerTex(xmas) {
    return canvasTex(800, 520, (g, W, H) => {
      g.fillStyle = xmas ? '#A3122A' : '#FFD27A'; g.fillRect(0, 0, W, H);
      g.fillStyle = xmas ? '#FFD27A' : '#033067'; g.fillRect(0, H - 26, W, 26);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = xmas ? '#FFFFFF' : '#033067';
      g.font = '400 92px "DM Serif Display", Georgia, serif';
      g.fillText(xmas ? 'Afehyia pa!' : 'Home kits', W / 2, H * 0.4);
      g.font = '600 40px Montserrat, Arial, sans-serif';
      g.fillText(xmas ? 'Christmas at LeadsGate' : 'For every new home', W / 2, H * 0.66);
    });
  }
  const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex(promo), roughness: 0.6, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
  const banner = mesh(new THREE.PlaneGeometry(8, 5.2), bannerMat, { cast: false }); banner.position.set(-17.5, 7.6, 0.03); building.add(banner);

  /* lamps */
  const glowTex = canvasTex(128, 128, (g, W) => { const r = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); r.addColorStop(0, 'rgba(255,214,150,.9)'); r.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = r; g.fillRect(0, 0, W, W); });
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0xe8edf3, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f7, roughness: 0.4, metalness: 0.4 });
  const pools = [];
  function lamp(x, z) {
    const g = new THREE.Group();
    const pole = mesh(new THREE.CylinderGeometry(0.12, 0.18, 9, 10), poleMat); pole.position.y = 4.5;
    const arm = mesh(new THREE.BoxGeometry(3.2, 0.12, 0.12), poleMat); arm.position.set(0, 8.8, 0); arm.rotation.z = 0.08;
    const h1 = mesh(new THREE.BoxGeometry(1.1, 0.14, 0.5), lampHeadMat); h1.position.set(-1.5, 8.8, 0);
    const h2 = h1.clone(); h2.position.x = 1.5;
    g.add(pole, arm, h1, h2); g.position.set(x, 0, z); scene.add(g);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.03, z); scene.add(pool); pools.push(pool);
  }
  lamp(-27, 23.5); lamp(27, 23.5); lamp(-30, 6); lamp(32, 6);

  /* palms */
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 });
  const leafMats = [new THREE.MeshStandardMaterial({ color: 0x2f8f5b, roughness: 0.8, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: 0x3fa36b, roughness: 0.8, side: THREE.DoubleSide })];
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(1.9, 0.55, 3.8, 0); leafShape.quadraticCurveTo(1.9, -0.55, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 6); leafGeo.rotateX(-Math.PI / 2);
  const palms = [];
  function palm(x, z, h, lean) {
    const g = new THREE.Group();
    const trunk = mesh(new THREE.CylinderGeometry(0.17, 0.3, h, 8), trunkMat); trunk.position.y = h / 2; g.add(trunk);
    const crown = new THREE.Group(); crown.position.y = h;
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Group(); f.rotation.y = (i / 9) * Math.PI * 2 + Math.random() * 0.3;
      const leaf = mesh(leafGeo, leafMats[i % 2]); leaf.rotation.z = -(0.35 + Math.random() * 0.5); f.add(leaf); crown.add(f);
    }
    g.add(crown); g.position.set(x, 0, z); g.rotation.z = lean; scene.add(g); palms.push(crown);
  }
  palm(-27, 3.5, 7.5, 0.05); palm(-29.5, 8, 6, -0.06); palm(30, 3.5, 8, -0.05); palm(33, 9, 6.5, 0.07); palm(-11, 23.5, 5.5, 0.03); palm(11, 23.5, 5.8, -0.04);

  /* cars */
  function car(x, z, color, rot) {
    const g = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(4.3, 0.8, 1.9), new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.5 })); body.position.y = 0.7;
    const cab = mesh(new THREE.BoxGeometry(2.3, 0.72, 1.72), new THREE.MeshStandardMaterial({ color: 0x1b2b3f, roughness: 0.2, metalness: 0.6 })); cab.position.set(-0.2, 1.42, 0);
    const wm = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    for (const [wx, wz] of [[1.35, 0.95], [-1.35, 0.95], [1.35, -0.95], [-1.35, -0.95]]) { const w = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14), wm); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.38, wz); g.add(w); }
    g.add(body, cab); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  }
  car(-16, 16, 0xf4f6f8, Math.PI / 2); car(-9.6, 16, 0x033067, Math.PI / 2); car(12.8, 16, 0xb8c0c8, Math.PI / 2); car(-25.6, 31, 0xa3122a, -Math.PI / 2); car(19.2, 31, 0xf4f6f8, -Math.PI / 2);

  /* shoppers */
  const skin = [0x6b4226, 0x8d5a3b, 0x5c3a24, 0x7a4a2e];
  const tops = [0x006bca, 0xf2b84b, 0x1f7a4d, 0xe5f0fb, 0xa3122a, 0x033067];
  const bagMat = new THREE.MeshStandardMaterial({ color: BRAND.blue, roughness: 0.6 });
  const spots = [new THREE.Vector3(-20, 0, 27), new THREE.Vector3(22, 0, 26), new THREE.Vector3(-6, 0, 36), new THREE.Vector3(9, 0, 34), new THREE.Vector3(34, 0, 14), new THREE.Vector3(-34, 0, 15), new THREE.Vector3(-13, 0, 19), new THREE.Vector3(15, 0, 19)];
  const door = new THREE.Vector3(0, 0, 2.4);
  const people = [];
  for (let i = 0; i < (mobile ? 6 : 10); i++) {
    const g = new THREE.Group();
    const body = mesh(new THREE.CapsuleGeometry(0.27, 0.85, 4, 10), new THREE.MeshStandardMaterial({ color: tops[i % tops.length], roughness: 0.8 })); body.position.y = 0.98;
    const head = mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshStandardMaterial({ color: skin[i % skin.length], roughness: 0.7 })); head.position.y = 1.78;
    const bag = mesh(new THREE.BoxGeometry(0.34, 0.4, 0.14), bagMat); bag.position.set(0.36, 0.85, 0);
    g.add(body, head, bag); scene.add(g);
    const p = { g, bag, mode: i % 2 ? 'out' : 'in', t: Math.random(), speed: 1.2 + Math.random() * 0.4, delay: Math.random() * 6, a: null, b: null, phase: Math.random() * 6 };
    route(p); people.push(p);
  }
  function route(p) {
    const s = spots[Math.floor(Math.random() * spots.length)].clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 2));
    const d = door.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, 0, 0));
    if (p.mode === 'in') { p.a = s; p.b = d; } else { p.a = d; p.b = s; }
    p.len = p.a.distanceTo(p.b); p.bag.visible = p.mode === 'out';
  }

  /* Christmas: roof-line lights and a tree by the entrance */
  const xmas = new THREE.Group(); scene.add(xmas);
  const bulbPts = [];
  for (let x = -23.8; x <= -11.2; x += 0.8) bulbPts.push([x, 13.05, 0.05]);
  for (let x = 11.2; x <= 24.8; x += 0.8) bulbPts.push([x, 15.05, 0.55]);
  for (let s = 0; s <= 1.0001; s += 0.04) { bulbPts.push([-12.2 + 12.2 * s, 18 + 6.3 * s, 1.85]); bulbPts.push([12.2 - 12.2 * s, 18 + 6.3 * s, 1.85]); }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), bulbPts.length);
  const bulbCols = [new THREE.Color(0xe53950), new THREE.Color(0xffd27a), new THREE.Color(0x3fa36b), new THREE.Color(0x5ca9f2)];
  const tmpM = new THREE.Matrix4(), tmpC = new THREE.Color();
  bulbPts.forEach((p, i) => { tmpM.setPosition(p[0], p[1], p[2]); bulbs.setMatrixAt(i, tmpM); bulbs.setColorAt(i, bulbCols[i % 4]); });
  xmas.add(bulbs);
  const tree = new THREE.Group();
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x1f7a4d, roughness: 0.8 });
  [[2.4, 2.6, 1.6], [1.9, 2.2, 3], [1.3, 1.8, 4.2]].forEach(([r, h, y]) => { const c = mesh(new THREE.ConeGeometry(r, h, 18), treeMat); c.position.y = y; tree.add(c); });
  const trunk2 = mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8), trunkMat); trunk2.position.y = 0.4; tree.add(trunk2);
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.22 : 0.5, a = (i / 10) * Math.PI * 2 + Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? starShape.lineTo(x, y) : starShape.moveTo(x, y); }
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.12, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: BRAND.gold, toneMapped: false })); star.position.set(0, 5.45, 0); tree.add(star);
  const ornaments = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), 36);
  for (let i = 0; i < 36; i++) { const y = 1 + (i / 36) * 3.6, r = 2.3 * (1 - (y - 0.6) / 5) + 0.05, a = i * 2.4; tmpM.setPosition(Math.cos(a) * r, y, Math.sin(a) * r); ornaments.setMatrixAt(i, tmpM); ornaments.setColorAt(i, bulbCols[i % 4]); }
  tree.add(ornaments); tree.position.set(-10.6, 0, 5); xmas.add(tree);
  xmas.visible = promo;

  /* sizing and camera */
  const target = new THREE.Vector3(0, 8, 0);
  const home = new THREE.Vector3(5, 10, 52);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target); controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false; controls.rotateSpeed = 0.6;
  controls.minPolarAngle = 0.2 * Math.PI; controls.maxPolarAngle = 0.485 * Math.PI;
  controls.minAzimuthAngle = -1.15; controls.maxAzimuthAngle = 1.15;
  controls.minDistance = 26; controls.maxDistance = 80;
  const touch = window.matchMedia('(hover: none)').matches;
  controls.enabled = !touch;

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const a = w / h;
    camera.fov = a < 1 ? 50 : a < 1.5 ? 40 : 34;
    if (a > 1.3) camera.setViewOffset(w, h, -w * 0.13, 0, w, h); else camera.setViewOffset(w, h, 0, -h * 0.1, w, h);
    camera.updateProjectionMatrix(); needsRender = true;
  }
  let needsRender = true;
  new ResizeObserver(resize).observe(stage);

  /* hotspots (real links and buttons layered over the canvas) */
  const hotspots = [
    { pos: new THREE.Vector3(0, 1.7, 1.6), label: 'Entrance · visit us', href: '#visit' },
    { pos: new THREE.Vector3(-14.2, 5.3, 0.3), label: promo ? 'Christmas home kits' : 'Home kits', href: '#kits' },
    { pos: new THREE.Vector3(14.2, 6.8, 0.9), label: 'Kitchen', room: 'Kitchen' },
    { pos: new THREE.Vector3(13.4, 4.6, 0.9), label: 'Dining & storage', room: 'Dining' }
  ];
  hotspots.forEach((h) => {
    const el = document.createElement(h.href ? 'a' : 'button');
    el.className = 'hotspot';
    if (h.href) el.href = h.href; else { el.type = 'button'; el.dataset.room = h.room; }
    el.innerHTML = '<span class="hs-dot" aria-hidden="true"></span><span class="hs-label">' + h.label + '</span>';
    hotLayer.appendChild(el); h.el = el;
  });
  const v = new THREE.Vector3();
  function placeHotspots() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const camDir = camera.position.clone().sub(target).normalize();
    hotspots.forEach((hs) => {
      v.copy(hs.pos).project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      const facing = camDir.z > 0.25;
      const show = facing && v.z < 1 && x > 8 && x < w - 8 && y > 8 && y < h - 8;
      const flip = x > w * 0.6;
      hs.el.classList.toggle('flip', flip);
      const ox = flip ? x - (hs.w || (hs.w = hs.el.offsetWidth)) + 28 : x;
      hs.el.style.transform = 'translate(' + ox.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      hs.el.classList.toggle('is-hidden', !show);
      hs.el.tabIndex = show ? 0 : -1;
    });
  }

  /* day and night */
  let night = 0, nightTarget = 0;
  const dayFog = new THREE.Color(0xe3ecf6), nightFog = new THREE.Color(0x0c1f38);
  function applyNight(n) {
    hemi.intensity = THREE.MathUtils.lerp(1.25, 0.28, n);
    hemi.color.setHex(n > 0.5 ? 0x7f95c9 : 0xdbe8ff);
    sun.intensity = THREE.MathUtils.lerp(2.4, 0.25, n);
    sun.color.setHex(n > 0.5 ? 0x9fb4ff : 0xfff4e0);
    scene.fog.color.copy(dayFog).lerp(nightFog, n);
    glassMat.emissiveIntensity = n * 1.4;
    glassMat.map = n > 0.5 ? null : glassDay; glassMat.color.setHex(n > 0.5 ? 0x222222 : 0xffffff); glassMat.needsUpdate = true;
    lampHeadMat.emissiveIntensity = n * 3;
    chevron.material.emissiveIntensity = n * 0.9;
    bannerMat.emissiveMap = bannerMat.map; bannerMat.emissiveIntensity = n * 0.7; bannerMat.needsUpdate = true;
    doorLight.intensity = n * 60;
    pools.forEach((p) => { p.material.opacity = n * 0.85; });
    downMat.color.setHex(n > 0.5 ? 0xfff1d6 : 0x334455);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.05, 1.25, n);
    stage.classList.toggle('is-night', n > 0.5);
  }

  /* animation */
  let running = !reduceMotion, visible = true, idleUntil = 0, intro = reduceMotion ? 1 : 0;
  const spherical = new THREE.Spherical();
  const homeOffset = home.clone().sub(target); const homeSph = new THREE.Spherical().setFromVector3(homeOffset);
  const aspect0 = stage.clientWidth / Math.max(1, stage.clientHeight);
  homeSph.radius = aspect0 < 1 ? 84 : aspect0 < 1.5 ? 76 : 66;
  controls.maxDistance = homeSph.radius * 1.3;
  const introFrom = new THREE.Spherical(homeSph.radius * 1.35, homeSph.phi * 0.82, -0.9);
  let anim = null; // camera tween
  function tweenTo(sph, ms) {
    spherical.setFromVector3(camera.position.clone().sub(target));
    anim = { from: spherical.clone(), to: sph.clone(), t: 0, ms: reduceMotion ? 1 : ms };
  }
  camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(reduceMotion ? homeSph : introFrom));
  camera.lookAt(target);
  if (!reduceMotion) tweenTo(homeSph, 2600);

  controls.addEventListener('start', () => { idleUntil = performance.now() + 7000; anim = null; });
  controls.addEventListener('change', () => { needsRender = true; });

  const clock = new THREE.Clock(); let twinkleT = 0, time = 0;
  function frame() {
    if (!visible) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (running) time += dt;
    if (anim) {
      anim.t = Math.min(1, anim.t + (dt * 1000) / anim.ms);
      const e = 1 - Math.pow(1 - anim.t, 3);
      spherical.radius = THREE.MathUtils.lerp(anim.from.radius, anim.to.radius, e);
      spherical.phi = THREE.MathUtils.lerp(anim.from.phi, anim.to.phi, e);
      spherical.theta = THREE.MathUtils.lerp(anim.from.theta, anim.to.theta, e);
      camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical)); camera.lookAt(target);
      if (anim.t >= 1) { anim = null; idleUntil = performance.now() + 1500; }
      needsRender = true;
    } else if (running && performance.now() > idleUntil) {
      spherical.setFromVector3(camera.position.clone().sub(target));
      const want = homeSph.theta + Math.sin(time * 0.12) * 0.38;
      spherical.theta += (want - spherical.theta) * 0.02;
      camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical)); camera.lookAt(target);
      needsRender = true;
    }
    if (Math.abs(night - nightTarget) > 0.001) { night += (nightTarget - night) * Math.min(1, dt * 4); if (Math.abs(night - nightTarget) < 0.01) night = nightTarget; applyNight(night); needsRender = true; }
    if (running) {
      people.forEach((p) => {
        if (p.delay > 0) { p.delay -= dt; p.g.visible = false; return; }
        p.g.visible = true;
        p.t += (p.speed * dt) / p.len;
        if (p.t >= 1) { p.mode = p.mode === 'in' ? 'out' : 'in'; p.t = 0; p.delay = 1 + Math.random() * 4; route(p); return; }
        p.g.position.lerpVectors(p.a, p.b, p.t);
        p.g.position.y = Math.abs(Math.sin((time + p.phase) * 7)) * 0.07;
        p.g.rotation.y = Math.atan2(p.b.x - p.a.x, p.b.z - p.a.z);
      });
      palms.forEach((c, i) => { c.rotation.z = Math.sin(time * 0.9 + i) * 0.03; });
      if (xmas.visible && (twinkleT += dt) > 0.3) {
        twinkleT = 0;
        for (let i = 0; i < bulbPts.length; i++) { tmpC.copy(bulbCols[(i + Math.floor(time * 2)) % 4]); bulbs.setColorAt(i, tmpC); }
        bulbs.instanceColor.needsUpdate = true;
        star.rotation.y = time;
      }
      needsRender = true;
    }
    if (controls.enabled) controls.update();
    if (needsRender) { renderer.render(scene, camera); placeHotspots(); needsRender = false; }
  }

  new IntersectionObserver((entries) => {
    const was = visible; visible = entries[0].isIntersecting && !document.hidden;
    if (visible && !was) { clock.getDelta(); requestAnimationFrame(frame); }
  }, { rootMargin: '100px' }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    const was = visible; visible = !document.hidden && stage.getBoundingClientRect().top < innerHeight && stage.getBoundingClientRect().bottom > 0;
    if (visible && !was) { clock.getDelta(); requestAnimationFrame(frame); }
  });

  resize(); applyNight(0); renderer.render(scene, camera); placeHotspots();
  root.classList.add('is-ready');
  requestAnimationFrame(frame);

  /* public controls for the page UI */
  return {
    toggleNight() { nightTarget = nightTarget ? 0 : 1; needsRender = true; return !!nightTarget; },
    togglePlay() { running = !running; if (!running) idleUntil = Infinity; else idleUntil = 0; needsRender = true; return running; },
    reset() { tweenTo(homeSph, 1200); },
    zoom(f) {
      spherical.setFromVector3(camera.position.clone().sub(target));
      const to = spherical.clone(); to.radius = THREE.MathUtils.clamp(spherical.radius * f, controls.minDistance, controls.maxDistance);
      tweenTo(to, 500); idleUntil = performance.now() + 7000;
    },
    setInteractive(on) { controls.enabled = on; renderer.domElement.style.touchAction = on ? 'none' : 'pan-y'; },
    setPromo(on) { promo = on; xmas.visible = on; needsRender = true; },
    isRunning() { return running; }
  };
}
