/* Chateau de Rockville Cafe — the iced drinks from the café's own menu
   board, built as clear tapered cups with a domed lid, layered liquid,
   ice breaking the surface, a piped cream cap or garnish, and the CHATEAU
   mark printed on the front.

   The cup wall is a single open surface rather than a thickness-carrying
   lathe: it is transparent either way, so the extra wall buys nothing
   visible and only gives the depth sort more coincident faces to get
   wrong.

   Everything the eye is meant to read sits at or above the liquid's top
   disc. The liquid column is opaque, so anything placed inside its radius
   below that disc is simply not on screen — the ice used to be scattered
   through the column and was invisible for exactly that reason. */
import * as THREE from "./vendor/three.module.min.js";

var CUP_BOTTOM = -1.09, CUP_TOP = 1.09;
var CUP_R_BOTTOM = 0.62, CUP_R_TOP = 0.95;
var DOME_R = 0.93, DOME_SQUASH = 0.60;
var DOME_RISE = DOME_R * DOME_SQUASH;
var LIQ_TOP = 0.94, LIQ_BOTTOM = -1.03;

function cupRadiusAt(y) {
  return CUP_R_BOTTOM + (y - CUP_BOTTOM) / (CUP_TOP - CUP_BOTTOM) * (CUP_R_TOP - CUP_R_BOTTOM);
}

/* Free height under the lid at `y`, so a cream swirl or a garnish can be
   sized to clear the dome instead of poking through it. */
function domeRadiusAt(y) {
  var dy = y - CUP_TOP;
  if (dy <= 0) return cupRadiusAt(y);
  if (dy >= DOME_RISE) return 0;
  return DOME_R * Math.sqrt(1 - (dy / DOME_RISE) * (dy / DOME_RISE));
}

/* Layers run top-to-bottom, matching how the drink is built in the cup and
   how the canvas is drawn; three.js flips textures, so canvas row 0 lands
   at the top of the cylinder.

   `bleeds` mark the fractions where two layers were poured into each other
   rather than settling clean — those boundaries get a wavy, feathered edge
   so the column reads as a poured drink instead of a linear ramp. */
export var DRINKS = [
  {
    id: "soda",
    key: "hero.drinkSoda",
    name: "Soda Cream Latte",
    layers: [
      [0.00, "#efe0c6"], [0.09, "#c9873f"], [0.17, "#6d3a13"], [0.40, "#3f1e08"],
      [0.46, "#e8e0d0"], [0.62, "#f6f3ec"], [0.69, "#6fd0ef"], [1.00, "#0f9ad4"]
    ],
    bleeds: [0.43, 0.66],
    fizz: true,
    cream: { color: 0xfbf5e8, dust: 0x6b3d18 },
    straw: null,
    garnish: null
  },
  {
    id: "lemonade",
    key: "hero.drinkLemonade",
    name: "Cherry Lemonade",
    layers: [
      [0.00, "#8d59d8"], [0.20, "#6229c6"], [0.40, "#a755bb"], [0.50, "#f2dee6"],
      [0.60, "#f2687f"], [0.80, "#dd0f34"], [1.00, "#95061f"]
    ],
    bleeds: [0.46, 0.56],
    fizz: true,
    cream: null,
    straw: 0xd8213f,
    garnish: "cherry"
  },
  {
    id: "blossom",
    key: "hero.drinkBlossom",
    name: "Cherry Blossom Latte",
    layers: [
      [0.00, "#fdf3e8"], [0.11, "#f8bacf"], [0.32, "#f294b3"], [0.58, "#ef82a6"],
      [0.74, "#f8d6c2"], [1.00, "#fcefdd"]
    ],
    bleeds: [0.13, 0.72],
    fizz: false,
    cream: { color: 0xfdf6ef, dust: 0xe07396 },
    straw: null,
    garnish: "blossom"
  }
];

/* ---- Textures ---- */

/* The gradient alone reads as a printed ramp. Wavy feathered boundaries and
   a scatter of bubbles give the column the unevenness of a real pour. The
   canvas wraps the cylinder, so every horizontal wave uses whole-number
   harmonics of the width and meets itself cleanly at the seam. */
