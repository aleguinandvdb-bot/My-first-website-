/* Chateau de Rockville Cafe — "The Process" section.

   Three scenes:
   1. Grinder — beans drop and physically pile into each other in the
      hopper; a Grind button feeds them through the burrs and fills the
      portafilter with grounds.
   2. Steam pitcher — milk stretched under a steam wand.
   3. Finale cup — coffee brews, milk pours in, a sugar cube drops and
      dissolves. Idle on its own; driven end-to-end by the "Make the whole
      coffee" button below, which also runs the grind and the steam.

   All three are built from lathe profiles with real wall thickness (an
   open-ended cylinder has no back wall, so front-face culling makes it
   look sliced open) and lit with a shared PMREM studio environment. */
import * as THREE from "./vendor/three.module.min.js";
import { makeRoastBumpTexture, makeBeanMaterial, makeCreaseMaterial, makeBeanMesh } from "./bean-mesh.js";
import { getStudioEnvironment } from "./studio-env.js";
import { makeCupMesh, makeSaucerMesh, CUP_INTERIOR_FLOOR_Y } from "./cup-mesh.js";
import { makeCremaTexture, makeLatteArtTexture } from "./latte-art.js";

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* A single coffee grain: an opaque round particle, lit from the upper
   left so a bed of them reads as texture rather than flat brown dots. */
