/* Chateau de Rockville Cafe — "The Process" section: two small scroll-
   scrubbed 3D scenes showing beans being ground and milk being steamed. */
import * as THREE from "./vendor/three.module.min.js";
import { makeRoastBumpTexture, makeBeanMaterial, makeCreaseMaterial, makeBeanMesh } from "./bean-mesh.js";

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function makeSoftDotTexture() {
  var size = 128;
  var c = document.createElement("canvas");
  c.width = c.height = size;
  var ctx = c.getContext("2d");
  var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.4, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  var tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function baseRenderer(canvas) {
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

function baseLights(scene) {
  var hemi = new THREE.HemisphereLight(0xfff1de, 0x4a3626, 0.85);
  scene.add(hemi);
  var key = new THREE.PointLight(0xffd9a8, 32, 20, 2);
  key.position.set(3, 4, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);
  var fill = new THREE.PointLight(0x5da8b9, 8, 16, 2);
  fill.position.set(-3, -1, 3);
  scene.add(fill);
  return { hemi: hemi, key: key, fill: fill };
}

function bindScrollProgress(trigger, setProgress) {
  function bind() {
    if (!window.gsap || !window.ScrollTrigger) {
      window.setTimeout(bind, 150);
      return;
    }
    window.ScrollTrigger.create({
      trigger: trigger,
      start: "top 88%",
      end: "bottom 35%",
      scrub: 0.6,
      onUpdate: function (self) { setProgress(self.progress); }
    });
  }
  bind();
}

function watchVisibility(getRunning, setRunning, clock, animate) {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      setRunning(false);
    } else if (!getRunning()) {
      setRunning(true);
      clock.getDelta();
      animate();
    }
  });
}

/* ============================================================
   Scene 1 — Grinder: beans in, grounds out
   ============================================================ */
