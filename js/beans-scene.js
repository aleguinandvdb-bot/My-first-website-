/* Chateau de Rockville Cafe — coffee beans tumbling down the "Our Story"
   panel, scroll-scrubbed: fall progress is driven directly by scroll
   position through the section, not by free-running physics. */
import * as THREE from "./vendor/three.module.min.js";

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var canvas = document.getElementById("beansCanvas");

if (canvas) initScene(canvas, reduceMotion);

// Procedural roast-skin bump map: real beans have a mottled, slightly
// wrinkled surface, not a smooth plastic one. No texture asset exists for
// this (nothing in the project's skills ships bean photos/normal maps), so
// this fakes the height variation with layered soft noise blotches.
function makeRoastBumpTexture() {
  var size = 256;
  var c = document.createElement("canvas");
  c.width = c.height = size;
  var ctx = c.getContext("2d");
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  for (var i = 0; i < 260; i++) {
    var r = 3 + Math.random() * 10;
    var x = Math.random() * size;
    var y = Math.random() * size;
    var v = Math.floor(90 + Math.random() * 90);
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(" + v + "," + v + "," + v + ",0.55)");
    g.addColorStop(1, "rgba(" + v + "," + v + "," + v + ",0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  var tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function makeBeanMesh(material, creaseMaterial) {
  var bean = new THREE.Group();

  // Slightly asymmetric ellipsoid (real beans aren't perfectly smooth ovals)
  var bodyGeo = new THREE.SphereGeometry(0.5, 24, 18);
  var pos = bodyGeo.attributes.position;
  for (var i = 0; i < pos.count; i++) {
    var nx = pos.getX(i), ny = pos.getY(i), nz = pos.getZ(i);
    var bulge = 1 + 0.05 * Math.sin(ny * 6) * Math.max(0, nz);
    pos.setX(i, nx * bulge);
    pos.setZ(i, nz * bulge);
  }
  bodyGeo.computeVertexNormals();

  var body = new THREE.Mesh(bodyGeo, material);
  body.scale.set(1, 0.66, 0.8);
  body.castShadow = true;
  bean.add(body);

  // The center crease — pinched deeper via a thin dark groove plus a
  // slightly recessed highlight-breaking capsule along the flat face.
  var crease = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.48, 4, 8), creaseMaterial);
  crease.rotation.z = Math.PI / 2;
  crease.position.z = 0.39;
  bean.add(crease);

  return bean;
}

function initScene(canvas, reduceMotion) {
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
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0.4, 9.5);
  camera.lookAt(0, 0, 0);

  var hemi = new THREE.HemisphereLight(0xfff1de, 0x4a3626, 0.85);
  scene.add(hemi);

  var key = new THREE.PointLight(0xffd9a8, 34, 20, 2);
  key.position.set(3, 4, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);

  var fill = new THREE.PointLight(0xff9d5c, 8, 16, 2);
  fill.position.set(-3, -1, 3);
  scene.add(fill);

  // A faint floor to catch shadows, matching the panel's own surface —
  // invisible itself (shadow-only material) so it never occludes the beans.
  var floorMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.35;
  floor.receiveShadow = true;
  scene.add(floor);

  var roastBump = makeRoastBumpTexture();
  var creaseMat = new THREE.MeshStandardMaterial({ color: 0x1c0f06, roughness: 0.75 });

  var BEAN_COUNT = 8;
  var beans = [];
  // Roasted beans vary bean-to-bean, not just in two fixed shades — random
  // walk the base roast color slightly for each one, oily sheen on some.
  var roastColors = [0x6b4527, 0x5a3a22, 0x4d3019, 0x432a18, 0x3a2314];

  for (var i = 0; i < BEAN_COUNT; i++) {
    var baseColor = new THREE.Color(roastColors[i % roastColors.length]);
    baseColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
    var oily = Math.random() < 0.4;
    var mat = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: oily ? 0.28 : 0.5,
      metalness: 0.0,
      clearcoat: oily ? 0.7 : 0.3,
      clearcoatRoughness: oily ? 0.15 : 0.35,
      bumpMap: roastBump,
      bumpScale: 0.012
    });
    var mesh = makeBeanMesh(mat, creaseMat);

    var startX = (Math.random() - 0.5) * 4.2;
    var startZ = (Math.random() - 0.5) * 2.2;
    var endX = startX + (Math.random() - 0.5) * 1.2;
    var endZ = startZ + (Math.random() - 0.5) * 0.8;

    var scale = 0.55 + Math.random() * 0.35;
    mesh.scale.setScalar(scale);

    var axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    var spin = 2.2 + Math.random() * 3.4;
    var idleSpeed = 0.15 + Math.random() * 0.3;

    scene.add(mesh);
    beans.push({
      mesh: mesh,
      startY: 3.2 + Math.random() * 1.6,
      endY: -1.6 + Math.random() * 0.9,
      startX: startX,
      endX: endX,
      startZ: startZ,
      endZ: endZ,
      axis: axis,
      spin: spin,
      idleSpeed: idleSpeed,
      phase: Math.random() * Math.PI * 2
    });
  }

  function layout(progress) {
    for (var i = 0; i < beans.length; i++) {
      var b = beans[i];
      // Beans don't all fall in lockstep — stagger each one's window within
      // the overall scroll range so it reads as a cascade, not a single row.
      var localStart = (i / beans.length) * 0.45;
      var localP = THREE.MathUtils.clamp((progress - localStart) / 0.55, 0, 1);
      var eased = 1 - Math.pow(1 - localP, 3);

      b.mesh.position.set(
        THREE.MathUtils.lerp(b.startX, b.endX, eased),
        THREE.MathUtils.lerp(b.startY, b.endY, eased),
        THREE.MathUtils.lerp(b.startZ, b.endZ, eased)
      );
      b.mesh.setRotationFromAxisAngle(b.axis, b.phase + eased * b.spin * Math.PI);
    }
  }

  var progress = reduceMotion ? 1 : 0;
  layout(progress);

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

  if (reduceMotion) {
    renderer.render(scene, camera);
    return; // static resting arrangement only — no scroll-scrub, no idle spin.
  }

  // ---- Scroll-scrubbed fall: progress is set directly by scroll position ----
  function bindScrollTrigger() {
    if (!window.gsap || !window.ScrollTrigger) {
      window.setTimeout(bindScrollTrigger, 150);
      return;
    }
    // Bound to the panel itself, not the whole (taller) story section —
    // otherwise the fall keeps progressing on a range longer than the
    // panel's own transit through the viewport, and never visibly finishes
    // before it scrolls out of view.
    window.ScrollTrigger.create({
      trigger: container,
      start: "top 90%",
      end: "bottom 30%",
      scrub: 0.6,
      onUpdate: function (self) {
        progress = self.progress;
      }
    });
  }
  bindScrollTrigger();

  // ---- Animation loop: scroll sets the fall, this adds a gentle idle tumble ----
  var clock = new THREE.Clock();
  var running = true;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    var dt = clock.getDelta();
    var t = clock.elapsedTime;

    for (var i = 0; i < beans.length; i++) {
      beans[i].phase += dt * beans[i].idleSpeed;
    }
    layout(progress);

    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      clock.getDelta();
      animate();
    }
  });

  animate();
}