function makeLayerTexture(drink) {
  var w = 256, h = 1024;
  var c = document.createElement("canvas");
  c.width = w; c.height = h;
  var ctx = c.getContext("2d");

  var g = ctx.createLinearGradient(0, 0, 0, h);
  for (var i = 0; i < drink.layers.length; i++) g.addColorStop(drink.layers[i][0], drink.layers[i][1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  function wave(x, k1, k2, p1, p2, amp) {
    return (Math.sin(x / w * Math.PI * 2 * k1 + p1) * 0.62 +
            Math.sin(x / w * Math.PI * 2 * k2 + p2) * 0.38) * amp;
  }

  /* Feathered boundaries: tongues of each layer licking across the line
     into the other, in a few low-alpha passes at shrinking amplitude.

     Every one of these ribbons is closed against a straight edge one
     `reach` away from the boundary, never against the top or bottom of the
     canvas. Closing against the canvas edge instead fills the whole half
     with one flat near-boundary colour, and at these alphas that erases the
     layers the gradient just laid down — the espresso and the deep berry
     both washed out to a single pale tan that way. */
  var bleeds = drink.bleeds || [];
  for (var b = 0; b < bleeds.length; b++) {
    var yc = bleeds[b] * h;
    var above = colorAt(drink.layers, bleeds[b] - 0.06);
    var below = colorAt(drink.layers, bleeds[b] + 0.06);
    var p1 = b * 2.1, p2 = b * 3.7 + 1.2;
    var reach = h * 0.032;
    for (var pass = 0; pass < 4; pass++) {
      var amp = reach * (1 - pass * 0.22);
      ctx.globalAlpha = 0.32;

      ctx.fillStyle = below;
      ctx.beginPath();
      ctx.moveTo(0, yc + reach);
      for (var x = 0; x <= w; x++) ctx.lineTo(x, yc - wave(x, 3, 5, p1 + pass * 0.5, p2, amp));
      ctx.lineTo(w, yc + reach);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = above;
      ctx.beginPath();
      ctx.moveTo(0, yc - reach);
      for (var x2 = 0; x2 <= w; x2++) ctx.lineTo(x2, yc + wave(x2, 2, 4, p1 + 2.4 - pass * 0.5, p2 + 1.1, amp));
      ctx.lineTo(w, yc - reach);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Bubbles clinging to the inside of the wall.
  if (drink.fizz) {
    for (var k = 0; k < 260; k++) {
      var bx = Math.random() * w;
      var by = h * (0.30 + Math.random() * 0.70);
      var br = 1.2 + Math.random() * 3.4;
      ctx.globalAlpha = 0.10 + Math.random() * 0.22;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Soft vertical streaking — light running down the curved wall.
  for (var s = 0; s < 26; s++) {
    var sx = Math.random() * w;
    var sw = 3 + Math.random() * 12;
    ctx.globalAlpha = 0.05 + Math.random() * 0.05;
    ctx.fillStyle = Math.random() < 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(sx, 0, sw, h);
  }
  ctx.globalAlpha = 1;

  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// Nearest defined layer colour at a fraction — enough for feathering, which
// only ever samples just above and below a boundary.
function colorAt(layers, f) {
  var best = layers[0], bd = Infinity;
  for (var i = 0; i < layers.length; i++) {
    var d = Math.abs(layers[i][0] - f);
    if (d < bd) { bd = d; best = layers[i]; }
  }
  return best[1];
}

/* The storefront sign: CHATEAU in a heavy condensed grotesque over a rule,
   with BAKERY · CAFE · DESSERT on the bar beneath it. */
function makeLogoTexture() {
  var w = 512, h = 256;
  var c = document.createElement("canvas");
  c.width = w; c.height = h;
  var ctx = c.getContext("2d");
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  /* Set the largest size at or below `px` that keeps the line inside
     `maxW`. Anton is far narrower than the fallbacks, so a size chosen to
     look right in Anton overruns the texture the moment it is drawn in
     system-ui — and the first paint always is. */
  function fitted(text, px, spacing, maxW) {
    for (var size = px; size > 8; size -= 1) {
      ctx.font = size + "px Anton, 'Arial Narrow', system-ui, sans-serif";
      try { ctx.letterSpacing = spacing + "px"; } catch (e) { /* ignored */ }
      var measured = ctx.measureText(text).width;
      // Engines without letterSpacing support leave it out of the measure.
      if (!("letterSpacing" in ctx)) measured += spacing * (text.length - 1);
      if (measured <= maxW) break;
    }
  }

  function paint() {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.fillStyle = "#141414";

    fitted("CHATEAU", 108, 4, w * 0.82);
    ctx.fillText("CHATEAU", w / 2, 124);

    ctx.fillRect(w * 0.13, 146, w * 0.74, 5);

    fitted("BAKERY · CAFE · DESSERT", 34, 5, w * 0.72);
    ctx.fillText("BAKERY · CAFE · DESSERT", w / 2, 196);

    tex.needsUpdate = true;
  }

  paint();
  /* Canvas takes whatever the font stack resolves to at the moment it
     draws, and a webfont that is still downloading silently resolves to
     the fallback — so paint once for the immediate frame, then again once
     Anton is actually available. */
  if (document.fonts && document.fonts.load) {
    document.fonts.load("108px Anton").then(paint).catch(function () { /* fallback stands */ });
  }
  return tex;
}

/* ---- Parts ---- */

/* Piped cream, as a run of overlapping spheres climbing a tightening helix.
   TubeGeometry carries one radius for its whole length, which gives a
   uniform rope rather than a swirl that tapers to a peak. */
function makeCreamCap(color, dust) {
  var group = new THREE.Group();
  var N = 34;
  var mat = new THREE.MeshPhysicalMaterial({
    color: color, roughness: 0.62, metalness: 0, clearcoat: 0.25, envMapIntensity: 0.5
  });
  var mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), mat, N);
  var m = new THREE.Matrix4(), q = new THREE.Quaternion();
  var p = new THREE.Vector3(), s = new THREE.Vector3();

  for (var i = 0; i < N; i++) {
    var f = i / (N - 1);
    var y = 0.88 + f * 0.42;
    var swirlR = 0.46 * Math.pow(1 - f, 0.75);
    var a = f * Math.PI * 3.4;
    var blob = 0.26 * (1 - f * 0.72);
    // Never let a blob's outer edge cross the lid.
    var lid = domeRadiusAt(y) - 0.06;
    if (swirlR + blob > lid) swirlR = Math.max(0, lid - blob);
    p.set(Math.cos(a) * swirlR, y, Math.sin(a) * swirlR);
    s.set(blob, blob * 0.85, blob);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);

  // A dusting over the peak — cocoa on the soda latte, freeze-dried
  // raspberry on the blossom.
  var dustMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 6, 5),
    new THREE.MeshStandardMaterial({ color: dust, roughness: 0.9, envMapIntensity: 0.2 }),
    46
  );
  for (var d = 0; d < 46; d++) {
    var da = Math.random() * Math.PI * 2;
    var dr = Math.pow(Math.random(), 0.6) * 0.30;
    var dy = 1.26 - dr * 0.55 + Math.random() * 0.05;
    p.set(Math.cos(da) * dr, dy, Math.sin(da) * dr);
    var ds = 0.016 + Math.random() * 0.022;
    s.set(ds, ds * 0.6, ds);
    m.compose(p, q, s);
    dustMesh.setMatrixAt(d, m);
  }
  dustMesh.instanceMatrix.needsUpdate = true;
  group.add(dustMesh);

  return group;
}

function makeCherry(y) {
  var group = new THREE.Group();
  var berry = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 18),
    new THREE.MeshPhysicalMaterial({
      color: 0xb3132c, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06
    })
  );
  berry.scale.y = 0.92;
  group.add(berry);

  var stem = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.15, 0),
        new THREE.Vector3(0.06, 0.34, 0.02),
        new THREE.Vector3(0.19, 0.46, 0.05),
        new THREE.Vector3(0.34, 0.44, 0.04)
      ]), 20, 0.017, 8, false
    ),
    new THREE.MeshStandardMaterial({ color: 0x4c6b2b, roughness: 0.7 })
  );
  group.add(stem);

  // Away from the straw, which leans out over +X and would otherwise stand
  // directly in front of the berry.
  group.position.set(-0.31, y, 0.22);
  group.rotation.y = -0.5;
  return group;
}

