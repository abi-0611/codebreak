/**
 * GL scene 1 — the hero backdrop. Task 3.4, teardown §9.
 *
 * A dark, slow, flowing filament and particle field in red, gold and magenta
 * on pure black. It should read as saffron threads suspended in water, not as
 * a starfield: the giveaway is that the strands stay coherent while they
 * travel, so the eye follows a thread rather than a swarm.
 *
 * That is why the advection runs in the vertex shader rather than on the CPU.
 * Every vertex of a strand is displaced by the SAME field, sampled at its own
 * position, so the strand bends as one object without any of its vertices ever
 * being told about the others. On the CPU it would be six thousand position
 * writes and a buffer upload every frame, for the same picture.
 *
 * NO POST-PROCESSING. Teardown §9 is explicit that the reference has none, and
 * an EffectComposer would double the fill cost of a full-screen scene to add a
 * bloom that additive blending already gives away for free.
 *
 * ON COLOUR SPACE. A custom ShaderMaterial does not receive three.js's tone
 * mapping or colour-space chunks — they are `#include`s the built-in materials
 * pull in and this shader does not. So what is written here lands on the
 * canvas unconverted, which is exactly right: `ink()` hands back sRGB floats
 * straight off the palette record.
 */
import { EMBERS, type Build } from '~/composables/gl'

const POINTS = 1600
const STRANDS = 220
/** Segments per strand. Ten is where a curve stops looking like a hinge. */
const LINKS = 10

const SPREAD = { x: 15, y: 10, near: 2, far: -18 } as const

/**
 * The advection field, shared by both shaders verbatim.
 *
 * Two layered octaves of the same cheap trigonometric curl. It is not real
 * curl noise and it does not need to be — at this speed and this density the
 * eye reads continuity, not correctness, and a noise texture lookup per vertex
 * would cost more than the whole rest of the scene.
 */
const FIELD = /* glsl */ `
  uniform float uTime;
  in float seed;
  in vec3 tint;
  out vec3 vTint;
  out float vFade;

  vec3 flow(vec3 p, float t, float s) {
    float a = sin(p.y * 0.35 + t * 0.21 + s * 6.2831);
    float b = cos(p.x * 0.28 - t * 0.17 + s * 3.1415);
    float c = sin(p.z * 0.31 + t * 0.13 + s * 1.5707);
    return vec3(a * 0.9 + c * 0.4, b * 0.7 + a * 0.3, c * 0.5);
  }

  vec3 adrift(vec3 p, float t, float s) {
    vec3 q = p;
    q += flow(q, t, s) * 1.4;
    q += flow(q * 0.45, t * 0.6, s) * 0.9;
    q.y += sin(t * 0.08 + s * 6.2831) * 0.6;
    return q;
  }
`

const MOTES = {
  vertex: /* glsl */ `
    ${FIELD}
    uniform float uPixels;

    void main() {
      vec4 view = modelViewMatrix * vec4(adrift(position, uTime, seed), 1.0);
      gl_Position = projectionMatrix * view;

      float dist = max(0.4, -view.z);
      gl_PointSize = (0.015 + seed * 0.04) * uPixels / dist;

      vTint = tint;
      vFade = smoothstep(32.0, 5.0, dist);
    }
  `,
  pixels: /* glsl */ `
    in vec3 vTint;
    in float vFade;
    out vec4 ember;

    void main() {
      vec2 d = gl_PointCoord - 0.5;
      float r = dot(d, d);
      if (r > 0.25) discard;
      float glow = smoothstep(0.25, 0.0, r);
      ember = vec4(vTint * glow * vFade * 1.05, 1.0);
    }
  `,
}

const THREADS = {
  vertex: /* glsl */ `
    ${FIELD}
    in vec3 anchor;
    in float along;
    out float vEnds;

    void main() {
      // The strand travels as ONE object: the field is sampled at its
      // anchor, not at each vertex. Sampling per vertex looks correct on
      // paper and draws long thin scratches, because a strand four units
      // long spans four units of a field that varies over one — the two
      // ends get pulled in different directions and the thread is stretched
      // into an arc. Anchor plus a small local bend is what reads as a
      // thread suspended in water.
      vec3 local = position - anchor;
      vec3 bend = flow(anchor * 0.8 + local * 1.8, uTime * 0.7, seed) * 0.5;
      vec4 view = modelViewMatrix * vec4(adrift(anchor, uTime, seed) + local + bend, 1.0);
      gl_Position = projectionMatrix * view;

      vTint = tint;
      vFade = smoothstep(32.0, 5.0, max(0.4, -view.z));
      // A strand fades out at both ends, so it has no visible cut.
      vEnds = sin(along * 3.14159);
    }
  `,
  pixels: /* glsl */ `
    in vec3 vTint;
    in float vFade;
    in float vEnds;
    out vec4 ember;

    void main() {
      ember = vec4(vTint * vFade * vEnds * 0.55, 1.0);
    }
  `,
}

