/* Chateau de Rockville Cafe — hero 3D scene: a procedural coffee cup with rising steam.
   Built with Three.js primitives (no external model files). */
import * as THREE from "./vendor/three.module.min.js";
import { getStudioEnvironment } from "./studio-env.js";
import { makeCupMesh, makeSaucerMesh, makeHandleMesh, CUP_INTERIOR_RADIUS, CUP_RIM_Y } from "./cup-mesh.js";
import { makeSoftDotTexture, makeLatteArtTexture } from "./latte-art.js";

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var canvas = document.getElementById("heroCanvas");

if (!canvas || reduceMotion) {
  // CSS already hides the canvas under prefers-reduced-motion; skip WebGL entirely.
} else {
  initScene(canvas);
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.environment = getStudioEnvironment(renderer);

  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  /* Framing solved by projecting the saucer's own near/far edges through
     the camera and checking the resulting panel margins numerically. A
     steeper angle balanced those margins better but made the opaque cup
     occlude nearly all of the saucer behind it — an effect no camera
     angle removes entirely (any downward-looking shot of a tall object
     on a flat plate shows more of the plate in front than behind; that's
     real occlusion, not a framing bug), but a shallower angle keeps it
     from being severe. This is the balance point within that shallower
     range. */
  camera.position.set(0, 3.5, 9.5);
  camera.lookAt(0, -1.1, 0);

  // ---- Lighting: warm, café-glow ----
  var hemi = new THREE.HemisphereLight(0xfff1de, 0x6b4a33, 0.9);
  scene.add(hemi);

  var key = new THREE.PointLight(0xffd9a8, 42, 20, 2);
  key.position.set(3.2, 4.5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 15;
  key.shadow.bias = -0.001;
  key.shadow.radius = 3;
  scene.add(key);

  var rim = new THREE.PointLight(0xff9d5c, 14, 20, 2);
  rim.position.set(-3.5, 1.5, -2);
  scene.add(rim);

  // Small bright highlight light — mimics a window catch-light on the glaze
  var spec = new THREE.PointLight(0xffffff, 6, 8, 2);
  spec.position.set(1.6, 2.2, 3.2);
  scene.add(spec);

  var amb = new THREE.AmbientLight(0x6b4a33, 0.5);
  scene.add(amb);

  // ---- Group holding the whole composition (for rotation / parallax) ----
  var group = new THREE.Group();
  scene.add(group);

  // ---- Saucer — glazed teal, matching the café's real cup color ----
  var saucer = makeSaucerMesh(0x0d454e);
  saucer.position.y = -0.68;
  group.add(saucer);

  // ---- Cup body — a wide, shallow cappuccino silhouette (foot, belly
  // curve, rolled lip, hollow interior) matching the café's real cup
  // photo, built as one revolved profile shared with the finale scene. ----
  var cup = makeCupMesh(0x0d454e);
  group.add(cup);

  // Coffee surface — a real latte-art heart baked into the texture map,
  // matching the reference photo, instead of a flat crema ring.
  var coffeeMat = new THREE.MeshPhysicalMaterial({
    map: makeLatteArtTexture(), roughness: 0.1, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.05, reflectivity: 0.6
  });
  var coffee = new THREE.Mesh(new THREE.CircleGeometry(CUP_INTERIOR_RADIUS * 0.94, 48), coffeeMat);
  coffee.rotation.x = -Math.PI / 2;
  coffee.rotation.z = -0.4;
  coffee.position.y = CUP_RIM_Y - 0.06;
  group.add(coffee);

  // A soft round highlight on the coffee's surface — the "catch light" a real glossy liquid shows
  var sheenMat = new THREE.SpriteMaterial({
    map: makeSoftDotTexture(), color: 0xfff3d8, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  var sheen = new THREE.Sprite(sheenMat);
  sheen.scale.set(0.6, 0.6, 1);
  sheen.position.set(-0.36, coffee.position.y + 0.01, 0.3);
  group.add(sheen);

  // Handle — now that the scene carries a PMREM studio environment, this
  // can be a true metal — it has something real to reflect.
  var handle = makeHandleMesh(0xd4af37, true);
  group.add(handle);

  group.position.y = -0.05;
  group.scale.setScalar(0.78);

  // ---- Steam: soft rising particles ----
  var STEAM_COUNT = 42;
  var steamGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(STEAM_COUNT * 3);
  var seeds = new Float32Array(STEAM_COUNT); // per-particle phase/speed seed

  for (var i = 0; i < STEAM_COUNT; i++) {
    var angle = Math.random() * Math.PI * 2;
    var radius = Math.random() * 0.55;
    positions[i * 3 + 0] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.6 + Math.random() * 1.5;
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
  /* Turn the handle to point straight back, away from the camera, so it
     tucks behind the cup body instead of sticking out to one side. Every
     angle that showed it — even ones measured to keep the saucer's own
     left/right edges perfectly even — still put a bright gold lobe on one
     side of an otherwise round, radially symmetric silhouette, which reads
     as "off-center" regardless of what the underlying pixel math says.
     Hiding it removes the asymmetry outright instead of trying to balance
     it. Mouse parallax still eases around this, so the scene stays
     interactive. */
  var baseRotY = Math.PI / 2;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    var dt = clock.getDelta();
    var t = clock.elapsedTime;

    group.rotation.y += (baseRotY + targetRotY - group.rotation.y) * 0.06;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.06;

    var pos = steamGeo.attributes.position;
    for (var i = 0; i < STEAM_COUNT; i++) {
      var seed = seeds[i];
      var speed = 0.35 + seed * 0.25;
      var y = pos.getY(i) + dt * speed;
      if (y > 2.4) {
        y = 0.6;
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
