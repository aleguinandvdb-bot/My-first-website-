/* Chateau de Rockville Cafe — coffee beans tumbling down the "Our Story"
   panel, scroll-scrubbed: fall progress is driven directly by scroll
   position through the section, not by free-running physics. */
import * as THREE from "./vendor/three.module.min.js";
import { makeRoastBumpTexture, makeBeanMaterial, makeCreaseMaterial, makeBeanMesh } from "./bean-mesh.js";

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var canvas = document.getElementById("beansCanvas");

if (canvas) initScene(canvas, reduceMotion);

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
  var creaseMat = makeCreaseMaterial();

  var BEAN_COUNT = 8;
  var beans = [];

  for (var i = 0; i < BEAN_COUNT; i++) {
    var mat = makeBeanMaterial(roastBump, i);
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