function makeGrainTexture() {
  var s = 64;
  var c = document.createElement("canvas");
  c.width = c.height = s;
  var ctx = c.getContext("2d");
  var g = ctx.createRadialGradient(s * 0.36, s * 0.33, s * 0.04, s / 2, s / 2, s / 2);
  g.addColorStop(0, "#6b4c33");
  g.addColorStop(0.55, "#402813");
  g.addColorStop(1, "#22150a");
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  var tex = new THREE.CanvasTexture(c);
  // Canvas pixels are sRGB; untagged they'd be read as linear and the
  // grounds would wash out to pale grey instead of roasted brown.
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
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
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

function baseLights(scene) {
  var key = new THREE.DirectionalLight(0xfff0dc, 2.2);
  key.position.set(3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0012;
  key.shadow.radius = 3;
  scene.add(key);

  var rim = new THREE.DirectionalLight(0x9fd4de, 0.7);
  rim.position.set(-4, 1.5, -3);
  scene.add(rim);
  return key;
}

/* Insert points so no profile segment is longer than maxStep. A lathe only
   places vertices where the profile has them, so a tall wall drawn as one
   segment cannot be smoothly deformed later. */
function densify(pts, maxStep) {
  var out = [pts[0]];
  for (var i = 1; i < pts.length; i++) {
    var a = pts[i - 1], b = pts[i];
    var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    var n = Math.max(1, Math.ceil(d / maxStep));
    for (var k = 1; k <= n; k++) {
      var t = k / n;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/* A hollow vessel with real wall thickness: up the outside, across the
   rim, back down the inside, then across the floor. */
function vesselGeometry(pts, segments) {
  return new THREE.LatheGeometry(
    pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }),
    segments || 56
  );
}

/* Pull a pouring spout out of a finished lathe by displacing every vertex
   within an arc of +X. Because the profile carries both the outer and the
   inner wall, the same radial push moves them together and the wall keeps
   its thickness through the spout — which is how a real pitcher is formed.
   A bolted-on cone would just be a second object floating past the rim. */
function pullSpout(geo, o) {
  var pos = geo.attributes.position;
  var v = new THREE.Vector3();
  for (var i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y < o.yStart) continue;
    var a = Math.abs(Math.atan2(v.z, v.x));
    if (a > o.halfAngle) continue;
    var across = Math.cos((a / o.halfAngle) * Math.PI * 0.5);
    var up = THREE.MathUtils.clamp((v.y - o.yStart) / (o.yTop - o.yStart), 0, 1);
    var k = across * across * up * up;
    var r = Math.hypot(v.x, v.z);
    if (r > 1e-5) {
      var s = (r + o.reach * k) / r;
      v.x *= s;
      v.z *= s;
    }
    pos.setXYZ(i, v.x, v.y + o.lift * k, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function watchVisibility(state, clock, animate) {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      state.running = false;
    } else if (!state.running) {
      state.running = true;
      clock.getDelta();
      animate();
    }
  });
}

/* ============================================================
   Scene 1 — Grinder with physical bean stacking + Grind button
   ============================================================ */
function initGrinder(canvas) {
  var container = canvas.parentElement;
  var renderer = baseRenderer(canvas);
  if (!renderer) return;

  var scene = new THREE.Scene();
  scene.environment = getStudioEnvironment(renderer);

  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(2.6, 2.4, 8.2);
  camera.lookAt(0, 0.15, 0);
  baseLights(scene);

  var group = new THREE.Group();
  scene.add(group);

  var bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x11525c, roughness: 0.28, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.18,
    envMapIntensity: 1.1
  });
  /* Brushed stainless, not chrome. A mirror-smooth metal samples the
     environment's dark gaps and reads near-black; roughness around 0.35
     blurs the map enough that it averages toward the light grey a real
     satin-finish machine part shows. */
  var steelMat = new THREE.MeshPhysicalMaterial({
    color: 0xdde3e5, roughness: 0.34, metalness: 0.95, envMapIntensity: 1.7
  });
  var glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.1,
    ior: 1.45, transparent: true, opacity: 1, side: THREE.DoubleSide, envMapIntensity: 1.2
  });

  // --- Hopper: a real walled funnel (outside down, across base, inside up)
  var hopper = new THREE.Mesh(vesselGeometry([
    [0.92, 1.75], [0.94, 1.72],
    [0.42, 0.62], [0.42, 0.52],
    [0.36, 0.52], [0.36, 0.64],
    [0.86, 1.70], [0.86, 1.75]
  ], 48), glassMat);
  hopper.position.y = 0.15;
  group.add(hopper);

  // --- Grinder body
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.85, 48), bodyMat);
  body.position.y = 0.28;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  var collar = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 14, 48), bodyMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.7;
  group.add(collar);

  // Burr disc — spins while grinding
  var burr = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.07, 36), steelMat);
  burr.position.y = 0.68;
  group.add(burr);

  var chute = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.42, 20), bodyMat);
  chute.position.y = -0.32;
  group.add(chute);

  // --- Portafilter: walled basket so it reads as a cup, not a sliced ring
  var basket = new THREE.Mesh(vesselGeometry([
    [0.00, -1.02], [0.46, -1.02],
    [0.66, -0.62], [0.66, -0.55],
    [0.60, -0.55], [0.60, -0.62],
    [0.40, -0.96], [0.00, -0.96]
  ], 48), steelMat);
  basket.castShadow = true;
  basket.receiveShadow = true;
  group.add(basket);

  var spoutRing = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.035, 12, 48), steelMat);
  spoutRing.rotation.x = Math.PI / 2;
  spoutRing.position.y = -0.57;
  group.add(spoutRing);

  var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.62, 16), new THREE.MeshPhysicalMaterial({
    color: 0x2a1a10, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.8
  }));
  grip.rotation.z = Math.PI / 2;
  grip.position.set(-0.98, -0.78, 0);
  group.add(grip);

  // --- Shadow catcher
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.05;
  floor.receiveShadow = true;
  scene.add(floor);

  /* --- Beans with real stacking.
     Small sphere-collision sim: gravity, funnel-wall constraint, floor,
     and pairwise separation. With this few beans the O(n²) pass is
     nothing, and it gives genuine piling instead of scripted positions. */
  var roastBump = makeRoastBumpTexture();
  var creaseMat = makeCreaseMaterial();
  var BEAN_COUNT = 14;
  var BEAN_R = 0.135;
  var beans = [];

  for (var i = 0; i < BEAN_COUNT; i++) {
    var mesh = makeBeanMesh(makeBeanMaterial(roastBump, i), creaseMat);
    mesh.scale.setScalar(BEAN_R * 2.05);
    mesh.castShadow = true;
    group.add(mesh);
    beans.push({
      mesh: mesh,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      spin: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      dropAt: i * 0.11,
      active: false,
      consumed: false
    });
  }

  function resetBeans() {
    for (var i = 0; i < beans.length; i++) {
      var b = beans[i];
      var a = Math.random() * Math.PI * 2;
      var r = Math.random() * 0.34;
      b.pos.set(Math.cos(a) * r, 2.2 + i * 0.16, Math.sin(a) * r);
      b.vel.set(0, 0, 0);
      b.dropAt = i * 0.11; // re-stagger, or a refill dumps all 14 at once
      b.active = false;
      b.consumed = false;
      b.mesh.visible = true;
      b.mesh.scale.setScalar(BEAN_R * 2.05);
      b.mesh.position.copy(b.pos);
    }
  }
  resetBeans();

  // Funnel radius at a given height — beans rest against the hopper wall
  function funnelRadius(y) {
    var top = 1.9, bottom = 0.72;
    if (y >= top) return 0.86;
    if (y <= bottom) return 0.33;
    var t = (y - bottom) / (top - bottom);
    return 0.33 + t * (0.86 - 0.33);
  }

  var FLOOR_Y = 0.72; // hopper throat — where the pile rests

  function stepBeans(dt, grinding) {
    dt = Math.min(dt, 1 / 40);
    var i, j, b;

    for (i = 0; i < beans.length; i++) {
      b = beans[i];
      if (b.consumed) continue;

      if (!b.active) {
        b.dropAt -= dt;
        if (b.dropAt <= 0) b.active = true;
        else continue;
      }

      b.vel.y -= 7.5 * dt;
      b.pos.addScaledVector(b.vel, dt);

      // Funnel wall constraint
      var maxR = funnelRadius(b.pos.y) - BEAN_R;
      var horiz = Math.sqrt(b.pos.x * b.pos.x + b.pos.z * b.pos.z);
      if (horiz > maxR && horiz > 0.0001) {
        var k = maxR / horiz;
        b.pos.x *= k;
        b.pos.z *= k;
        b.vel.x *= -0.25;
        b.vel.z *= -0.25;
      }

      // Throat floor (or fall through when grinding)
      if (!grinding && b.pos.y < FLOOR_Y + BEAN_R) {
        b.pos.y = FLOOR_Y + BEAN_R;
        if (b.vel.y < 0) b.vel.y *= -0.22;
        b.vel.x *= 0.86;
        b.vel.z *= 0.86;
      }
    }

    /* Pairwise separation — this is what makes them stack on each other.
       A bean already down in the burrs stops colliding, so the pile above
       feeds down as a continuous stream instead of queueing one at a time
       behind a bean that is still shrinking away. */
    var THROAT = 0.70;
    for (i = 0; i < beans.length; i++) {
      var a = beans[i];
      if (!a.active || a.consumed) continue;
      if (grinding && a.pos.y < THROAT) continue;
      for (j = i + 1; j < beans.length; j++) {
        var c = beans[j];
        if (!c.active || c.consumed) continue;
        if (grinding && c.pos.y < THROAT) continue;
        var dx = c.pos.x - a.pos.x, dy = c.pos.y - a.pos.y, dz = c.pos.z - a.pos.z;
        var d2 = dx * dx + dy * dy + dz * dz;
        var min = BEAN_R * 1.85;
        if (d2 < min * min && d2 > 0.000001) {
          var d = Math.sqrt(d2);
          var push = (min - d) / d * 0.5;
          a.pos.x -= dx * push; a.pos.y -= dy * push; a.pos.z -= dz * push;
          c.pos.x += dx * push; c.pos.y += dy * push; c.pos.z += dz * push;
          var damp = 0.5;
          a.vel.y *= damp; c.vel.y *= damp;
        }
      }
    }

    for (i = 0; i < beans.length; i++) {
      b = beans[i];
      if (b.consumed) continue;
      b.mesh.position.copy(b.pos);
      var moving = b.vel.lengthSq() > 0.004;
      if (moving) {
        b.rot.x += b.spin.x * dt;
        b.rot.y += b.spin.y * dt;
        b.rot.z += b.spin.z * dt;
        b.mesh.rotation.copy(b.rot);
      }
      // Swallowed by the burrs
      if (grinding && b.pos.y < 0.70) {
        var s = b.mesh.scale.x * 0.78;
        b.mesh.scale.setScalar(s);
        if (s < 0.03) { b.consumed = true; b.mesh.visible = false; }
      }
    }
  }

  /* --- Grounds accumulating in the basket.
     Sorted bottom-up, because setDrawRange reveals points in buffer order:
     unsorted, a partial range scatters grains through the whole volume and
     reads as noise instead of a bed of coffee filling from the floor. */
  var GRAIN_COUNT = 1500;
  var GRAIN_FLOOR = -0.95, GRAIN_TOP = -0.66;
  var grainPts = [];
  for (var g = 0; g < GRAIN_COUNT; g++) {
    var gy = GRAIN_FLOOR + Math.random() * (GRAIN_TOP - GRAIN_FLOOR);
    // Stay inside the basket wall, which flares 0.40 -> 0.60 over its height
    var wall = 0.40 + (gy - (-0.96)) / 0.41 * 0.20;
    var gr = Math.sqrt(Math.random()) * (wall - 0.04);
    // Dome the surface slightly so the top isn't a flat disc
    var lift = (1 - gr / wall) * 0.03 * Math.random();
    var ga = Math.random() * Math.PI * 2;
    grainPts.push([Math.cos(ga) * gr, gy + lift, Math.sin(ga) * gr]);
  }
  grainPts.sort(function (p, q) { return p[1] - q[1]; });
  var grainGeo = new THREE.BufferGeometry();
  var grainPos = new Float32Array(GRAIN_COUNT * 3);
  for (var gi = 0; gi < GRAIN_COUNT; gi++) {
    grainPos[gi * 3] = grainPts[gi][0];
    grainPos[gi * 3 + 1] = grainPts[gi][1];
    grainPos[gi * 3 + 2] = grainPts[gi][2];
  }
  grainGeo.setAttribute("position", new THREE.BufferAttribute(grainPos, 3));
  grainGeo.setDrawRange(0, 0);
  var grains = new THREE.Points(grainGeo, new THREE.PointsMaterial({
    size: 0.055, sizeAttenuation: true,
    map: makeGrainTexture(), alphaTest: 0.5, transparent: false
  }));
  group.add(grains);

  group.scale.setScalar(0.82);
  group.position.y = -0.05;

  // --- Grind state machine
  var state = { running: true, grinding: false, grindT: 0, fill: 0 };
  var button = document.getElementById("grindButton");
  var buttonLabel = button ? button.querySelector("[data-grind-label]") : null;

  function setLabel(key, fallback) {
    if (!buttonLabel) return;
    buttonLabel.setAttribute("data-i18n", key);
    var dict = window.CRCi18n && window.CRCi18n.strings;
    var lang = document.documentElement.getAttribute("lang") || "en";
    var text = dict && dict[lang] && dict[lang][key];
    buttonLabel.textContent = text || fallback;
  }

  function resetGrinder() {
    state.grinding = false;
    state.fill = 0;
    grainGeo.setDrawRange(0, 0);
    resetBeans();
  }

  function startGrind() {
    if (state.grinding) return;
    if (state.fill >= 1) {
      // Second press resets and refills the hopper
      resetGrinder();
      setLabel("process.grindButton", "Grind the beans");
      return;
    }
    state.grinding = true;
    state.grindT = 0;
    setLabel("process.grinding", "Grinding…");
  }

  // Drives the "Make the whole coffee" sequence: always starts from a full
  // hopper (unlike the button's own toggle) and reports back when the
  // basket is actually full, not on a fixed timer.
  function runGrind(onDone) {
    resetGrinder();
    state.grinding = true;
    state.grindT = 0;
    state.onGrindDone = onDone || null;
    setLabel("process.grinding", "Grinding…");
  }

  if (button) {
    button.addEventListener("click", startGrind);
  }

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
    // Settle the pile without animating, then show a full basket.
    for (var w = 0; w < 240; w++) stepBeans(1 / 60, false);
    grainGeo.setDrawRange(0, GRAIN_COUNT);
    renderer.render(scene, camera);
    if (button) button.disabled = true;
    return { runGrind: function (onDone) { if (onDone) onDone(); }, resetGrinder: function () {} };
  }

  function beansLeft() {
    var n = 0;
    for (var i = 0; i < beans.length; i++) if (!beans[i].consumed) n++;
    return n;
  }

  var clock = new THREE.Clock();
  function animate() {
    if (!state.running) return;
    requestAnimationFrame(animate);
    /* Clamp before anything reads it. An unclamped delta after a stalled
       frame or a backgrounded tab would advance the whole grind in one
       step — the label would flip to "done" while the beans sat untouched. */
    var dt = Math.min(clock.getDelta(), 1 / 30);

    if (state.grinding) {
      state.grindT += dt;
      burr.rotation.y += dt * 22;
      /* Drive the basket off beans actually swallowed rather than a clock,
         so the grounds rise exactly as the hopper empties and the label can
         never claim "done" over a hopper that still has beans in it. */
      var target = (BEAN_COUNT - beansLeft()) / BEAN_COUNT;
      state.fill += (target - state.fill) * Math.min(1, dt * 5);
      if (beansLeft() === 0 || state.grindT > 12) {
        state.grinding = false;
        state.fill = 1;
        setLabel("process.grindAgain", "Refill the hopper");
        if (state.onGrindDone) {
          var cb = state.onGrindDone;
          state.onGrindDone = null;
          cb();
        }
      }
    } else {
      burr.rotation.y += dt * 0.5;
      if (state.fill > 0 && state.fill < 1) state.fill = Math.min(1, state.fill + dt * 0.8);
    }

    stepBeans(dt, state.grinding);
    grainGeo.setDrawRange(0, Math.floor(GRAIN_COUNT * state.fill));
    renderer.render(scene, camera);
  }
  watchVisibility(state, clock, animate);
  animate();

  return { runGrind: runGrind, resetGrinder: resetGrinder };
}

