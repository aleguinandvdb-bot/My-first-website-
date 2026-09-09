/* Chateau de Rockville Cafe — the iced drinks from the café's own menu
   board, built as clear tapered cups with a domed lid, layered liquid and
   the CHATEAU mark printed on the front.

   The cup wall is a single open surface rather than a thickness-carrying
   lathe: it is transparent either way, so the extra wall buys nothing
   visible and only gives the depth sort more coincident faces to get
   wrong. */
import * as THREE from "./vendor/three.module.min.js";

var CUP_BOTTOM = -1.09, CUP_TOP = 1.09;
var CUP_R_BOTTOM = 0.62, CUP_R_TOP = 0.95;
var DOME_RISE = 0.93 * 0.60;

function cupRadiusAt(y) {
  return CUP_R_BOTTOM + (y - CUP_BOTTOM) / (CUP_TOP - CUP_BOTTOM) * (CUP_R_TOP - CUP_R_BOTTOM);
}

/* Layers run top-to-bottom, matching how the drink is built in the cup and
   how the canvas is drawn; three.js flips textures, so canvas row 0 lands
   at the top of the cylinder. */
export var DRINKS = [
  {
    id: "soda",
    key: "hero.drinkSoda",
    name: "Soda Cream Latte",
    layers: [
      [0.00, "#f7f1e4"], [0.13, "#e6d5b8"], [0.22, "#c99d60"], [0.44, "#b8823c"],
      [0.55, "#ded8cd"], [0.66, "#f1f4f4"], [0.79, "#a6dfef"], [1.00, "#74cde6"]
    ]
  },
  {
    id: "lemonade",
    key: "hero.drinkLemonade",
    name: "Cherry Lemonade",
    layers: [
      [0.00, "#6d51ba"], [0.27, "#5b3f9d"], [0.45, "#b087c6"], [0.55, "#efdfe4"],
      [0.66, "#e79ea8"], [0.82, "#c22239"], [1.00, "#a5122a"]
    ]
  },
  {
    id: "blossom",
    key: "hero.drinkBlossom",
    name: "Cherry Blossom Latte",
    layers: [
      [0.00, "#f7efe4"], [0.10, "#f3cbd5"], [0.30, "#eeafc0"], [0.58, "#f0bcc8"],
      [0.73, "#f6ead9"], [1.00, "#f9f1e2"]
    ]
  }
];

function makeLayerTexture(layers) {
  var w = 16, h = 512;
  var c = document.createElement("canvas");
  c.width = w; c.height = h;
  var ctx = c.getContext("2d");
  var g = ctx.createLinearGradient(0, 0, 0, h);
  for (var i = 0; i < layers.length; i++) g.addColorStop(layers[i][0], layers[i][1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeLogoTexture() {
  var w = 512, h = 256;
  var c = document.createElement("canvas");
  c.width = w; c.height = h;
  var ctx = c.getContext("2d");
  ctx.textAlign = "center";
  ctx.fillStyle = "#141414";

  ctx.font = "700 92px 'IBM Plex Sans', system-ui, sans-serif";
  try { ctx.letterSpacing = "2px"; } catch (e) { /* older engines ignore it */ }
  ctx.fillText("CHATEAU", w / 2, 118);

  ctx.fillRect(w * 0.16, 138, w * 0.68, 5);

  ctx.font = "600 34px 'IBM Plex Sans', system-ui, sans-serif";
  try { ctx.letterSpacing = "5px"; } catch (e) { /* ignore */ }
  ctx.fillText("BAKERY & COFFEE", w / 2, 186);

  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function makeDrinkMesh(drink) {
  var group = new THREE.Group();

  var plastic = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.06, metalness: 0,
    transparent: true, opacity: 0.24,
    clearcoat: 1, clearcoatRoughness: 0.04,
    side: THREE.DoubleSide, envMapIntensity: 1.6, depthWrite: false
  });

  // --- Liquid, poured in layers. Drawn before the cup so the transparent
  // wall sorts in front of it.
  var liqTop = 0.94, liqBottom = -1.03;
  var rTop = cupRadiusAt(liqTop) - 0.025, rBot = cupRadiusAt(liqBottom) - 0.025;
  var liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, liqTop - liqBottom, 56, 1, true),
    new THREE.MeshPhysicalMaterial({
      map: makeLayerTexture(drink.layers), roughness: 0.22, metalness: 0,
      clearcoat: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.9
    })
  );
  liquid.position.y = (liqTop + liqBottom) / 2;
  group.add(liquid);

  // The cylinder's end caps take a disc UV that would sample the middle of
  // the gradient, so the visible surface is its own disc at the top colour.
  var surface = new THREE.Mesh(
    new THREE.CircleGeometry(rTop, 56),
    new THREE.MeshPhysicalMaterial({ color: drink.layers[0][1], roughness: 0.45, clearcoat: 0.2 })
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = liqTop;
  group.add(surface);

  // --- Ice, sitting in the top third
  var iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xeaf6fb, roughness: 0.14, metalness: 0,
    transparent: true, opacity: 0.42, clearcoat: 1, envMapIntensity: 1.3, depthWrite: false
  });
  var ice = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), iceMat, 16);
  var im = new THREE.Matrix4(), iq = new THREE.Quaternion(), ie = new THREE.Euler();
  var ip = new THREE.Vector3(), is = new THREE.Vector3();
  for (var i = 0; i < 16; i++) {
    var iy = 0.18 + Math.random() * 0.68;
    var ir = Math.sqrt(Math.random()) * (cupRadiusAt(iy) - 0.24);
    var ia = Math.random() * Math.PI * 2;
    ip.set(Math.cos(ia) * ir, iy, Math.sin(ia) * ir);
    ie.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    iq.setFromEuler(ie);
    var sc = 0.20 + Math.random() * 0.13;
    is.set(sc, sc * (0.7 + Math.random() * 0.5), sc * (0.8 + Math.random() * 0.4));
    im.compose(ip, iq, is);
    ice.setMatrixAt(i, im);
  }
  ice.instanceMatrix.needsUpdate = true;
  group.add(ice);

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

  // --- Domed lid: rolled flange, dome, and the flat cap on top
  var flange = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.055, 12, 48), plastic);
  flange.rotation.x = Math.PI / 2;
  flange.position.y = CUP_TOP;
  group.add(flange);

  var dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.93, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    plastic
  );
  dome.scale.y = 0.60;
  dome.position.y = CUP_TOP;
  group.add(dome);

  var capDisc = new THREE.Mesh(new THREE.CircleGeometry(0.30, 32), plastic);
  capDisc.rotation.x = -Math.PI / 2;
  capDisc.position.y = CUP_TOP + DOME_RISE;
  group.add(capDisc);

  group.userData.drink = drink;
  return group;
}
