/* Shared coffee-bean geometry/material helpers — used by the falling-beans
   scene (Our Story) and the grinder scene (The Process), so the two don't
   drift out of sync with duplicated code. */
import * as THREE from "./vendor/three.module.min.js";

// Procedural roast-skin bump map: real beans have a mottled, slightly
// wrinkled surface, not a smooth plastic one. No texture asset exists for
// this (nothing in the project's skills ships bean photos/normal maps), so
// this fakes the height variation with layered soft noise blotches.
export function makeRoastBumpTexture() {
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

var ROAST_COLORS = [0x6b4527, 0x5a3a22, 0x4d3019, 0x432a18, 0x3a2314];

export function makeBeanMaterial(roastBump, index) {
  var base = new THREE.Color(ROAST_COLORS[index % ROAST_COLORS.length]);
  base.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
  var oily = Math.random() < 0.4;
  return new THREE.MeshPhysicalMaterial({
    color: base,
    roughness: oily ? 0.28 : 0.5,
    metalness: 0.0,
    clearcoat: oily ? 0.7 : 0.3,
    clearcoatRoughness: oily ? 0.15 : 0.35,
    bumpMap: roastBump,
    bumpScale: 0.012
  });
}

export function makeCreaseMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x1c0f06, roughness: 0.75 });
}

export function makeBeanMesh(material, creaseMaterial) {
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

  var crease = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.48, 4, 8), creaseMaterial);
  crease.rotation.z = Math.PI / 2;
  crease.position.z = 0.39;
  bean.add(crease);

  return bean;
}
