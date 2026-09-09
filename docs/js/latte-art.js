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

/* A poured rosetta, matching the café's own pour: a pointed apex, paired
   crescent leaves fanning out symmetrically and widest about two-thirds
   down, and a stem pulled back through the centre — over a caramel crema
   carrying the concentric rings the first swirl leaves behind. */
/* One crescent lobe: leaves the centre line, sweeps out and down, and comes
   to a point at its outer tip. `t` is the band's thickness at the axis, and
   is deliberately less than the spacing between lobes so bare crema shows
   between them — overlapping bands merge into a solid blob. */
function drawLeaf(ctx, cx, y, w, t, dir) {
  ctx.beginPath();
  ctx.moveTo(cx, y);
  // Upper edge: out from the centre line and curling up to a pointed tip.
  ctx.bezierCurveTo(cx + dir * w * 0.42, y - t * 0.30, cx + dir * w * 0.80, y - t * 0.78, cx + dir * w, y - t * 1.32);
  // Lower edge: sagging back to the axis, so the lobe reads as a crescent
  // opening upward rather than a flat slat.
  ctx.bezierCurveTo(cx + dir * w * 0.77, y - t * 0.26, cx + dir * w * 0.40, y + t * 0.56, cx, y + t);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawRosetta(ctx, cx, yTop, yBot, maxW) {
  var axis = yBot - yTop;
  var n = 12;
  var step = axis / (n - 1);
  var band = step * 0.74;

  ctx.fillStyle = "#f4efe6";
  ctx.strokeStyle = "rgba(78,48,24,0.34)";
  ctx.lineWidth = band * 0.09;
  ctx.lineJoin = "round";

  for (var i = 0; i < n; i++) {
    var f = i / (n - 1);
    var w = maxW * Math.pow(Math.sin(Math.PI * Math.pow(f, 1.5)), 0.68);
    if (w < maxW * 0.05) continue;
    var y = yTop + axis * f;
    drawLeaf(ctx, cx, y, w, band, 1);
    drawLeaf(ctx, cx, y, w, band, -1);
  }

  // The stem, pulled back through the centre once the lobes are down: a
  // thin line, not a spine — it only has to link the lobes and point the apex.
  ctx.beginPath();
  ctx.moveTo(cx, yTop - step * 0.55);
  ctx.lineTo(cx, yBot + step * 0.30);
  ctx.strokeStyle = "#f7f3ec";
  ctx.lineWidth = maxW * 0.030;
  ctx.lineCap = "round";
  ctx.stroke();
}

export function makeLatteArtTexture() {
  var size = 1024;
  var c = document.createElement("canvas");
  c.width = c.height = size;
  var ctx = c.getContext("2d");
  var cx = size * 0.5, cy = size * 0.5;

  // Crema: warm caramel, lifted where the milk went in, deeper at the rim.
  var base = ctx.createRadialGradient(cx * 0.92, cy * 0.84, size * 0.03, cx, cy, size * 0.54);
  base.addColorStop(0, "#bd8f5d");
  base.addColorStop(0.5, "#a3744a");
  base.addColorStop(0.82, "#8a5c37");
  base.addColorStop(1, "#6d4425");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Uneven crema, so the surface isn't a flat wash.
  for (var i = 0; i < 90; i++) {
    var r = size * (0.02 + Math.random() * 0.07);
    var x = Math.random() * size;
    var y = Math.random() * size;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    var light = Math.random() < 0.5;
    g.addColorStop(0, light ? "rgba(214,176,132,0.16)" : "rgba(84,52,26,0.16)");
    g.addColorStop(1, light ? "rgba(214,176,132,0)" : "rgba(84,52,26,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Concentric rings left by the swirl before the pattern goes in.
  for (var k = 0; k < 8; k++) {
    ctx.beginPath();
    ctx.arc(cx + Math.sin(k * 1.7) * size * 0.008, cy + Math.cos(k * 1.7) * size * 0.008,
            size * (0.29 + k * 0.026), 0, Math.PI * 2);
    ctx.strokeStyle = k % 2 ? "rgba(226,193,152,0.13)" : "rgba(92,58,29,0.13)";
    ctx.lineWidth = size * 0.013;
    ctx.stroke();
  }

  drawRosetta(ctx, cx, size * 0.15, size * 0.84, size * 0.29);

  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
