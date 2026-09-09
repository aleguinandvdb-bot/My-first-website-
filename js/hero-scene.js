/* Chateau de Rockville Cafe — hero 3D scene: a procedural coffee cup with rising steam.
   Built with Three.js primitives (no external model files). */
import * as THREE from "./vendor/three.module.min.js";
import { getStudioEnvironment } from "./studio-env.js";
import { makeCupMesh, makeSaucerMesh, makeHandleMesh, CUP_INTERIOR_RADIUS, CUP_RIM_Y } from "./cup-mesh.js";
import { makeSoftDotTexture, makeLatteArtTexture } from "./latte-art.js";
import { DRINKS, makeDrinkMesh } from "./drink-mesh.js";

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

  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  /* Framing solved by projecting the saucer's own near/far/left/right
     edges through the camera and searching for the closest camera that
     keeps the panel margins within a set tolerance, rather than pulling
     back indefinitely to chase perfect balance — that made the cup look
     small and distant. This is the closest position found that still
     keeps the top/bottom margin difference under ~35px. */
  var LATTE_VIEW = {
    pos: new THREE.Vector3(0, 4.44, 6.12),
    target: new THREE.Vector3(0, -1.12, 0)
  };
  camera.position.copy(LATTE_VIEW.pos);
  camera.lookAt(LATTE_VIEW.target);

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

  // The hot latte is one of several drinks the hero can show, so it lives in
  // its own subgroup that the switcher can hide as a unit — steam included,
  // since an iced cup has none.
  var latte = new THREE.Group();
  group.add(latte);

  // ---- Saucer — glazed teal, matching the café's real cup color ----
  // The cup's own foot sits at local y=-0.78 (unmoved, origin-anchored),
  // while the saucer's flat plate top used to land at y=-1.47 with the old
  // -0.68 offset — a ~0.69-unit gap that read as the cup floating above
  // the saucer. Raising the saucer to 0.01 puts the plate's top surface
  // flush with the cup's foot instead, without touching the cup, coffee,
  // handle or steam (whose vertical framing was tuned assuming the cup
  // stays at the origin).
  var saucer = makeSaucerMesh(0x0d454e);
  saucer.position.y = 0.01;
  latte.add(saucer);

  // ---- Cup body — a wide, shallow cappuccino silhouette (foot, belly
  // curve, rolled lip, hollow interior) matching the café's real cup
  // photo, built as one revolved profile shared with the finale scene. ----
  var cup = makeCupMesh(0x0d454e);
  latte.add(cup);

  // Coffee surface — a real latte-art heart baked into the texture map,
  // matching the reference photo, instead of a flat crema ring.
  var coffeeMat = new THREE.MeshPhysicalMaterial({
    map: makeLatteArtTexture(), roughness: 0.1, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.05, reflectivity: 0.6
  });
  var coffee = new THREE.Mesh(new THREE.CircleGeometry(CUP_INTERIOR_RADIUS * 0.94, 48), coffeeMat);
  coffee.rotation.x = -Math.PI / 2;
  coffee.rotation.z = -0.4;
  coffee.position.y = CUP_RIM_Y - 0.06;
  latte.add(coffee);

  // A soft round highlight on the coffee's surface — the "catch light" a real glossy liquid shows
  var sheenMat = new THREE.SpriteMaterial({
    map: makeSoftDotTexture(), color: 0xfff3d8, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  var sheen = new THREE.Sprite(sheenMat);
  sheen.scale.set(0.6, 0.6, 1);
  sheen.position.set(-0.36, coffee.position.y + 0.01, 0.3);
  latte.add(sheen);

  // Handle — now that the scene carries a PMREM studio environment, this
  // can be a true metal — it has something real to reflect.
  var handle = makeHandleMesh(0xd4af37, true);
  latte.add(handle);

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
    // Start above the rim (0.64): these are large additive sprites, and
    // spawning them at the coffee surface washes the latte art out.
    positions[i * 3 + 1] = 0.95 + Math.random() * 1.35;
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
  latte.add(steam);

  // ---- The rest of the drinks board, one shown at a time ----
  var stages = [{ group: latte, key: "hero.drinkLatte", name: "Latte", view: LATTE_VIEW, fit: false }];
  DRINKS.forEach(function (d) {
    var mesh = makeDrinkMesh(d);
    mesh.visible = false;
    group.add(mesh);
    stages.push({ group: mesh, key: d.key, name: d.name, view: null, fit: true });
  });

  /* An iced cup is tall and narrow where the latte's saucer is wide and
     flat. Seen from the saucer's own steep camera it is mostly lid: the
     view looks down into the dome and the layers — the whole point of the
     drink — are edge-on and unreadable. So each iced stage carries its own
     camera, near side-on with just enough tilt to keep the surface visible,
     at the distance that fits the cup with a margin.

     The distance is measured off the object's real bounds rather than
     hand-tuned, so a straw or a cream swirl re-frames itself instead of
     being clipped, and it is re-measured on resize because the panel's
     aspect decides whether height or width is the binding constraint.

     It is solved by iteration rather than in closed form because the answer
     is a perspective one: the cup's near-bottom edge is closer to a tilted
     camera than its far-top edge, so it projects further out, and a formula
     that only balances world-space offsets leaves the base clipped. Each
     pass reprojects the silhouette, slides the look-at point to centre what
     it sees, and rescales the distance by how far off the fit is. */
  var ICED_ELEVATION = 0.27; // radians above the cup's own centre
  var ICED_MARGIN = 1.10;
  var probe = new THREE.PerspectiveCamera(camera.fov, 1, 0.01, 100);

  function fitView(obj) {
    var keepX = group.rotation.x, keepY = group.rotation.y;
    group.rotation.set(0, 0, 0);
    group.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(obj);
    group.rotation.set(keepX, keepY, 0);
    group.updateMatrixWorld(true);
    if (box.isEmpty()) return LATTE_VIEW;

    // The cup is a solid of revolution about the group's own axis, so its
    // horizontal half-extent is the radius it sweeps under the idle spin.
    // Fit the whole swept cylinder and no angle of the turn can clip it.
    var radius = Math.max(
      Math.abs(box.min.x), Math.abs(box.max.x),
      Math.abs(box.min.z), Math.abs(box.max.z)
    );
    var pts = [];
    for (var i = 0; i <= 4; i++) {
      var py = box.min.y + (box.max.y - box.min.y) * i / 4;
      for (var a = 0; a < 16; a++) {
        var th = a / 16 * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(th) * radius, py, Math.sin(th) * radius));
      }
    }

    var tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    var goal = 1 / ICED_MARGIN;
    var targetY = (box.min.y + box.max.y) / 2;
    var dist = (box.max.y - box.min.y) / tanY;
    probe.aspect = camera.aspect;
    probe.updateProjectionMatrix();

    var v = new THREE.Vector3();
    for (var it = 0; it < 30; it++) {
      probe.position.set(0, targetY + Math.sin(ICED_ELEVATION) * dist, Math.cos(ICED_ELEVATION) * dist);
      probe.lookAt(0, targetY, 0);
      probe.updateMatrixWorld(true);
      var top = -Infinity, bot = Infinity, wide = 0;
      for (var p = 0; p < pts.length; p++) {
        v.copy(pts[p]).project(probe);
        if (v.y > top) top = v.y;
        if (v.y < bot) bot = v.y;
        wide = Math.max(wide, Math.abs(v.x));
      }
      var mid = (top + bot) / 2;
      targetY += mid * dist * tanY;
      dist *= Math.max(top - mid, mid - bot, wide) / goal;
    }

    return {
      pos: new THREE.Vector3(0, targetY + Math.sin(ICED_ELEVATION) * dist, Math.cos(ICED_ELEVATION) * dist),
      target: new THREE.Vector3(0, targetY, 0)
    };
  }

  function stageView(stage) {
    if (stage.fit && !stage.view) stage.view = fitView(stage.group);
    return stage.view;
  }

  var current = 0;
  var label = document.getElementById("drinkLabel");
  var camTarget = LATTE_VIEW.target.clone();
  var camGoal = LATTE_VIEW.pos.clone();
  var lookGoal = LATTE_VIEW.target.clone();

  function showDrink(next, snap) {
    current = (next + stages.length) % stages.length;
    for (var s = 0; s < stages.length; s++) stages[s].group.visible = s === current;
    var view = stageView(stages[current]);
    camGoal.copy(view.pos);
    lookGoal.copy(view.target);
    if (snap) {
      camera.position.copy(camGoal);
      camTarget.copy(lookGoal);
      camera.lookAt(camTarget);
    }
    if (!label) return;
    // Hand the new name back to the translator rather than writing a
    // language into the DOM: applyLanguage stamps the active code onto
    // <html lang>, so re-applying it keeps the label in the reader's language.
    label.setAttribute("data-i18n", stages[current].key);
    label.textContent = stages[current].name;
    if (window.CRCi18n) window.CRCi18n.apply(document.documentElement.lang || "en");
  }

  var prevBtn = document.getElementById("drinkPrev");
  var nextBtn = document.getElementById("drinkNext");
  if (prevBtn) prevBtn.addEventListener("click", function () { showDrink(current - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { showDrink(current + 1); });
  showDrink(0, true);

  // ---- Resize handling ----
  function resize() {
    var w = container.clientWidth || 1;
    var h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // A fitted view is only valid for the aspect it was solved against.
    for (var s = 0; s < stages.length; s++) if (stages[s].fit) stages[s].view = null;
    var view = stageView(stages[current]);
    camGoal.copy(view.pos);
    lookGoal.copy(view.target);
  }
  resize();
  camera.position.copy(camGoal);
  camTarget.copy(lookGoal);

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

    // Ease between stage cameras. Rate is derived from dt so the glide takes
    // the same time whether the panel is running at 60fps or 120.
    var ease = 1 - Math.pow(0.0015, dt);
    camera.position.lerp(camGoal, ease);
    camTarget.lerp(lookGoal, ease);
    camera.lookAt(camTarget);

    var pos = steamGeo.attributes.position;
    for (var i = 0; i < STEAM_COUNT; i++) {
      var seed = seeds[i];
      var speed = 0.35 + seed * 0.25;
      var y = pos.getY(i) + dt * speed;
      if (y > 2.4) {
        y = 0.95;
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