/* ============================================================
   Scene 2 — Steam pitcher (properly walled, with a real interior)
   ============================================================ */
function initMilk(canvas) {
  var container = canvas.parentElement;
  var renderer = baseRenderer(canvas);
  if (!renderer) return;

  var scene = new THREE.Scene();
  scene.environment = getStudioEnvironment(renderer);

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  /* Steep, near-overhead angle. At the previous shallow ~20° camera the
     near rim wall sat directly in the sightline to the milk plane — the
     milk and foam were positioned and lit correctly, but completely
     hidden behind the pitcher's own near wall, so the fill never read as
     visible at any scroll position. Looking down at this angle keeps the
     near wall below the sightline to the pool. */
  camera.position.set(-1.2, 3.9, 3.6);
  camera.lookAt(0, 0.1, 0);
  baseLights(scene);

  var group = new THREE.Group();
  scene.add(group);

  var steelMat = new THREE.MeshPhysicalMaterial({
    color: 0xdde3e5, roughness: 0.34, metalness: 0.95, envMapIntensity: 1.7
  });

  /* Pitcher as a walled vessel: outside up, across the rim, inside back
     down, across the floor. The previous open-ended cylinder had no back
     wall at all — front-face culling made it look sliced in half. */
  var pitcherGeo = vesselGeometry(densify([
    [0.00, -0.88], [0.56, -0.88],
    [0.62, -0.83],                                  // heel
    [0.66, -0.60], [0.80, 0.60], [0.83, 0.88],      // flared outer wall
    [0.845, 0.915], [0.828, 0.945], [0.795, 0.945], // rolled rim bead
    [0.775, 0.915], [0.772, 0.86],
    [0.745, 0.58], [0.58, -0.62], [0.545, -0.78],   // inner wall back down
    [0.00, -0.80]                                   // interior floor
  ], 0.06), 96);
  pullSpout(pitcherGeo, {
    yStart: 0.24, yTop: 0.945, halfAngle: 0.62, reach: 0.30, lift: -0.05
  });
  var pitcher = new THREE.Mesh(pitcherGeo, steelMat);
  pitcher.castShadow = true;
  pitcher.receiveShadow = true;
  group.add(pitcher);

  var handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.80, 0.60, 0),
    new THREE.Vector3(-1.32, 0.46, 0),
    new THREE.Vector3(-1.34, -0.18, 0),
    new THREE.Vector3(-0.70, -0.34, 0)
  ]), 34, 0.075, 14, false), steelMat);
  handle.castShadow = true;
  group.add(handle);

  // Steam wand from the machine, dipping just under the surface
  var wand = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.9, 3.1, -0.1),
    new THREE.Vector3(1.7, 2.9, -0.05),
    new THREE.Vector3(0.72, 2.1, 0),
    new THREE.Vector3(0.34, 0.86, 0)
  ]), 34, 0.055, 14, false), steelMat);
  wand.castShadow = true;
  group.add(wand);

  var wandTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), steelMat);
  wandTip.position.set(0.34, 0.84, 0);
  group.add(wandTip);

  // Milk surface, inside the walls
  var milk = new THREE.Mesh(new THREE.CircleGeometry(0.7, 44), new THREE.MeshPhysicalMaterial({
    color: 0xf6efe1, roughness: 0.18, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.15,
    envMapIntensity: 0.6
  }));
  milk.rotation.x = -Math.PI / 2;
  group.add(milk);

  var FOAM_COUNT = 420;
  var foamGeo = new THREE.BufferGeometry();
  var foamPos = new Float32Array(FOAM_COUNT * 3);
  var foamSeed = new Float32Array(FOAM_COUNT);
  for (var f = 0; f < FOAM_COUNT; f++) {
    var ang = Math.random() * Math.PI * 2;
    var rad = Math.sqrt(Math.random()) * 0.66;
    foamPos[f * 3 + 0] = Math.cos(ang) * rad;
    foamPos[f * 3 + 1] = Math.random() * 0.05;
    foamPos[f * 3 + 2] = Math.sin(ang) * rad;
    foamSeed[f] = Math.random();
  }
  foamGeo.setAttribute("position", new THREE.BufferAttribute(foamPos, 3));
  foamGeo.setDrawRange(0, 0);
  var foam = new THREE.Points(foamGeo, new THREE.PointsMaterial({
    color: 0xfffaf2, size: 0.075, sizeAttenuation: true, transparent: true, opacity: 0.95
  }));
  group.add(foam);

  var STEAM_COUNT = 26;
  var steamGeo = new THREE.BufferGeometry();
  var steamPos = new Float32Array(STEAM_COUNT * 3);
  var seeds = new Float32Array(STEAM_COUNT);
  for (var s = 0; s < STEAM_COUNT; s++) {
    steamPos[s * 3 + 0] = 0.3 + (Math.random() - 0.5) * 0.3;
    steamPos[s * 3 + 1] = 0.95 + Math.random() * 0.9;
    steamPos[s * 3 + 2] = (Math.random() - 0.5) * 0.25;
    seeds[s] = Math.random();
  }
  steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
  var steamMat = new THREE.PointsMaterial({
    map: makeSoftDotTexture(), size: 0.46, transparent: true, opacity: 0.32,
    depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff4e6
  });
  var steam = new THREE.Points(steamGeo, steamMat);
  group.add(steam);

  var floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.88;
  floor.receiveShadow = true;
  scene.add(floor);

  group.scale.setScalar(0.78);
  group.position.y = 0.0;

  function layout(progress) {
    milk.position.y = THREE.MathUtils.lerp(0.05, 0.62, progress);
    foam.position.y = milk.position.y;
    foamGeo.setDrawRange(0, Math.floor(FOAM_COUNT * THREE.MathUtils.clamp((progress - 0.08) / 0.92, 0, 1)));
    steam.visible = progress > 0.06;
  }

  var state = { running: true, progress: reduceMotion ? 1 : 0, auto: false };
  layout(state.progress);

  function resetMilk() {
    state.progress = 0;
    layout(0);
  }

  /* Drives the "Make the whole coffee" sequence: tweens progress from its
     current value to 1 over durationSec, ignoring scroll for the duration
     so the two don't fight over who owns state.progress. Scroll regains
     control (see the ScrollTrigger onUpdate below) the moment it ends. */
  function autoFill(durationSec, onDone) {
    state.auto = true;
    var from = state.progress;
    var elapsed = 0;
    var last = null;
    function step(now) {
      /* Clamp per-frame, like the grinder's dt — a stalled frame (tab
         backgrounded, a GC pause) would otherwise hand the very next
         callback a huge real-time gap and let the fill jump straight to
         full instead of animating through it. */
      if (last === null) last = now;
      elapsed += Math.min((now - last) / 1000, 1 / 20);
      last = now;
      var t = Math.min(1, elapsed / durationSec);
      state.progress = from + (1 - from) * t;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        state.auto = false;
        if (onDone) onDone();
      }
    }
    requestAnimationFrame(step);
  }

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
    return { autoFill: function (d, onDone) { if (onDone) onDone(); }, resetMilk: function () {} };
  }

  (function bind() {
    if (!window.gsap || !window.ScrollTrigger) { window.setTimeout(bind, 150); return; }
    window.ScrollTrigger.create({
      trigger: container,
      start: "top 88%",
      end: "bottom 40%",
      scrub: 0.6,
      onUpdate: function (self) { if (!state.auto) state.progress = self.progress; }
    });
  })();

  var clock = new THREE.Clock();
  function animate() {
    if (!state.running) return;
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    var t = clock.elapsedTime;

    var pos = steamGeo.attributes.position;
    for (var i = 0; i < STEAM_COUNT; i++) {
      var seed = seeds[i];
      var y = pos.getY(i) + dt * (0.55 + seed * 0.35);
      if (y > 2.1) y = 0.9;
      pos.setY(i, y);
      pos.setX(i, 0.3 + Math.sin(t * (1 + seed) + seed * 10) * 0.09);
    }
    pos.needsUpdate = true;

    // Foam churns while it's being stretched
    var fpos = foamGeo.attributes.position;
    for (var k = 0; k < FOAM_COUNT; k++) {
      fpos.setY(k, Math.sin(t * 1.6 + foamSeed[k] * 12) * 0.018 + foamSeed[k] * 0.03);
    }
    fpos.needsUpdate = true;

    layout(state.progress);
    renderer.render(scene, camera);
  }
  watchVisibility(state, clock, animate);
  animate();

  return { autoFill: autoFill, resetMilk: resetMilk };
}

