/* Chateau de Rockville Cafe — canvas textures for the hero cup's coffee
   surface and its rising-steam glow. */
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

// Latte-art heart matching Chateau de Rockville's real café pour.
// Realistic crema gradient with organic foam detail and espresso underlay.
export function makeLatteArtTexture() {
  var size = 512;
  var c = document.createElement("canvas");
  c.width = c.height = size;
  var ctx = c.getContext("2d");

  // Base espresso underlay with natural coffee variation
  var grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#6b4423");
  grad.addColorStop(0.5, "#7a5028");
  grad.addColorStop(1, "#5a3a1a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Organic coffee texture — darker patches for realistic brew variation
  for (var i = 0; i < 100; i++) {
    var r = 8 + Math.random() * 48;
    var x = Math.random() * size;
    var y = Math.random() * size;
    var blend = Math.random();
    ctx.globalAlpha = blend * 0.12;
    ctx.fillStyle = blend < 0.5 ? "#3a2010" : "#9a7a50";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Realistic foam/crema with natural gradient (white foam sits atop espresso)
  function foamHeart(cx, cy, s, quality) {
    // Outer foam glow (softest, most milk)
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 1.4);
    glow.addColorStop(0, "rgba(250,245,240,0.85)");
    glow.addColorStop(0.6, "rgba(235,220,200,0.35)");
    glow.addColorStop(1, "rgba(220,190,150,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.3);
    ctx.bezierCurveTo(cx, cy - s * 0.15, cx - s * 1.15, cy - s * 0.1, cx - s * 1.1, cy + s * 0.35);
    ctx.bezierCurveTo(cx - s * 1.1, cy + s * 0.8, cx - s * 0.2, cy + s * 1.2, cx, cy + s * 1.25);
    ctx.bezierCurveTo(cx + s * 0.2, cy + s * 1.2, cx + s * 1.1, cy + s * 0.8, cx + s * 1.1, cy + s * 0.35);
    ctx.bezierCurveTo(cx + s * 1.15, cy - s * 0.1, cx, cy - s * 0.15, cx, cy + s * 0.3);
    ctx.closePath();
    ctx.fill();

    if (quality >= 2) {
      // Mid-tone foam with espresso showing through edges
      ctx.filter = "blur(3px)";
      ctx.fillStyle = "rgba(240,225,200,0.75)";
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.25);
      ctx.bezierCurveTo(cx, cy - s * 0.08, cx - s * 0.95, cy, cx - s * 0.9, cy + s * 0.3);
      ctx.bezierCurveTo(cx - s * 0.9, cy + s * 0.7, cx - s * 0.1, cy + s * 1.0, cx, cy + s * 1.1);
      ctx.bezierCurveTo(cx + s * 0.1, cy + s * 1.0, cx + s * 0.9, cy + s * 0.7, cx + s * 0.9, cy + s * 0.3);
      ctx.bezierCurveTo(cx + s * 0.95, cy, cx, cy - s * 0.08, cx, cy + s * 0.25);
      ctx.closePath();
      ctx.fill();
    }

    if (quality >= 3) {
      // Bright inner foam for crisp pour detail
      ctx.filter = "blur(0px)";
      ctx.fillStyle = "rgba(250,240,225,0.9)";
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.2);
      ctx.bezierCurveTo(cx, cy - s * 0.03, cx - s * 0.75, cy + s * 0.08, cx - s * 0.7, cy + s * 0.25);
      ctx.bezierCurveTo(cx - s * 0.7, cy + s * 0.55, cx - s * 0.15, cy + s * 0.85, cx, cy + s * 0.95);
      ctx.bezierCurveTo(cx + s * 0.15, cy + s * 0.85, cx + s * 0.7, cy + s * 0.55, cx + s * 0.7, cy + s * 0.25);
      ctx.bezierCurveTo(cx + s * 0.75, cy + s * 0.08, cx, cy - s * 0.03, cx, cy + s * 0.2);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.filter = "none";
  var cx = size * 0.52, cy = size * 0.38;
  foamHeart(cx, cy, size * 0.32, 3);

  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
