/**
 * The one mutable object the landing page's 3D scene reads every frame.
 *
 * Scroll, pointer and the interactive sections WRITE here; the scene READS it
 * in `useFrame`. Nothing in it is React state, so a scroll tick or a slider
 * move never re-renders the component tree — that is what keeps the page at
 * 60 fps while the bowl animates.
 */

export type Tier = 'high' | 'medium' | 'low'
export type Verdict = 'safe' | 'caution' | 'toxic'

/** A food dropped toward the bowl by the food-check section. */
export interface Drop {
  id: number
  /** Which procedural model to use. */
  model: 'grape' | 'chocolate' | 'onion' | 'carrot' | 'blueberry' | 'apple' | 'token'
  verdict: Verdict
  /** performance.now() when it was released. */
  startedAt: number
}

export interface Story {
  /** Scene time: 0 = hero, 1 = portions, 2 = food check … 6 = join. */
  t: number
  /** Pointer in -1..1 on both axes (0,0 = centre). */
  pointer: { x: number; y: number }
  /** How many kibble pieces the bowl should hold right now. */
  kibble: number
  /** What the portions planner says one meal is, in pieces. */
  portionKibble: number
  /** The latest food dropped toward the bowl, if any. */
  drop: Drop | null
  /** Text engraved on the ID tag in the closing scene. */
  tagName: string
  /** Bumped whenever tagName changes, so the texture redraws only then. */
  tagVersion: number
  /** True while an opaque paper section covers the whole viewport. */
  covered: boolean
  reducedMotion: boolean
  tier: Tier
}

export const story: Story = {
  t: 0,
  pointer: { x: 0, y: 0 },
  kibble: 0,
  portionKibble: 70,
  drop: null,
  tagName: '',
  tagVersion: 0,
  covered: false,
  reducedMotion: false,
  tier: 'high',
}

/** Kibble pieces the bowl can hold. One piece stands for GRAMS_PER_PIECE. */
export const MAX_KIBBLE = { high: 420, medium: 320, low: 220 } as const

/**
 * The bowl in the portions scene shows ONE MEAL. A piece of kibble on screen
 * stands for this many grams, and the page says so — the picture is a
 * proportion, not a photograph of the exact food.
 */
export const GRAMS_PER_PIECE = 1.5

/** How full the hero bowl is before anyone touches anything. */
export const HERO_KIBBLE = 150

let dropSeq = 0
export function releaseDrop(model: Drop['model'], verdict: Verdict) {
  story.drop = { id: ++dropSeq, model, verdict, startedAt: performance.now() }
}

export function setTagName(name: string) {
  const clean = name.slice(0, 14)
  if (clean === story.tagName) return
  story.tagName = clean
  story.tagVersion++
}
