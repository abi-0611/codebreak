/**
 * GL scene 1 — the hero backdrop. Task 3.4, teardown §9, phase 11 §11.3.0.
 *
 * Black stone with luminous veining. Not a particle field: the reference's
 * backdrop is a continuous SURFACE — wide dark slabs cut by bright branching
 * capillaries that fork, thin out and die, with the whole field slowly
 * changing hue between the red, the gold and the rotated magenta.
 *
 * WHY A FULL-SCREEN SHADER AND NOT GEOMETRY. The first build of this scene
 * drew 1600 points and 220 line strands. Both are the wrong primitive for
 * this picture and the reason is structural rather than aesthetic: a vein
 * BRANCHES. Geometry can only branch if something authors the branch, so a
 * strand field reads as confetti no matter how well it is advected — every
 * element is the same length, the same thickness and unrelated to its
 * neighbours. A ridged noise field branches for free, because the branch is
 * where the iso-surface happens to fork, and it is different at every scale.
 *
 * It is also cheaper here. Six thousand vertices with a per-vertex advection
 * field cost a buffer's worth of bandwidth every frame to cover a screen with
 * a few thousand lit pixels. One quad covers it once.
 *
 * NO POST-PROCESSING. Teardown §9 is explicit that the reference has none, and
 * §11.7 forbids reaching for one here. The glow around a vein is a second,
 * wider power of the same ridge summed on top of it — a halo authored at the
 * point it is drawn, which costs one `pow` rather than an EffectComposer's
 * second full-screen pass. Every number in §11.9 is a brightness problem, and
 * a brightness problem is fixed where the brightness is written.
 *
 * ON COLOUR SPACE. A custom ShaderMaterial does not receive three.js's tone
 * mapping or colour-space chunks — they are `#include`s the built-in materials
 * pull in and this shader does not. So what is written here lands on the
 * canvas unconverted, which is exactly right: `ink()` hands back sRGB floats
 * straight off the palette record.
 *
 * ON COLOUR, AGAIN. Every tone below is a documented hue rotation of
 * `brown-lifted` — the convention phase 3 set and the reason `ink()` takes a
 * turn at all. No literal enters this file and no token is added for it.
 *
 * ------------------------------------------------------------------------
 * PHASE 11 — WHAT CHANGED, AND WHY EACH NUMBER IS THE NUMBER
 *
 * §11.1 re-measured the reference's hero over two long dwells where nothing
 * scrolls. Three findings drove this rewrite, and the third is the one that
 * matters:
 *
 *   1. the field never leaves an arc of 285° → 45°;
 *   2. lit-pixel share BREATHES between 2.0% and 5.8% — it is not a
 *      constant-density texture with a hue knob on it;
 *   3. it moves while the page is still. Over seven seconds of zero scroll the
 *      hue travels ~60° and the density more than doubles.
 *
 * The third is invariant 5 of §11.2 in practice: scroll-linked and time-linked
 * motion are different systems. Everything below runs on `uTime`, which is the
 * site's single ticker, and NOTHING below reads scroll. The parallax that used
 * to be confused with this lives on the wrapper, at rate 1.0, in `useLock`.
 *
 * The numbers those findings produced are in `tokens/field.mjs`, with what each
 * one measures written beside it. They are NOT here, because the still frame is
 * drawn from the same record and two copies of twelve constants is how a shader
 * change ends up shipping two different sites.
 */
import { EMBERS, ink, type Build } from '~/composables/gl'
import { palette } from '~~/tokens/palette.mjs'
import { ARC, CLOCK, EXPOSE, OCTAVES, RAMP, SEAM } from '~~/tokens/field.mjs'

/**
 * EVERY CONSTANT THIS SCENE IS DRAWN FROM LIVES IN tokens/field.mjs.
 *
 * Not for tidiness. The still frame that stands in for this shader under
 * reduced motion and behind a failed GL gate is drawn by scripts/lib/stone.mjs
 * from the SAME record, so a change here cannot leave the fallback behind —
 * which §11.3.0 names as the way this scene ends up shipping two different
 * sites. Read that file for what each number is and what measures it.
 */

/**
 * The noise, the ridge and the veining, shared verbatim by the one material.
 *
 * `ridge()` is the load-bearing function. `1 - |2n - 1|` folds the noise at
 * its midpoint, so what was a smooth hill becomes a crease with a sharp peak
 * along the fold. Raising that to a high power keeps only the crest, and the
 * crest of a folded 3D noise field is a branching line. Every vein on the
 * screen is that one identity, sampled at two scales.
 */
