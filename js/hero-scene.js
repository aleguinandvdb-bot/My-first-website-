/* Chateau Rockville Cafe — hero 3D scene: a procedural coffee cup with rising steam.
   Built with Three.js primitives (no external model files). */
import * as THREE from "./vendor/three.module.min.js";

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var canvas = document.getElementById("heroCanvas");

if (!canvas || reduceMotion) {
  // CSS already hides the canvas under prefers-reduced-motion; skip WebGL entirely.
} else {
  initScene(canvas);
}

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

function initScene(canvas) {
  var container = canvas.parentElement;
  var renderer;

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // WebGL unavailable — CSS gradient background remains as fallback.
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 1.55, 6.4);
  camera.lookAt(0, 0.5, 0);

  // ---- Lighting: warm, café-glow ----
  var hemi = new THREE.HemisphereLight(0xfff1de, 0x6b4a33, 0.9);
  scene.add(hemi);

  var key = new THREE.PointLight(0xffd9a8, 38, 20, 2);
  key.position.set(3.2, 4.5, 4);
  scene.add(key);

  var rim = new THREE.PointLight(0xff9d5c, 14, 20, 2);
  rim.position.set(-3.5, 1.5, -2);
  scene.add(rim);

  var amb = new THREE.AmbientLight(0x6b4a33, 0.5);
  scene.add(amb);

  // ---- Group holding the whole composition (for rotation / parallax) ----
  var group = new THREE.Group();
  scene.add(group);

  // ---- Saucer ----
  var saucerMat = new THREE.MeshStandardMaterial({ color: 0xe9d9c0, roughness: 0.55, metalness: 0.05 });
  var saucer = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.2, 0.14, 48), saucerMat);
  saucer.position.y = -1.05;
  group.add(saucer);

  var saucerRim = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 12, 48), saucerMat);
  saucerRim.rotation.x = Math.PI / 2;
  saucerRim.position.y = -0.98;
  group.add(saucerRim);

  // ---- Cup body (slightly tapered cylinder, open top) ----
  var cupMat = new THREE.MeshStandardMaterial({ color: 0xf5ead6, roughness: 0.35, metalness: 0.08 });
  var cupGeo = new THREE.CylinderGeometry(1.35, 1.05, 1.9, 48, 1, true);
  var cup = new THREE.Mesh(cupGeo, cupMat);
  cup.position.y = 0;
  group.add(cup);

  // Cup base (closes the bottom)
  var base = new THREE.Mesh(new THREE.CircleGeometry(1.05, 48), cupMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.95;
  group.add(base);

  // Cup rim (torus at the top edge for a finished lip)
  var rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 16, 48), cupMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 0.95;
  group.add(rimMesh);

  // Coffee surface (dark disc inset from the rim)
  var coffeeMat = new THREE.MeshStandardMaterial({ color: 0x3a2314, roughness: 0.18, metalness: 0.25 });
  var coffee = new THREE.Mesh(new THREE.CircleGeometry(1.22, 48), coffeeMat);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.88;
  group.add(coffee);

  // Handle — a partial torus (arc) attached to the cup's side
  var handleMat = new THREE.MeshStandardMaterial({ color: 0xf5ead6, roughness: 0.35, metalness: 0.08 });
  var handleGeo = new THREE.TorusGeometry(0.55, 0.12, 16, 32, Math.PI * 1.5);
  var handle = new THREE.Mesh(handleGeo, handleMat);
  handle.rotation.z = Math.PI * 0.22;
  handle.rotation.y = Math.PI / 2;
  handle.position.set(1.45, 0.05, 0);
  group.add(handle);

  group.position.y = -0.15;
  group.scale.setScalar(0.92);

  // ---- Steam: soft rising particles ----
  var STEAM_COUNT = 42;
  var steamGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(STEAM_COUNT * 3);
  var seeds = new Float32Array(STEAM_COUNT); // per-particle phase/speed seed

  for (var i = 0; i < STEAM_COUNT; i++) {
    var angle = Math.random() * Math.PI * 2;
    var radius = Math.random() * 0.55;
    positions[i * 3 + 0] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.9 + Math.random() * 1.6;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.6;
    seeds[i] = Math.random();
  }
  steamGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  var steamMat = new THREE.PointsMaterial({
    map: makeSoftDotTexture(),
    size: 0.75,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xfff1df
  });

  var steam = new THREE.Points(steamGeo, steamMat);
  group.add(steam);

  // ---- Resize handling ----
  function resize() {
    var w = container.clientWidth || 1;
    var h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  var ro = new ResizeObserver(resize);
  ro.observe(container);

  // ---- Mouse parallax (bounded, gentle) ----
  var targetRotY = 0;
  var targetRotX = 0;
  function onPointerMove(e) {
    var rect = container.getBoundingClientRect();
    var nx = (e.clientX - rect.left) / rect.width - 0.5;
    var ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotY = nx * 0.5;
    targetRotX = ny * 0.22;
  }
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerleave", function () {
    targetRotY = 0;
    targetRotX = 0;
  });

  // ---- Animation loop ----
  var clock = new THREE.Clock();
  var running = true;
  var baseRotY = 0;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    var dt = clock.getDelta();
    var t = clock.elapsedTime;

    baseRotY += dt * 0.18;
    group.rotation.y += (baseRotY + targetRotY - group.rotation.y) * 0.06;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.06;

    var pos = steamGeo.attributes.position;
    for (var i = 0; i < STEAM_COUNT; i++) {
      var seed = seeds[i];
      var speed = 0.35 + seed * 0.25;
      var y = pos.getY(i) + dt * speed;
      if (y > 2.7) {
        y = 0.85;
      }
      var wobble = Math.sin(t * (0.8 + seed) + seed * 10) * 0.004;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + wobble);
    }
    pos.needsUpdate = true;
    steamMat.opacity = 0.32 + Math.sin(t * 0.6) * 0.06;

    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      clock.getDelta(); // avoid a large dt jump after resuming
      animate();
    }
  });

  animate();
}