function initGrinder(canvas) {
  var container = canvas.parentElement;
  var renderer = baseRenderer(canvas);
  if (!renderer) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(2.2, 1.6, 6.6);
  camera.lookAt(0, 0.2, 0);
  baseLights(scene);

  var group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.AmbientLight(0x8fb0b5, 0.5));

  // Lighter teal + modest metalness — a fully dark/metallic material with
  // no environment map to reflect just reads as near-black on a small
  // decorative render.
  var metalMat = new THREE.MeshPhysicalMaterial({ color: 0x1a6672, roughness: 0.35, metalness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25 });
  var glassMat = new THREE.MeshPhysicalMaterial({ color: 0xdfeef0, roughness: 0.08, metalness: 0, transmission: 0.85, thickness: 0.3, transparent: true, opacity: 0.55 });

  // Hopper (glassy cone) + grinder body + chute + portafilter basket
  var hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.35, 1.5, 32, 1, true), glassMat);
  hopper.position.y = 1.55;
  group.add(hopper);

  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.9, 32), metalMat);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  var burr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 32), metalMat);
  burr.position.y = 0.78;
  group.add(burr);

  var chute = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 16), metalMat);
  chute.position.y = -0.25;
  group.add(chute);

  var basket = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.32, 32, 1, true), metalMat);
  basket.position.y = -0.85;
  basket.receiveShadow = true;
  group.add(basket);
  var basketFloor = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), metalMat);
  basketFloor.rotation.x = -Math.PI / 2;
  basketFloor.position.y = -1.0;
  basketFloor.receiveShadow = true;
  group.add(basketFloor);
  var handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 12), metalMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(-0.85, -0.87, 0);
  group.add(handleBar);

  // Whole beans sitting in the hopper, consumed as progress advances
  var roastBump = makeRoastBumpTexture();
  var creaseMat = makeCreaseMaterial();
  var beans = [];
  for (var i = 0; i < 4; i++) {
    var mat = makeBeanMaterial(roastBump, i);
    var mesh = makeBeanMesh(mat, creaseMat);
    mesh.scale.setScalar(0.32);
    var a = (i / 4) * Math.PI * 2;
    var startPos = new THREE.Vector3(Math.cos(a) * 0.35, 1.9 + i * 0.12, Math.sin(a) * 0.35);
    mesh.position.copy(startPos);
    group.add(mesh);
    beans.push({ mesh: mesh, start: startPos, end: new THREE.Vector3(0, 0.6, 0) });
  }

  // Ground coffee — revealed progressively via draw-range so it reads as
  // the basket filling, not a single pre-placed cloud.
  var GRAIN_COUNT = 500;
  var grainGeo = new THREE.BufferGeometry();
  var grainPos = new Float32Array(GRAIN_COUNT * 3);
  for (var g = 0; g < GRAIN_COUNT; g++) {
    var ang = Math.random() * Math.PI * 2;
    var rad = Math.sqrt(Math.random()) * 0.44;
    grainPos[g * 3 + 0] = Math.cos(ang) * rad;
    grainPos[g * 3 + 1] = -0.92 + Math.random() * (0.05 + rad * 0.25);
    grainPos[g * 3 + 2] = Math.sin(ang) * rad;
  }
  grainGeo.setAttribute("position", new THREE.BufferAttribute(grainPos, 3));
  grainGeo.setDrawRange(0, 0);
  var grainMat = new THREE.PointsMaterial({ color: 0x3a2314, size: 0.045, sizeAttenuation: true });
  var grains = new THREE.Points(grainGeo, grainMat);
  group.add(grains);

  group.scale.setScalar(0.8);
  group.position.y = -0.1;

  function layout(progress) {
    var beanP = THREE.MathUtils.clamp(progress / 0.55, 0, 1);
    var beanEase = beanP * beanP;
    for (var i = 0; i < beans.length; i++) {
      var b = beans[i];
      b.mesh.position.lerpVectors(b.start, b.end, beanEase);
      var s = 0.32 * (1 - beanEase);
      b.mesh.scale.setScalar(Math.max(s, 0.0001));
      b.mesh.rotation.y += 0.02;
    }
    var grainP = THREE.MathUtils.clamp((progress - 0.15) / 0.85, 0, 1);
    grainGeo.setDrawRange(0, Math.floor(GRAIN_COUNT * grainP));
  }

  var progress = reduceMotion ? 1 : 0;
  layout(progress);

  function resize() {
    var w = container.clientWidth || 1;
    var h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  if (reduceMotion) {
    renderer.render(scene, camera);
    return;
  }

  bindScrollProgress(container, function (p) { progress = p; });

  var clock = new THREE.Clock();
  var running = true;
  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    clock.getDelta();
    burr.rotation.y += 0.03;
    layout(progress);
    renderer.render(scene, camera);
  }
  watchVisibility(function () { return running; }, function (v) { running = v; }, clock, animate);
  animate();
}

/* ============================================================
   Scene 2 — Milk foaming under a steam wand
   ============================================================ */