const STONE = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uAspect;
  uniform vec3  uCrest;
  uniform vec3  uCrestWarm;
  uniform vec3  uFloor;
  uniform vec3  uFloorWarm;
  uniform vec3  uPale;

  in vec2 vUv;
  out vec4 ember;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }

  /*
    SIGNED octaves, centred on zero. This is the detail the whole picture
    depends on and it is easy to get wrong: summing unsigned noise gives a
    field that hovers near 0.5 with a narrow spread, so a fold taken at its
    midpoint is close to its maximum almost everywhere and the veins cover the
    screen instead of cutting across it. Centring each octave first spreads the
    field over roughly [-1, 1], and the fold then keeps only the neighbourhood
    of the ZERO SET — which in two dimensions is a curve, not a region.
  */
  float turb(vec3 p, int turns) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i += 1) {
      if (i >= turns) break;
      sum += amp * (noise(p) * 2.0 - 1.0);
      p *= 2.03;
      amp *= 0.5;
    }
    return sum;
  }

  /* Back to 0..1, for the two places that want a level rather than a crease. */
  float level(float n) {
    return 0.5 + 0.5 * n;
  }

  /* The fold. See the note above — this is what makes a vein a vein. */
  float ridge(float n) {
    return 1.0 - abs(n);
  }
`

const SURFACE = /* glsl */ `
  ${STONE}

  void main() {
    // Aspect-corrected and centred, so the field is the same shape on a phone
    // as on a desktop rather than being stretched with the viewport.
    vec2 uv = (vUv - 0.5) * uAspect;

    // The third axis is time. Advancing THROUGH the field rather than sliding
    // across it is what makes the veins re-form instead of merely translating:
    // a vein that only travels is a texture on a conveyor belt.
    float t = uTime * 0.03;
    vec3 p = vec3(uv * 2.6, t);

    vec3 warp = vec3(
      turb(p + vec3(0.0, 0.0, 0.0), ${OCTAVES.warp}),
      turb(p + vec3(5.2, 1.3, 2.1), ${OCTAVES.warp}),
      turb(p + vec3(1.7, 9.2, 4.4), ${OCTAVES.warp}));

    // Domain warping is what stops the veins reading as a noise texture. The
    // field is sampled at a position the field itself displaced, so the
    // creases curve, double back and pinch the way a mineral seam does.
    vec3 q = p + warp * 0.85;

    float wide = ridge(turb(q, ${OCTAVES.vein}));
    float hair = ridge(turb(q * 3.6 + vec3(11.0, 3.0, 0.0), ${OCTAVES.hair}));

    /*
      THE SEAM MASK, and it is what separates marble from cracked glass.

      A ridged field produces a vein through every part of the frame, evenly,
      because the zero set of a noise field is everywhere. Left at that the
      backdrop reads as crazing on a windscreen — technically veins, visually a
      net. Real stone concentrates: whole slabs carry nothing and then a seam
      runs through with everything happening along it.

      So the veins are multiplied by a much lower-frequency field, thresholded
      hard. Most of the frame lands under the threshold and stays black, which
      is what gives the headline the ground it needs and what makes the lit
      areas read as events rather than as texture.

      THE THRESHOLD BREATHES — §11.3.0 item 4. Sliding the gate up and down on
      its own slow period is what makes lit-pixel share travel across the
      measured 2.0–5.8% instead of sitting at one number. It is applied to the
      MASK rather than to the output gain deliberately: dimming the whole field
      would have moved the share by fading veins toward black, which reads as
      the page dipping its own brightness. Moving the gate opens and closes
      seams instead, so the field gets busier and quieter rather than lighter
      and darker.
    */
    float breath = 0.5 + 0.5 * sin(uTime * ${CLOCK.breath});
    float gate = mix(${SEAM.shut}, ${SEAM.open}, breath);
    float seam = ${SEAM.floor} + ${1 - SEAM.floor} * smoothstep(gate, gate + ${SEAM.width}, level(turb(p * 0.34 + warp * 0.3, ${OCTAVES.band})));

    // A second, faster variation ALONG the seam, so a vein is hot in places
    // and nearly out in others instead of being uniformly lit end to end.
    float pulse = 0.35 + 0.85 * level(turb(q * 1.15 + vec3(3.0, 7.0, 0.0), ${OCTAVES.warp}));

    // Three powers of the SAME crease: the lit core, the capillaries that
    // fork off it, and the halo that stands in for a bloom pass. The powers
    // are high because a vein is THIN — see EXPOSE, where every one of them is
    // a number §11.9 measures rather than a number that looked right.
    float core = pow(wide, ${EXPOSE.core}.0) * seam * pulse;
    float fine = pow(hair, ${EXPOSE.hair}.0) * ${EXPOSE.hairGain} * seam;
    float halo = pow(wide, ${EXPOSE.halo}.0) * ${EXPOSE.haloGain} * seam;

    // The slabs between the veins. Barely lit — they exist so the ground is
    // stone rather than a void with lines on it, and at this level they are
    // under the threshold at which anything would compete with the headline.
    float slab = smoothstep(0.55, 0.95, level(turb(p * 0.5 + warp * 0.5, ${OCTAVES.band})));

    /*
      THE VERTICAL HUE RAMP AND THE CLOCK — §11.3.0 items 3 and 4.

      fall is 0 at the top of the viewport and 1 at the floor, in SCREEN
      space: vUv and not the aspect-corrected uv, because the ramp is a
      property of the frame the reader is looking at rather than of the field
      inside it. Widening the viewport must not stretch the ramp out of the
      picture.

      The jitter is on the ramp COORDINATE, clamped, so neighbouring veins
      differ in tone without any hue ever leaving the arc. See ARC in the
      TypeScript above.

      NOTE FOR ANYONE EDITING THIS BLOCK: no backticks in here. The whole
      shader is a JS template literal, and a backtick in a GLSL comment closes
      it — which fails as a TypeScript parse error tens of lines away from the
      character that caused it.
    */
    float drift = level(turb(p * 0.42 + vec3(0.0, 0.0, uTime * 0.02), ${OCTAVES.band}));
    float fall = clamp(
      smoothstep(${RAMP.from}, ${RAMP.to}, 1.0 - vUv.y) + (drift - 0.5) * ${RAMP.jitter},
      0.0, 1.0);

    // The wander: two incommensurate sines at quarter amplitude, so the sum is
    // inside 0..1 for every input and marches in one stretch, wanders in the
    // next. Non-monotonic by construction, bounded by construction.
    float wander = 0.5
      + 0.25 * sin(uTime * ${CLOCK.hue})
      + 0.25 * sin(uTime * ${CLOCK.sway} + ${CLOCK.phase});

    vec3 tone = mix(
      mix(uCrest, uCrestWarm, wander),
      mix(uFloor, uFloorWarm, wander),
      fall);

    // The filament itself: a much higher power of the same crease, so it is a
    // few pixels wide where the core is tens. Without it the veins are lit but
    // never HOT, and a seam whose brightest point is still its own hue reads as
    // smoke rather than as something incandescent.
    float spark = pow(wide, ${EXPOSE.spark}.0) * seam * pulse;

    // The gain is a deliberate step DOWN from what matched the reference frame
    // for frame. The reference is a finance site and its hero is the loudest
    // thing on it; ours carries an h1, a sub and a pill in cream over the same
    // stone, and the house's voice is understated.
    vec3 col = (tone * (core * 1.9 + fine * 1.2 + halo) + tone * slab * ${EXPOSE.slabGain}) * ${EXPOSE.gain};

    // The hottest thousandth of the crease goes to the pale token rather than
    // to the tone. A seam that is merely a brighter red never looks lit; the
    // white centre with the coloured bleed either side is what an emitting
    // filament actually does, and it costs one squared term.
    col += uPale * spark * ${EXPOSE.sparkGain};

    // The corners go to black. Not decoration: the headline and the stats box
    // sit over this, and a vein running under cream type at full brightness is
    // the one way a backdrop can cost the page its contrast ratio.
    float vig = smoothstep(1.75, 0.38, length(uv * vec2(0.85, 1.0)));
    col *= vig;

    ember = vec4(col, 1.0);
  }