/* ============================================================
   Scene 3 — Finale cup: coffee brews, milk pours, sugar drops
   Idle by itself (an empty cup); every phase below is driven by the
   "Make the whole coffee" orchestrator at the bottom of this file.
   ============================================================ */
function initFinale(canvas) {
  var container = canvas.parentElement;
  var renderer = baseRenderer(canvas);
  if (!renderer) return null;

  var scene = new THREE.Scene();
  scene.environment = getStudioEnvironment(renderer);

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 4.0, 5.6);
  camera.lookAt(0, 0.05, 0);
  baseLights(scene);
  /* The coffee surface sits recessed inside the cup, past the rim's own
     wall — baseLights' two directional lights alone leave it with almost
     no direct light (the same recess-shadowing that affected the milk
     pitcher), so its diffuse map barely renders and the crema/latte-art
     texture washes out to a flat clearcoat reflection. A soft ambient
     fill, matching the hero cup's recipe, gets light down into it. */
  scene.add(new THREE.HemisphereLight(0xfff1de, 0x6b4a33, 0.85));
  scene.add(new THREE.AmbientLight(0x6b4a33, 0.45));

  var group = new THREE.Group();
  scene.add(group);

  var saucer = makeSaucerMesh(0x0d454e);
  saucer.position.y = -0.68;
  group.add(saucer);

  var cup = makeCupMesh(0x0d454e);
  group.add(cup);

  var floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.5;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- Coffee: a liquid cylinder that grows up from the interior floor,
  // capped with a surface disc carrying the crema texture. Radius is
  // chosen to clear the cup's tapered interior wall at every height up to
  // the fill target, instead of tracking the true taper exactly.
  var COFFEE_FLOOR_Y = CUP_INTERIOR_FLOOR_Y + 0.05;
  var COFFEE_FULL_HEIGHT = 0.92;
  var coffeeMat = new THREE.MeshPhysicalMaterial({
    color: 0x2b1810, roughness: 0.3, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.25
  });
  /* openEnded: true — the crema/latte-art discs below are the visible
     surface. With a closed top, the cylinder's own opaque cap sat right
     above them at the same height and hid both completely, no matter
     what their own opacity or draw order was. */
  var coffeeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.48, 1, 40, 1, true), coffeeMat);
  coffeeBody.visible = false;
  group.add(coffeeBody);

  var coffeeTopPlain = new THREE.Mesh(new THREE.CircleGeometry(0.6, 44), new THREE.MeshPhysicalMaterial({
    map: makeCremaTexture(), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05
  }));
  coffeeTopPlain.rotation.x = -Math.PI / 2;
  coffeeTopPlain.visible = false;
  group.add(coffeeTopPlain);

  // Sits a hair above the plain crema disc, fading in as milk is poured —
  // swapping the whole material would pop; a stacked, fading disc crossfades.
  // depthWrite: false — a purely decorative alpha overlay that never needs
  // to occlude anything else, and shouldn't while it's faded to invisible
  // (see the same reasoning on milkStreamMat above).
  var coffeeTopLatte = new THREE.Mesh(new THREE.CircleGeometry(0.6, 44), new THREE.MeshPhysicalMaterial({
    map: makeLatteArtTexture(), roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
    transparent: true, opacity: 0, depthWrite: false
  }));
  coffeeTopLatte.rotation.x = -Math.PI / 2;
  coffeeTopLatte.rotation.z = -0.4;
  coffeeTopLatte.visible = false;
  group.add(coffeeTopLatte);

  function coffeeTopY(h) {
    return COFFEE_FLOOR_Y + COFFEE_FULL_HEIGHT * h;
  }

  function setCoffeeHeight(h) {
    h = THREE.MathUtils.clamp(h, 0, 1);
    coffeeBody.visible = h > 0.004;
    coffeeBody.scale.y = Math.max(h, 0.004);
    coffeeBody.position.y = COFFEE_FLOOR_Y + (COFFEE_FULL_HEIGHT * h) / 2;
    var topY = coffeeTopY(h) + 0.006;
    coffeeTopPlain.visible = h > 0.03;
    coffeeTopPlain.position.y = topY;
    coffeeTopLatte.visible = h > 0.03;
    coffeeTopLatte.position.y = topY + 0.004;
  }
  setCoffeeHeight(0);

  // --- Milk stream: a curved tube that fades in and out during the pour,
  // arcing in from the same side a barista would pour from. It's never
  // hidden outside the pour, only faded to opacity 0 — depthWrite: false
  // keeps it from still writing to the depth buffer while invisible,
  // which otherwise silently occluded the sugar cube falling behind it.
  var milkStreamMat = new THREE.MeshPhysicalMaterial({
    color: 0xf6efe1, roughness: 0.2, metalness: 0, transparent: true, opacity: 0, depthWrite: false
  });
  var milkStream = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.7, 2.7, 0.7),
    new THREE.Vector3(-1.0, 1.7, 0.45),
    new THREE.Vector3(-0.15, 0.75, 0.08)
  ]), 28, 0.05, 10, false), milkStreamMat);
  group.add(milkStream);

  // --- Sugar cube + ripple ring, for the final touch. Sized well past a
  // literal sugar cube's true scale relative to the cup — true-to-scale
  // projects to only a handful of pixels on this canvas and reads as
  // nothing at all rather than a deliberate beat in the sequence.
  var sugar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), new THREE.MeshPhysicalMaterial({
    color: 0xfaf6ef, roughness: 0.55, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.4
  }));
  sugar.castShadow = true;
  sugar.visible = false;
  group.add(sugar);

  var ripple = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.09, 32), new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
  }));
  ripple.rotation.x = -Math.PI / 2;
  group.add(ripple);

  group.position.y = -0.05;
  group.scale.setScalar(0.74);

  function resetFinale() {
    setCoffeeHeight(0);
    coffeeTopLatte.material.opacity = 0;
    milkStreamMat.opacity = 0;
    sugar.visible = false;
    ripple.material.opacity = 0;
  }

  function tween(durationSec, onStep, onDone) {
    /* Clamp per-frame, like the grinder's dt — otherwise a stalled frame
       (tab backgrounded, a GC pause) hands the next callback a huge
       real-time gap and the whole "make the whole coffee" chain — each
       phase completing synchronously inside the last one's onDone — can
       cascade straight to "done" in a single frame instead of animating
       through brew, pour and sugar in turn. */
    var elapsed = 0;
    var last = null;
    function step(now) {
      if (last === null) last = now;
      elapsed += Math.min((now - last) / 1000, 1 / 20);
      last = now;
      var t = Math.min(1, elapsed / durationSec);
      onStep(t);
      if (t < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  }

  function brewCoffee(durationSec, onDone) {
    tween(durationSec, function (t) { setCoffeeHeight(t); }, onDone);
  }

  function pourMilk(durationSec, onDone) {
    tween(durationSec, function (t) {
      milkStreamMat.opacity = Math.sin(Math.min(t, 1) * Math.PI) * 0.95;
      coffeeTopLatte.material.opacity = t;
    }, function () {
      milkStreamMat.opacity = 0;
      if (onDone) onDone();
    });
  }

  function dropSugar(onDone) {
    sugar.visible = true;
    var topY = coffeeTopY(1);
    var startX = 0.14, startZ = 0.06;
    sugar.position.set(startX, topY + 0.95, startZ);
    sugar.scale.setScalar(1);
    tween(0.42, function (t) {
      sugar.position.y = THREE.MathUtils.lerp(topY + 0.95, topY + 0.03, t * t);
    }, function () {
      ripple.position.set(startX, topY + 0.012, startZ);
      ripple.material.opacity = 0.9;
      ripple.scale.setScalar(0.3);
      tween(0.5, function (t) {
        ripple.scale.setScalar(0.3 + t * 1.7);
        ripple.material.opacity = 0.9 * (1 - t);
      });
      tween(0.7, function (t) {
        sugar.scale.setScalar(1 - t);
        sugar.position.y = topY + 0.03 - t * 0.05;
      }, function () {
        sugar.visible = false;
        if (onDone) onDone();
      });
    });
  }

  function resize() {
    var w = container.clientWidth || 1;
    var h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  var state = { running: true };

  if (reduceMotion) {
    renderer.render(scene, camera);
    return {
      brewCoffee: function (d, cb) { if (cb) cb(); },
      pourMilk: function (d, cb) { if (cb) cb(); },
      dropSugar: function (cb) { if (cb) cb(); },
      resetFinale: function () {}
    };
  }

  var clock = new THREE.Clock();
  function animate() {
    if (!state.running) return;
    requestAnimationFrame(animate);
    clock.getDelta();
    renderer.render(scene, camera);
  }
  watchVisibility(state, clock, animate);
  animate();

  return { brewCoffee: brewCoffee, pourMilk: pourMilk, dropSugar: dropSugar, resetFinale: resetFinale };
}

/* ============================================================
   Bootstrap + "Make the whole coffee" orchestrator.
   Runs the grinder, the steam pitcher and the finale cup back to back as
   one sequence, driven by the button in the finale panel rather than by
   scroll — each scene's controller (returned above) exposes exactly the
   hooks this needs and nothing else.
   ============================================================ */
var grinderCanvas = document.getElementById("grinderCanvas");
var milkCanvas = document.getElementById("milkCanvas");
var cupCanvas = document.getElementById("cupCanvas");
var grinder = grinderCanvas ? initGrinder(grinderCanvas) : null;
var milk = milkCanvas ? initMilk(milkCanvas) : null;
var finale = cupCanvas ? initFinale(cupCanvas) : null;

(function wireBrewAll() {
  var button = document.getElementById("brewAllButton");
  if (!button || !grinder || !milk || !finale) return;
  var label = button.querySelector("[data-brew-label]");
  var running = false;

  function setLabel(key, fallback) {
    if (!label) return;
    label.setAttribute("data-i18n", key);
    var dict = window.CRCi18n && window.CRCi18n.strings;
    var lang = document.documentElement.getAttribute("lang") || "en";
    var text = dict && dict[lang] && dict[lang][key];
    label.textContent = text || fallback;
  }

  function run() {
    if (running) return;
    running = true;
    button.disabled = true;

    finale.resetFinale();
    milk.resetMilk();

    setLabel("process.brewAllGrinding", "Grinding the beans…");
    grinder.runGrind(function () {
      setLabel("process.brewAllBrewing", "Brewing…");
      finale.brewCoffee(2.2, function () {
        setLabel("process.brewAllSteaming", "Steaming the milk…");
        milk.autoFill(2.6, function () {
          setLabel("process.brewAllPouring", "Pouring it in…");
          finale.pourMilk(1.6, function () {
            setLabel("process.brewAllSugar", "Adding sugar…");
            finale.dropSugar(function () {
              setLabel("process.brewAllDone", "Enjoy! Make it again?");
              button.disabled = false;
              running = false;
            });
          });
        });
      });
    });
  }

  button.addEventListener("click", run);
})();