function initMilk(canvas) {
  var container = canvas.parentElement;
  var renderer = baseRenderer(canvas);
  if (!renderer) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(-2.0, 2.0, 6.6);
  camera.lookAt(0, 0.1, 0);
  baseLights(scene);
  scene.add(new THREE.AmbientLight(0xd8e4e6, 0.55));

  var group = new THREE.Group();
  scene.add(group);

  // Lower metalness than a real steel pitcher — without an environment map
  // to reflect, high metalness reads as near-black rather than brushed steel.
  var steelMat = new THREE.MeshPhysicalMaterial({ color: 0xd7dcdd, roughness: 0.32, metalness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.2 });

  // Pitcher: body + pulled spout + handle
  var pitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.55, 1.7, 32, 1, true), steelMat);
  pitcher.position.y = 0.1;
  pitcher.castShadow = true;
  group.add(pitcher);
  var pitcherBase = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), steelMat);
  pitcherBase.rotation.x = -Math.PI / 2;
  pitcherBase.position.y = -0.75;
  group.add(pitcherBase);

  var spout = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 16, 1, true), steelMat);
  spout.rotation.z = -0.55;
  spout.position.set(0.85, 1.0, 0);
  group.add(spout);

  var handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.75, 0.55, 0),
    new THREE.Vector3(-1.3, 0.5, 0),
    new THREE.Vector3(-1.3, -0.15, 0),
    new THREE.Vector3(-0.72, -0.2, 0)
  ]);
  var handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 30, 0.08, 12, false), steelMat);
  group.add(handle);

  // Steam wand — a bent tube dipping into the pitcher from upper right
  var wandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.4, 2.6, 0),
    new THREE.Vector3(1.4, 2.5, 0),
    new THREE.Vector3(0.55, 1.9, 0),
    new THREE.Vector3(0.35, 0.95, 0)
  ]);
  var wand = new THREE.Mesh(new THREE.TubeGeometry(wandCurve, 30, 0.06, 12, false), steelMat);
  group.add(wand);

  // Milk surface — rises and foams as progress advances
  var milkMat = new THREE.MeshPhysicalMaterial({ color: 0xf3ead8, roughness: 0.22, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  var milk = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), milkMat);
  milk.rotation.x = -Math.PI / 2;
  group.add(milk);

  // Foam bubbles at the surface, revealed progressively
  var FOAM_COUNT = 260;
  var foamGeo = new THREE.BufferGeometry();
  var foamPos = new Float32Array(FOAM_COUNT * 3);
  for (var f = 0; f < FOAM_COUNT; f++) {
    var ang = Math.random() * Math.PI * 2;
    var rad = Math.sqrt(Math.random()) * 0.66;
    foamPos[f * 3 + 0] = Math.cos(ang) * rad;
    foamPos[f * 3 + 1] = Math.random() * 0.06;
    foamPos[f * 3 + 2] = Math.sin(ang) * rad;
  }
  foamGeo.setAttribute("position", new THREE.BufferAttribute(foamPos, 3));
  foamGeo.setDrawRange(0, 0);
  var foamMat = new THREE.PointsMaterial({ color: 0xfffaf0, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.95 });
  var foam = new THREE.Points(foamGeo, foamMat);
  group.add(foam);

  // Rising steam from the wand tip
  var STEAM_COUNT = 22;
  var steamGeo = new THREE.BufferGeometry();
  var steamPos = new Float32Array(STEAM_COUNT * 3);
  var seeds = new Float32Array(STEAM_COUNT);
  for (var s = 0; s < STEAM_COUNT; s++) {
    steamPos[s * 3 + 0] = 0.35 + (Math.random() - 0.5) * 0.15;
    steamPos[s * 3 + 1] = 0.9 + Math.random() * 0.8;
    steamPos[s * 3 + 2] = (Math.random() - 0.5) * 0.15;
    seeds[s] = Math.random();
  }
  steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
  var steamMat = new THREE.PointsMaterial({
    map: makeSoftDotTexture(), size: 0.4, transparent: true, opacity: 0.35,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff1df
  });
  var steam = new THREE.Points(steamGeo, steamMat);
  group.add(steam);

  group.scale.setScalar(0.72);
  group.position.y = 0.05;

  function layout(progress) {
    var milkP = THREE.MathUtils.clamp(progress, 0, 1);
    milk.position.y = THREE.MathUtils.lerp(0.15, 0.62, milkP);
    foam.position.y = milk.position.y;
    var foamP = THREE.MathUtils.clamp((progress - 0.1) / 0.9, 0, 1);
    foamGeo.setDrawRange(0, Math.floor(FOAM_COUNT * foamP));
    steam.visible = progress > 0.08;
  }

  var progress = reduceMotion ? 1 : 0;
  layout(progress);

  function resize() {
    var w = container.clientWidth || 1;
    var h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  if (reduceMotion) {
    renderer.render(scene, camera);
    return;
  }

  bindScrollProgress(container, function (p) { progress = p; });

  var clock = new THREE.Clock();
  var running = true;
  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    var t = clock.elapsedTime;

    var pos = steamGeo.attributes.position;
    for (var i = 0; i < STEAM_COUNT; i++) {
      var seed = seeds[i];
      var y = pos.getY(i) + dt * (0.5 + seed * 0.3);
      if (y > 1.9) y = 0.85;
      pos.setY(i, y);
      pos.setX(i, 0.35 + Math.sin(t * (1 + seed) + seed * 10) * 0.06);
    }
    pos.needsUpdate = true;

    layout(progress);
    renderer.render(scene, camera);
  }
  watchVisibility(function () { return running; }, function (v) { running = v; }, clock, animate);
  animate();
}

var grinderCanvas = document.getElementById("grinderCanvas");
var milkCanvas = document.getElementById("milkCanvas");
if (grinderCanvas) initGrinder(grinderCanvas);
if (milkCanvas) initMilk(milkCanvas);
