/**
 * The hero backdrop's field — the single definition site for every number the
 * stone is drawn from.
 *
 * Two consumers read this file and nothing else:
 *
 *   app/composables/scenes/drift.ts   the live GL scene (phase 3, phase 11)
 *   scripts/lib/stone.mjs             the offline CPU port that draws the
 *                                     still frame `plates['still-01']`
 *
 * It exists for the same reason `tokens/palette.mjs` does. The still is the
 * reduced-motion and no-GL fallback for the shader, so the two have to be the
 * same picture — and "the same picture" cannot survive two copies of twelve
 * constants maintained by hand. §11.3.0 is explicit that a shader change which
 * leaves the still behind ships two different sites; the way to make that
 * impossible rather than merely unlikely is to have one record.
 *
 * Everything here is a plain number. The noise, the ridge and the pixel stage
 * live with their consumers — this file is values, exactly as the palette is.
 */

/**
 * Octave counts, which are the whole performance budget of the live scene.
 *
 * The warp is deliberately the CHEAPEST of the four. It is sampled three times
 * (once per axis) and its job is only to bend the domain — detail put into a
 * warp is detail the field it warps will smear away, so a third octave there
 * buys nothing and costs three noise evaluations per pixel.
 */
export const OCTAVES = { warp: 2, vein: 5, hair: 4, band: 2 }

/**
 * THE ARC, AS FOUR ROTATIONS OF ONE TOKEN — §11.3.0 items 3 and 4.
 *
 * `brown-lifted` sits at hue 8°. The four turns below place the two ends of
 * the vertical hue ramp at each end of the clock's travel:
 *
 *      turn   hue                     role
 *      -83    285°  violet-magenta    top of the viewport, coolest the clock goes
 *      -41    327°  magenta           top of the viewport, warmest the clock goes
 *       -5      3°  crimson           the floor,           coolest the clock goes
 *      +37     45°  amber             the floor,           warmest the clock goes
 *
 * The arithmetic is the whole safety argument, and it is worth stating as an
 * identity rather than as an intention: the ramp spans 78° and the clock
 * translates it by 42°, and 78 + 42 is exactly the 120° from 285° to 45°. Both
 * terms are bounded by construction — one is a clamped 0..1, the other a sum of
 * two quarter-amplitude sines — so the field CANNOT leave the arc. §11.3.0 is
 * explicit that a single frame of teal reads as a different site, and "cannot"
 * is a stronger guarantee than "does not".
 *
 * Which is also why hue is NOT jittered by noise. The phase 3 build chose a
 * tone from a noise field, which is unbounded in principle and merely happened
 * to stay warm. Neighbouring veins still differ — the jitter moved to the ramp
 * COORDINATE, which is clamped, so local variation costs nothing in the
 * guarantee. See RAMP.
 */
export const ARC = { crest: -83, crestWarm: -41, floor: -5, floorWarm: 37 }

/**
 * The exposure — the constants §11.9 measures, gathered where they can be read
 * together rather than buried in the pixel stage.
 *
 * `core`, `hair` and `halo` are ridge exponents, and a vein is thin, so the
 * exponent is what thinness IS here. Raising `core` from the phase 3 value of
 * 20 is what moved lit-pixel share from 10.5% into the measured 2.0–5.8%;
 * nothing about the field changed, only how much of each crease clears the
 * floor.
 *
 * `haloGain` is what moves the mid band. Teardown §9's halo stands in for a bloom
 * pass, and at the phase 3 amplitude it painted a wide, dim, saturated skirt
 * either side of every vein — 3.5% of the frame in L 25–128 against a measured
 * ~1.5%. The reference's veins sit against pure black within a few pixels of
 * the core. The technique is kept, because it is why there is no
 * post-processing pass; the amplitude is cut to a seventh.
 *
 * ONE RELATIONSHIP IS WORTH KNOWING BEFORE TUNING THESE. The share of lit
 * pixels that also land in the mid band is independent of the exponent: for a
 * power of a ridge, raising the exponent narrows the lit band and the mid band
 * by the same factor. Only the GAIN moves the ratio. So if the mid band is the
 * failing number, `gain` is the knob and `core` is not.
 */
