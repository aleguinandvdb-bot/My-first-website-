/* Chateau de Rockville Cafe — shared teal cup/saucer geometry.
   Used by both the hero scene and the finale "brew" cup so the two match.

   Profile is a wide, shallow cappuccino cup (matching the reference photo
   of the café's real cup) rather than a tall narrow mug: rim diameter
   noticeably larger than the cup's own height. Built as one revolved
   profile with real wall thickness (foot, belly, rolled lip, hollow
   interior) instead of a tapered cylinder, which read as a flowerpot. */
import * as THREE from "./vendor/three.module.min.js";

export var CUP_RIM_RADIUS = 1.08;
export var CUP_RIM_Y = 0.64;
export var CUP_INTERIOR_RADIUS = 0.93;
export var CUP_INTERIOR_TOP_Y = 0.60;
export var CUP_INTERIOR_FLOOR_Y = -0.58;

export function cupProfile() {
  return [
    [0.00, -0.78], // foot underside, center
    [0.42, -0.78], // foot outer edge
    [0.46, -0.72], // foot side wall
    [0.40, -0.66], // tuck under the body
    [0.58, -0.40], // body starts curving out
    [0.82, -0.05], // widening
    [0.98, 0.30],  // continuing flare
    [1.05, 0.55],  // near rim, widest point of the outer wall
    [1.08, 0.64],  // rim outer edge (slightly rolled bead)
    [1.00, 0.68],  // across the lip thickness
    [0.93, 0.60],  // start down the interior wall
    [0.85, 0.35],  // interior wall
    [0.72, 0.00],  // interior wall
    [0.60, -0.35], // interior wall, near the bottom
    [0.48, -0.58], // interior floor edge
    [0.00, -0.60]  // interior floor, center (closes the surface)
  ];
}

export function makeCupMesh(color) {
  var mat = new THREE.MeshPhysicalMaterial({
    color: color, roughness: 0.2, metalness: 0.0, clearcoat: 0.85, clearcoatRoughness: 0.1
  });
  var pts = cupProfile().map(function (p) { return new THREE.Vector2(p[0], p[1]); });
  var geo = new THREE.LatheGeometry(pts, 56);
  var mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeSaucerMesh(color) {
  var mat = new THREE.MeshPhysicalMaterial({
    color: color, roughness: 0.24, metalness: 0.0, clearcoat: 0.85, clearcoatRoughness: 0.1
  });
  var group = new THREE.Group();

  var plate = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.95, 0.14, 48), mat);
  plate.position.y = -0.86;
  plate.receiveShadow = true;
  group.add(plate);

  var rim = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.05, 12, 48), mat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.79;
  rim.receiveShadow = true;
  group.add(rim);

  return group;
}

// A smooth D-shaped handle along a curve, attached to the shoulder and
// belly of the new wider profile.
export function makeHandleMesh(color, metal) {
  /* TubeGeometry never caps its ends — they're open rings, so an endpoint
     that stops short of solid material shows as a floating gap. The lower
     attachment is the trap: this cup tucks sharply in toward its narrow
     foot, so at y=-0.22 the wall only spans radius 0.65..0.72 and the old
     endpoint at x=0.82 hung clear outside the cup altogether.

     Both ends now sit *inside the hollow interior* (radius below the inner
     wall), which is hidden by the opaque wall from the side and by the
     coffee disc from above, and the lower attachment has moved up to
     y=-0.05 where the body is still wide. Verified by projecting each end
     cap's rim against the lathe profile rather than by eye. */
  var curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.72, 0.42, 0),   // buried in the hollow interior
    new THREE.Vector3(1.01, 0.42, 0),   // exits through the outer wall
    new THREE.Vector3(1.42, 0.36, 0),
    new THREE.Vector3(1.55, 0.14, 0),
    new THREE.Vector3(1.40, -0.08, 0),
    new THREE.Vector3(0.84, -0.05, 0),  // re-enters at the outer wall
    new THREE.Vector3(0.58, -0.05, 0)   // buried in the hollow interior
  ]);
  var geo = new THREE.TubeGeometry(curve, 48, 0.095, 14, false);
  var mat = metal
    ? new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.22, metalness: 1, envMapIntensity: 1.4 })
    : new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.2, metalness: 0.0, clearcoat: 0.85, clearcoatRoughness: 0.1 });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}