/** Deterministic, so two reloads produce the same field. Rule 3: no surprises. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const drift: Build = ({ THREE, renderer, width, height }) => {
  const FOV = 50

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 60)
  camera.position.z = 12

  const tints = [EMBERS.red(), EMBERS.gold(), EMBERS.far()]
  const rand = rng(0x5AFF01)

  /* ---- the motes ---- */

  const motePos = new Float32Array(POINTS * 3)
  const moteSeed = new Float32Array(POINTS)
  const moteTint = new Float32Array(POINTS * 3)

  for (let i = 0; i < POINTS; i += 1) {
    motePos[i * 3] = (rand() * 2 - 1) * SPREAD.x
    motePos[i * 3 + 1] = (rand() * 2 - 1) * SPREAD.y
    motePos[i * 3 + 2] = SPREAD.far + rand() * (SPREAD.near - SPREAD.far)
    moteSeed[i] = rand()
    // Weighted to the red: gold is the accent here exactly as it is in the
    // stylesheet, not a third of the picture.
    const pick = rand()
    const [r, g, b] = tints[pick < 0.62 ? 0 : pick < 0.82 ? 2 : 1]!
    moteTint[i * 3] = r
    moteTint[i * 3 + 1] = g
    moteTint[i * 3 + 2] = b
  }

  const moteGeo = new THREE.BufferGeometry()
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3))
  moteGeo.setAttribute('seed', new THREE.BufferAttribute(moteSeed, 1))
  moteGeo.setAttribute('tint', new THREE.BufferAttribute(moteTint, 3))

  const shared = {
    uTime: { value: 0 },
    uPixels: { value: height },
  }

  const moteMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: shared,
    vertexShader: MOTES.vertex,
    fragmentShader: MOTES.pixels,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  })

  scene.add(new THREE.Points(moteGeo, moteMat))

  /* ---- the threads ---- */

  const verts = STRANDS * LINKS * 2
  const linePos = new Float32Array(verts * 3)
  const lineSeed = new Float32Array(verts)
  const lineTint = new Float32Array(verts * 3)
  const lineAlong = new Float32Array(verts)
  const lineAnchor = new Float32Array(verts * 3)

  let at = 0
  for (let s = 0; s < STRANDS; s += 1) {
    const ox = (rand() * 2 - 1) * SPREAD.x
    const oy = (rand() * 2 - 1) * SPREAD.y
    const oz = SPREAD.far + rand() * (SPREAD.near - SPREAD.far)
    const seed = rand()
    const span = 1 + rand() * 1.8
    const lean = rand() * Math.PI * 2
    const dx = Math.cos(lean) * span
    const dy = Math.sin(lean) * span

    // The strand is an ARC at rest, not a straight line, and this is the
    // difference between a thread and a scratch. The advection field bends a
    // strand a little, but a straight strand plus a little bend is still a
    // needle — the eye reads a perfectly straight edge as man-made no matter
    // how slowly it drifts. Curvature has to be in the geometry.
    const curl = (rand() * 2 - 1) * span * 0.45
    const px = -Math.sin(lean) * curl
    const py = Math.cos(lean) * curl
    const pick = rand()
    const [r, g, b] = tints[pick < 0.66 ? 0 : pick < 0.86 ? 2 : 1]!

    for (let k = 0; k < LINKS; k += 1) {
      // Two vertices per segment: LineSegments, so each pair is independent
      // and there is no strand-to-strand jump to clip.
      for (const end of [k / LINKS, (k + 1) / LINKS]) {
        const arc = Math.sin(end * Math.PI)
        linePos[at * 3] = ox + dx * (end - 0.5) + px * arc
        linePos[at * 3 + 1] = oy + dy * (end - 0.5) + py * arc
        linePos[at * 3 + 2] = oz + Math.sin(end * Math.PI * 2) * 0.14
        lineAnchor[at * 3] = ox
        lineAnchor[at * 3 + 1] = oy
        lineAnchor[at * 3 + 2] = oz
        lineSeed[at] = seed
        lineAlong[at] = end
        lineTint[at * 3] = r
        lineTint[at * 3 + 1] = g
        lineTint[at * 3 + 2] = b
        at += 1
      }
    }
  }

  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
  lineGeo.setAttribute('seed', new THREE.BufferAttribute(lineSeed, 1))
  lineGeo.setAttribute('tint', new THREE.BufferAttribute(lineTint, 3))
  lineGeo.setAttribute('along', new THREE.BufferAttribute(lineAlong, 1))
  lineGeo.setAttribute('anchor', new THREE.BufferAttribute(lineAnchor, 3))

  const lineMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: shared,
    vertexShader: THREADS.vertex,
    fragmentShader: THREADS.pixels,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  })

  scene.add(new THREE.LineSegments(lineGeo, lineMat))

  /* ---- lifecycle ---- */

  function pixels(h: number) {
    // gl_PointSize is in DEVICE pixels, so the projection scale has to carry
    // the pixel ratio or the field is half the size on a retina display.
    return (h * renderer.getPixelRatio()) / (2 * Math.tan((FOV * Math.PI) / 360))
  }

  shared.uPixels.value = pixels(height)

  return {
    draw: (time) => {
      shared.uTime.value = time
      renderer.render(scene, camera)
    },
    size: (w, h) => {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      shared.uPixels.value = pixels(h)
    },
    drop: () => {
      moteGeo.dispose()
      moteMat.dispose()
      lineGeo.dispose()
      lineMat.dispose()
    },
  }
}
