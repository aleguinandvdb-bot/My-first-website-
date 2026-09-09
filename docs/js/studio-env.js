/* Shared studio environment map.

   PBR metal and glass have almost no diffuse component — they render
   almost entirely from what they *reflect*. With only point lights and no
   environment, chrome reads as near-black and glass reads as flat grey,
   which is why every metal part on this site previously had to be faked
   with artificially low metalness.

   RoomEnvironment builds a small emissive-panel room; PMREMGenerator
   pre-filters it into a mipmapped radiance map that MeshPhysicalMaterial
   can sample. Generated once and shared across all scenes. */
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

/* Cached per renderer, NOT globally. A PMREM result lives in the WebGL
   context that produced it; handing it to a second renderer yields a
   texture with no uploadable image, which shades every metal black. Each
   section on this page owns its own canvas and therefore its own context,
   so each needs its own bake. */
var cache = new WeakMap();

export function getStudioEnvironment(renderer) {
  if (!renderer) return null;
  if (cache.has(renderer)) return cache.get(renderer);
  var tex = null;
  try {
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var envScene = new RoomEnvironment();
    tex = pmrem.fromScene(envScene, 0.04).texture;
    envScene.dispose();
    pmrem.dispose();
  } catch (e) {
    tex = null; // fall back to light-only shading
  }
  cache.set(renderer, tex);
  return tex;
}
