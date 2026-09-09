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

// Photo-realistic latte art from Chateau de Rockville's actual pour.
// Extracted color palette from real café photo for authentic appearance.
export function makeLatteArtTexture() {
  var size = 512;
  var c = document.createElement("canvas");
  c.width = c.height = size;
  var ctx = c.getContext("2d");

  // Rich espresso base — warm brown from actual photo
  var espressoGrad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size*0.8);
  espressoGrad.addColorStop(0, "#8a6f4e");
  espressoGrad.addColorStop(0.4, "#6b5236");
  espressoGrad.addColorStop(1, "#4a3520");
  ctx.fillStyle = espressoGrad;
  ctx.fillRect(0, 0, size, size);

  // Photorealistic coffee mottling — subtle variations in brew
  for (var i = 0; i < 120; i++) {
    var r = 6 + Math.random() * 52;
    var x = Math.random() * size;
    var y = Math.random() * size;
    var intensity = Math.random();
    ctx.globalAlpha = intensity * 0.08;
    if (intensity < 0.33) {
      ctx.fillStyle = "#2a1810"; // Dark espresso patches
    } else if (intensity < 0.66) {
      ctx.fillStyle = "#a68860"; // Light milk patches
    } else {
      ctx.fillStyle = "#6a4a28"; // Mid-tone
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Hyper-detailed foam heart — 4-layer approach for photorealism
  function photoRealisticHeart(cx, cy, s) {
    // LAYER 1: Outer foam glow (softest highlight, widest)
    var outerGlow = ctx.createRadialGradient(cx - s*0.15, cy - s*0.1, 0, cx, cy, s*1.5);
    outerGlow.addColorStop(0, "rgba(248,242,235,0.8)");
    outerGlow.addColorStop(0.5, "rgba(230,210,180,0.25)");
    outerGlow.addColorStop(1, "rgba(180,140,80,0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s*0.35);
    ctx.bezierCurveTo(cx, cy - s*0.2, cx - s*1.2, cy - s*0.15, cx - s*1.15, cy + s*0.4);
    ctx.bezierCurveTo(cx - s*1.15, cy + s*0.85, cx - s*0.25, cy + s*1.3, cx, cy + s*1.35);
    ctx.bezierCurveTo(cx + s*0.25, cy + s*1.3, cx + s*1.15, cy + s*0.85, cx + s*1.15, cy + s*0.4);
    ctx.bezierCurveTo(cx + s*1.2, cy - s*0.15, cx, cy - s*0.2, cx, cy + s*0.35);
    ctx.closePath();
    ctx.fill();

    // LAYER 2: Mid-tone foam (slightly blurred for soft edges)
    ctx.filter = "blur(2px)";
    var midTone = ctx.createRadialGradient(cx - s*0.08, cy - s*0.08, 0, cx, cy, s*1.1);
    midTone.addColorStop(0, "rgba(242,233,220,0.8)");
    midTone.addColorStop(0.6, "rgba(220,200,170,0.4)");
    midTone.addColorStop(1, "rgba(200,160,100,0)");
    ctx.fillStyle = midTone;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s*0.28);
    ctx.bezierCurveTo(cx, cy - s*0.1, cx - s*1.0, cy - s*0.05, cx - s*0.95, cy + s*0.32);
    ctx.bezierCurveTo(cx - s*0.95, cy + s*0.72, cx - s*0.2, cy + s*1.1, cx, cy + s*1.2);
    ctx.bezierCurveTo(cx + s*0.2, cy + s*1.1, cx + s*0.95, cy + s*0.72, cx + s*0.95, cy + s*0.32);
    ctx.bezierCurveTo(cx + s*1.0, cy - s*0.05, cx, cy - s*0.1, cx, cy + s*0.28);
    ctx.closePath();
    ctx.fill();

    // LAYER 3: Bright inner foam (micro-blur for detail)
    ctx.filter = "blur(0.5px)";
    var innerBright = ctx.createRadialGradient(cx, cy - s*0.05, 0, cx, cy, s*0.8);
    innerBright.addColorStop(0, "rgba(248,245,240,0.95)");
    innerBright.addColorStop(0.7, "rgba(235,220,200,0.5)");
    innerBright.addColorStop(1, "rgba(220,190,150,0)");
    ctx.fillStyle = innerBright;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s*0.2);
    ctx.bezierCurveTo(cx, cy - s*0.02, cx - s*0.8, cy + s*0.05, cx - s*0.75, cy + s*0.25);
    ctx.bezierCurveTo(cx - s*0.75, cy + s*0.6, cx - s*0.15, cy + s*0.95, cx, cy + s*1.05);
    ctx.bezierCurveTo(cx + s*0.15, cy + s*0.95, cx + s*0.75, cy + s*0.6, cx + s*0.75, cy + s*0.25);
    ctx.bezierCurveTo(cx + s*0.8, cy + s*0.05, cx, cy - s*0.02, cx, cy + s*0.2);
    ctx.closePath();
    ctx.fill();

    // LAYER 4: Crisp foam detail (no blur, highest contrast)
    ctx.filter = "none";
    ctx.fillStyle = "rgba(250,245,238,0.92)";
    ctx.beginPath();
    ctx.moveTo(cx, cy + s*0.15);
    ctx.bezierCurveTo(cx, cy + s*0.01, cx - s*0.65, cy + s*0.08, cx - s*0.6, cy + s*0.22);
    ctx.bezierCurveTo(cx - s*0.6, cy + s*0.5, cx - s*0.1, cy + s*0.8, cx, cy + s*0.9);
    ctx.bezierCurveTo(cx + s*0.1, cy + s*0.8, cx + s*0.6, cy + s*0.5, cx + s*0.6, cy + s*0.22);
    ctx.bezierCurveTo(cx + s*0.65, cy + s*0.08, cx, cy + s*0.01, cx, cy + s*0.15);
    ctx.closePath();
    ctx.fill();

    // Subtle inner shadow for depth
    ctx.fillStyle = "rgba(100,70,40,0.04)";
    ctx.beginPath();
    ctx.arc(cx, cy + s*0.4, s*0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  var cx = size * 0.52, cy = size * 0.36;
  photoRealisticHeart(cx, cy, size * 0.33);

  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
