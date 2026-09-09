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

  /* A real bean isn't a symmetric ellipsoid with a ridge stuck on top —
     it has one rounded, convex back and one flatter belly with a
     lengthwise groove actually cut into it. Sculpting that into the
     geometry itself (instead of gluing a raised capsule onto a plain
     ellipsoid) is what makes it read as a bean instead of a pebble with
     a seam on it. */
  var bodyGeo = new THREE.SphereGeometry(0.5, 32, 24);
  var pos = bodyGeo.attributes.position;
  var v = new THREE.Vector3();
  for (var i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Gentle asymmetric bulge so the silhouette isn't a perfect ellipsoid
    var bulge = 1 + 0.05 * Math.sin(v.y * 6) * Math.max(0, v.z);
    v.x *= bulge;
    v.z *= bulge;

    if (v.z > 0) {
      // Flatten the belly side relative to the rounded back
      v.z *= 0.72;
      // Carve the groove: a narrow dip along x=0 that fades out near the
      // two tips (y near ±0.5), only on the flattened belly face
      var seam = Math.exp(-(v.x * v.x) / (2 * 0.018));
      var tipFalloff = Math.max(0, 1 - Math.pow(Math.abs(v.y) * 1.9, 2));
      v.z -= 0.1 * seam * tipFalloff * Math.max(0, v.z);
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  bodyGeo.computeVertexNormals();

  var body = new THREE.Mesh(bodyGeo, material);
  body.scale.set(1, 0.66, 0.8);
  body.castShadow = true;
  bean.add(body);

  // A thin dark line sitting in the carved groove for contrast — not a
  // raised ridge, since the groove is now real geometry underneath it.
  var crease = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.4, 4, 8), creaseMaterial);
  crease.rotation.z = Math.PI / 2;
  crease.position.z = 0.5 * 0.72 * 0.8 * 0.86;
  bean.add(crease);

  return bean;
}