function makeBlossom(y) {
  var group = new THREE.Group();
  /* The flower ends up at roughly the camera's own height, so much of what
     is on screen is the underside of the petals — away from every light in
     the scene, which renders them a muddy brown against the white cream.
     A petal is thin and translucent and does glow when it is lit from the
     other side, so the emissive both fixes the read and is what the real
     thing does. */
  var petalMat = new THREE.MeshPhysicalMaterial({
    color: 0xfcdae5, roughness: 0.5, metalness: 0, side: THREE.DoubleSide,
    emissive: 0xf3a6bf, emissiveIntensity: 0.42,
    clearcoat: 0.3, envMapIntensity: 0.4
  });

  /* One petal: narrow at the base, widest about a third out, rounded at the
     tip. Wound counter-clockwise so ShapeGeometry's normals face +Z and the
     petal is lit once it is laid flat. Pinching the tip inward toward the
     centre gives a heart, not a petal — five of those overlap into an
     unreadable dark knot. */
  var shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.13, 0.05, 0.15, 0.21, 0.05, 0.30);
  shape.bezierCurveTo(0.02, 0.33, -0.02, 0.33, -0.05, 0.30);
  shape.bezierCurveTo(-0.15, 0.21, -0.13, 0.05, 0, 0);
  var petalGeo = new THREE.ShapeGeometry(shape, 16);

  /* Cupped well up off the horizontal rather than laid open. A flat flower
     on a cup that turns goes exactly edge-on twice a revolution and reads
     as a stray sliver; angling the petals gives it depth from any azimuth,
     the way a real blossom holds its shape. */
  for (var i = 0; i < 5; i++) {
    var petal = new THREE.Mesh(petalGeo, petalMat);
    // Y before X: lay the petal back, then swing it round to its own
    // compass point rather than spinning it in its own plane.
    petal.rotation.order = "YXZ";
    petal.rotation.set(-Math.PI / 2 + 0.70, (i / 5) * Math.PI * 2, 0);
    group.add(petal);
  }

  var centre = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf6d98a, roughness: 0.6 })
  );
  centre.position.y = 0.02;
  group.add(centre);

  // Seated on the crown of the cream swirl, which is why the swirl is
  // piped a little lower than it would be on its own — the flower has to
  // sit on top of it and still clear the dome.
  group.position.set(0, y, 0);
  group.scale.setScalar(0.66);
  return group;
}