`

/**
 * `position` and `uv` are NOT declared here. `ShaderMaterial` — unlike
 * `RawShaderMaterial` — prepends three.js's own attribute block, and at GLSL3
 * those arrive as `in`. Declaring either again is a redeclaration error, and
 * the compile log for it names a line number in a prefix this file cannot see.
 */
const FLAT = /* glsl */ `
  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const drift: Build = ({ THREE, renderer, width, height }) => {
  const scene = new THREE.Scene()
  // No perspective and no camera motion. The quad is authored in clip space,
  // so the projection is the identity and there is nothing for a camera to do.
  const camera = new THREE.Camera()

  const tint = (turn: number) => new THREE.Vector3(...ink(palette['brown-lifted'], turn))

  const uniforms = {
    uTime: { value: 0 },
    uAspect: { value: new THREE.Vector2(1, 1) },
    uCrest: { value: tint(ARC.crest) },
    uCrestWarm: { value: tint(ARC.crestWarm) },
    uFloor: { value: tint(ARC.floor) },
    uFloorWarm: { value: tint(ARC.floorWarm) },
    // Cream, not #FFFFFF. Teardown §8.1: there is no true white anywhere on
    // this site, and a filament core lit in one would be the only pixel on the
    // page that is.
    uPale: { value: new THREE.Vector3(...EMBERS.pale()) },
  }

  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: FLAT,
      fragmentShader: SURFACE,
      depthTest: false,
      depthWrite: false,
    }),
  )
  quad.frustumCulled = false
  scene.add(quad)

  /**
   * The field is measured in units of the SHORT edge. A viewport twice as wide
   * therefore shows twice as much stone rather than the same stone stretched,
   * which is the whole reason this is not simply `width / height` on x.
   */
  function fit(w: number, h: number) {
    const short = Math.max(1, Math.min(w, h))
    uniforms.uAspect.value.set(w / short, h / short)
  }

  fit(width, height)

  return {
    draw: (time) => {
      uniforms.uTime.value = time
      renderer.render(scene, camera)
    },
    size: fit,
    drop: () => {
      quad.geometry.dispose()
      ;(quad.material as { dispose: () => void }).dispose()
    },
  }
}