export const EXPOSE = {
  core: 62,
  hair: 72,
  halo: 24,
  haloGain: 0.016,
  hairGain: 0.42,
  /** The slabs between the veins. Stone, not a void with lines on it. */
  slabGain: 0.011,
  /** The filament centre — the hottest thousandth of the crease. */
  spark: 95,
  sparkGain: 0.5,
  /**
   * A deliberate step DOWN from what matched the reference frame for frame.
   * The reference is a finance site and its hero is the loudest thing on it;
   * ours carries an h1, a sub and a pill in cream over the same stone, and the
   * house's voice is understated.
   */
  gain: 0.72,
}

/**
 * THE FIELD'S OWN CLOCK — §11.3.0 item 4, and §11.2 invariant 5.
 *
 * §11.1 sampled the reference across a 7.1-second dwell where nothing scrolls
 * at all: the hue travelled ~60° and the lit-pixel share more than doubled. A
 * backdrop wired only to scroll progress is wrong in a way no screenshot will
 * ever show you, and the reference's two long hero dwells exist precisely
 * because that is what the person making the recording wanted to demonstrate.
 *
 * Three periods, none a simple multiple of another, so the two hue terms and
 * the density term never visibly beat together:
 *
 *   hue    2π / 0.55 ≈ 11.4s
 *   sway   2π / 0.34 ≈ 18.5s
 *   breath 2π / 0.29 ≈ 21.7s
 *
 * The wander is `0.5 + 0.25·sin(hue·t) + 0.25·sin(sway·t + phase)`, which is
 * inside 0..1 for every input by construction — not by a clamp that could be
 * removed later without anything noticing. Non-monotonic, because two
 * incommensurate sines summed do not march; §11.1's two dwells show the
 * reference doing both, wandering across one and marching across the other,
 * and a sum of sines is what produces a stretch of each.
 *
 * `hue` and `sway` sit at the floor that clears §11.9's "≥ 30° over 10s of
 * zero scroll" — slower there is not more restrained, it is a still image.
 * `breath` is raised a step above ITS floor on top of that, for a slightly
 * livelier glow cadence; still no simple multiple of the other two.
 */
export const CLOCK = { hue: 0.55, sway: 0.34, breath: 0.29, phase: 1.7 }

/**
 * The instant the still frame is drawn at.
 *
 * A single frozen frame should be a REPRESENTATIVE state of the clock, not
 * whatever `t = 0` happens to be, and "representative" here means both terms
 * at the middle of their travel. Every `kπ / breath` puts the breath term
 * exactly at its own middle; `k = 5` is the smallest of those crossings
 * whose wander also lands close to ITS middle — 0.489 here, against 0.5.
 * Both facts are checked by the generator, which prints them and refuses to
 * write a frame drawn more than a little off centre — a constant that
 * silently stops being the middle of the clock is exactly the kind of thing
 * nobody notices for two phases. Retuning `breath` moves every crossing, so
 * this is re-searched rather than carried over whenever it changes.
 */
export const FREEZE = (5 * Math.PI) / CLOCK.breath

/**
 * The vertical hue ramp — §11.3.0 item 3. Magenta at the top of the viewport,
 * amber at the floor, all in one frame.
 *
 * A smoothstep rather than a straight line, and that is a measurement rather
 * than a preference. §11.9 samples the ramp as five horizontal bands and asks
 * for ≥ 60° between the extremes — but a band's mean lands at its CENTRE, and
 * the crop starts below the header, so a linear ramp across 78° presents only
 * about three quarters of itself to the test. Flattening the outer tenth at
 * each end pushes the band means back out toward the ends, which is both what
 * passes the test and what the reference looks like: a magenta top, an amber
 * floor, and the whole of the change happening across the middle.
 *
 * `jitter` is applied to the ramp COORDINATE and then clamped, never to the
 * hue. See ARC for why that distinction is the whole bound.
 */
export const RAMP = { from: 0.1, to: 0.9, jitter: 0.06 }

/**
 * The density gate, and why it is on the seam mask rather than on the output.
 *
 * Sliding the threshold up and down on the breath's period is what makes
 * lit-pixel share travel across the measured 2.0–5.8% instead of sitting at
 * one number. Dimming the whole field would have moved the share too, by
 * fading veins toward black — which reads as the page dipping its own
 * brightness. Moving the gate opens and closes SEAMS instead, so the field
 * gets busier and quieter rather than lighter and darker, which is what §11.1
 * describes and what a stone that is alive actually does.
 *
 * `floor` is the share of the vein that survives a fully closed seam. Not
 * zero: whole slabs carrying nothing at all is a net of veins with holes in
 * it, rather than stone.
 */
export const SEAM = { shut: 0.52, open: 0.3, width: 0.36, floor: 0.08 }