export function makeDrinkMesh(drink) {
  var group = new THREE.Group();

  /* The wall used to be a bright, near-opaque white plastic — 0.24 opacity
     with clearcoat and a strong environment on top of it. Stacked over the
     liquid it drained the colour out of every drink. It is glass: it should
     mostly be a rim highlight, not a coat of paint. */
  var plastic = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.05, metalness: 0,
    transparent: true, opacity: 0.13,
    clearcoat: 1, clearcoatRoughness: 0.03,
    side: THREE.DoubleSide, envMapIntensity: 0.7, depthWrite: false
  });

  // --- Liquid, poured in layers. Drawn before the cup so the transparent
  // wall sorts in front of it. Low specular response so the layer colours
  // survive the scene's warm key light and the ACES curve.
  var rTop = cupRadiusAt(LIQ_TOP) - 0.025, rBot = cupRadiusAt(LIQ_BOTTOM) - 0.025;
  var liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, LIQ_TOP - LIQ_BOTTOM, 56, 1, true),
    new THREE.MeshPhysicalMaterial({
      map: makeLayerTexture(drink), roughness: 0.42, metalness: 0,
      clearcoat: 0.22, clearcoatRoughness: 0.3, envMapIntensity: 0.22
    })
  );
  liquid.position.y = (LIQ_TOP + LIQ_BOTTOM) / 2;
  group.add(liquid);

  // The cylinder's end caps take a disc UV that would sample the middle of
  // the gradient, so the visible surface is its own disc at the top colour.
  var surface = new THREE.Mesh(
    new THREE.CircleGeometry(rTop, 56),
    new THREE.MeshPhysicalMaterial({
      color: drink.layers[0][1], roughness: 0.34, clearcoat: 0.5, envMapIntensity: 0.35
    })
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = LIQ_TOP;
  group.add(surface);

  // --- Ice, breaking the surface. Cubes fully below LIQ_TOP would sit
  // inside an opaque column and never be drawn, so they straddle the disc.
  var iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xeaf7fd, roughness: 0.08, metalness: 0,
    transparent: true, opacity: 0.36, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 0.9, depthWrite: false
  });
  var ICE = 11;
  var ice = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), iceMat, ICE);
  var im = new THREE.Matrix4(), iq = new THREE.Quaternion(), ie = new THREE.Euler();
  var ip = new THREE.Vector3(), is = new THREE.Vector3();
  for (var i = 0; i < ICE; i++) {
    var iy = LIQ_TOP - 0.10 + Math.random() * 0.26;
    var ir = Math.sqrt(Math.random()) * (cupRadiusAt(iy) - 0.30);
    var ia = Math.random() * Math.PI * 2;
    ip.set(Math.cos(ia) * ir, iy, Math.sin(ia) * ir);
    ie.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    iq.setFromEuler(ie);
    var sc = 0.21 + Math.random() * 0.12;
    is.set(sc, sc * (0.7 + Math.random() * 0.5), sc * (0.8 + Math.random() * 0.4));
    im.compose(ip, iq, is);
    ice.setMatrixAt(i, im);
  }
  ice.instanceMatrix.needsUpdate = true;
  group.add(ice);

  // --- Cream cap and garnish, under the dome
  if (drink.cream) group.add(makeCreamCap(drink.cream.color, drink.cream.dust));
  if (drink.garnish === "cherry") group.add(makeCherry(1.12));
  if (drink.garnish === "blossom") group.add(makeBlossom(1.37));

  // --- Cup wall and base
  var wall = new THREE.Mesh(
    new THREE.CylinderGeometry(CUP_R_TOP, CUP_R_BOTTOM, CUP_TOP - CUP_BOTTOM, 56, 1, true),
    plastic
  );
  group.add(wall);

  var base = new THREE.Mesh(new THREE.CircleGeometry(CUP_R_BOTTOM, 48), plastic);
  base.rotation.x = Math.PI / 2;
  base.position.y = CUP_BOTTOM;
  group.add(base);

  // --- Condensation, beaded on the outside of a cold cup: small droplets
  // squashed flat against the wall so each one catches the key light.
  var dropMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.02, metalness: 0,
    transparent: true, opacity: 0.24, clearcoat: 1,
    envMapIntensity: 1.5, depthWrite: false
  });
  var DROPS = 130;
  var drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), dropMat, DROPS);
  for (var d = 0; d < DROPS; d++) {
    var dy = CUP_BOTTOM + 0.08 + Math.random() * (CUP_TOP - CUP_BOTTOM - 0.2);
    var da = Math.random() * Math.PI * 2;
    var dr = cupRadiusAt(dy) + 0.006;
    ip.set(Math.cos(da) * dr, dy, Math.sin(da) * dr);
    // Local +X points outward once the instance is turned by -angle.
    ie.set(0, -da, 0);
    iq.setFromEuler(ie);
    var ds = 0.009 + Math.pow(Math.random(), 2) * 0.019;
    is.set(ds * 0.42, ds * (1 + Math.random() * 1.1), ds);
    im.compose(ip, iq, is);
    drops.setMatrixAt(d, im);
  }
  drops.instanceMatrix.needsUpdate = true;
  group.add(drops);

  // --- Printed mark, on a band that follows the cup's taper so it neither
  // sinks into the wall at the top nor lifts off it at the bottom.
  var bandTop = 0.28, bandBottom = -0.30;
  var band = new THREE.Mesh(
    new THREE.CylinderGeometry(
      cupRadiusAt(bandTop) + 0.012, cupRadiusAt(bandBottom) + 0.012,
      bandTop - bandBottom, 40, 1, true, -0.78, 1.56
    ),
    new THREE.MeshStandardMaterial({
      map: makeLogoTexture(), transparent: true, roughness: 0.45,
      side: THREE.DoubleSide, depthWrite: false
    })
  );
  band.position.y = (bandTop + bandBottom) / 2;
  group.add(band);

  // --- Domed lid: rolled flange, dome, and the cap on top
  var flange = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.055, 12, 48), plastic);
  flange.rotation.x = Math.PI / 2;
  flange.position.y = CUP_TOP;
  group.add(flange);

  var dome = new THREE.Mesh(
    new THREE.SphereGeometry(DOME_R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    plastic
  );
  dome.scale.y = DOME_SQUASH;
  dome.position.y = CUP_TOP;
  group.add(dome);

  // With a straw the cap is a ring the straw passes through; without one it
  // is the flat disc the lid is moulded with.
  var cap = new THREE.Mesh(
    drink.straw ? new THREE.RingGeometry(0.14, 0.30, 32) : new THREE.CircleGeometry(0.30, 32),
    plastic
  );
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = CUP_TOP + DOME_RISE;
  group.add(cap);

  if (drink.straw) {
    /* Tilted, and threaded through the cap hole: the axis is placed so it
       passes exactly through the centre of the hole, then the cylinder is
       slid along that axis until it reaches from the drink to well clear of
       the lid. */
    var tilt = 0.28;
    var dir = new THREE.Vector3(Math.sin(tilt), Math.cos(tilt), 0);
    var pivotY = CUP_TOP + DOME_RISE;
    var t0 = (-0.55 - pivotY) / dir.y, t1 = (2.28 - pivotY) / dir.y;
    var straw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, t1 - t0, 20, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: drink.straw, roughness: 0.24, metalness: 0,
        clearcoat: 0.9, side: THREE.DoubleSide, envMapIntensity: 0.7
      })
    );
    straw.rotation.z = -tilt;
    straw.position.set(dir.x * (t0 + t1) / 2, pivotY + dir.y * (t0 + t1) / 2, 0);
    group.add(straw);
  }

  group.userData.drink = drink;
  return group;
}
