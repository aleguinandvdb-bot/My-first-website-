/* Chateau de Rockville Cafe — shared canvas textures for coffee surfaces.
   Used by both the hero cup and the finale cup so the two match. */
import * as THREE from "./vendor/three.module.min.js";

export function makeSoftDotTexture() {
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

// Plain black espresso with mottled crema — the coffee surface before milk
// is poured in.
export function makeCremaTexture() {
  var size = 512;
  var c = document.createElement("canvas");
  c.width = c.height = size;
  var ctx = c.getContext("2d");
  ctx.fillStyle = "#2b1810";
  ctx.fillRect(0, 0, size, size);
  for (var i = 0; i < 90; i++) {
    var r = 10 + Math.random() * 30;
    var x = Math.random() * size;
    var y = Math.random() * size;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(120,80,50,0.10)");
    g.addColorStop(1, "rgba(120,80,50,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Latte-art heart poured into the espresso, painted onto the coffee
// surface's own texture map — matching the real cup photo (heart rosetta
// in microfoam) rather than a flat crema ring.
export function makeLatteArtTexture() {
  var size = 512;
  var c = document.createElement("canvas");
  c.width = c.height = size;
  var ctx = c.getContext("2d");

  ctx.fillStyle = "#2b1810";
  ctx.fillRect(0, 0, size, size);
  for (var i = 0; i < 90; i++) {
    var r = 10 + Math.random() * 30;
    var x = Math.random() * size;
    var y = Math.random() * size;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(120,80,50,0.10)");
    g.addColorStop(1, "rgba(120,80,50,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function heartPath(cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.3);
    ctx.bezierCurveTo(cx, cy, cx - s, cy, cx - s, cy + s * 0.3);
    ctx.bezierCurveTo(cx - s, cy + s * 0.75, cx, cy + s * 0.75, cx, cy + s * 1.15);
    ctx.bezierCurveTo(cx, cy + s * 0.75, cx + s, cy + s * 0.75, cx + s, cy + s * 0.3);
    ctx.bezierCurveTo(cx + s, cy, cx, cy, cx, cy + s * 0.3);
    ctx.closePath();
  }

  var cx = size * 0.52, cy = size * 0.34;
  ctx.filter = "blur(10px)";
  heartPath(cx, cy, size * 0.3);
  ctx.fillStyle = "rgba(238,222,196,0.9)";
  ctx.fill();

  ctx.filter = "blur(2px)";
  heartPath(cx, cy, size * 0.24);
  ctx.fillStyle = "rgba(245,232,210,0.95)";
  ctx.fill();

  ctx.filter = "none";
  heartPath(cx, cy, size * 0.15);
  ctx.fillStyle = "rgba(250,240,222,0.95)";
  ctx.fill();

  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
