import { Vector2 } from 'three'

/**
 * The bowl, as a profile turned on a lathe — the way a potter makes one.
 *
 * Units are roughly "decimetres": the bowl is 2 wide and a little over 0.5
 * tall, which suits a medium dog bowl next to kibble pieces ~0.09 across.
 */

/** Inside surface, from the centre of the floor out to the rim. */
const INNER: [number, number][] = [
  [0.0, 0.085], [0.3, 0.088], [0.55, 0.1], [0.68, 0.14], [0.77, 0.22],
  [0.83, 0.32], [0.87, 0.43], [0.895, 0.51], [0.905, 0.545],
]

/** Rim lip, rolled over, then the outside wall down to the foot ring. */
const OUTER: [number, number][] = [
  [0.905, 0.545], [0.925, 0.568], [0.955, 0.575], [0.985, 0.565], [1.0, 0.54],
  [0.995, 0.47], [0.975, 0.36], [0.94, 0.24], [0.89, 0.13], [0.83, 0.05],
  [0.8, 0.018], [0.77, 0.004], [0.7, 0.0], [0.0, 0.0],
]

const smooth = (pts: [number, number][]) => pts.map(([x, y]) => new Vector2(x, y))

/** Lathe points for the glazed inside (cream). Ordered so normals face in. */
export const innerProfile = smooth([...INNER].reverse())
/** Lathe points for the outside (signature glaze). */
export const outerProfile = smooth(OUTER)

export const RIM_Y = 0.575
const FLOOR_Y = 0.088

/** Radius of the inside wall at height y (linear between profile points). */
export function innerRadiusAt(y: number): number {
  if (y <= INNER[0][1]) return INNER[1][0]
  for (let i = 1; i < INNER.length; i++) {
    const [x1, y1] = INNER[i]
    const [x0, y0] = INNER[i - 1]
    if (y <= y1) return x0 + ((y - y0) / Math.max(1e-6, y1 - y0)) * (x1 - x0)
  }
  return INNER[INNER.length - 1][0]
}

/** Small deterministic PRNG so the pile looks the same on every visit. */
export function prng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Rest positions for `count` kibble pieces, ordered bottom-up so that showing
 * the first N pieces always reads as "the bowl filled to that level".
 *
 * Poisson-style rejection sampling inside the bowl's inner volume, with a
 * gentle mound above the rim for a really full bowl.
 */
export function packKibble(count: number, piece = 0.085): Float32Array {
  const rand = prng(7)
  const out: number[] = []
  const minD = piece * 0.82
  const minD2 = minD * minD
  let attempts = 0
  while (out.length / 3 < count && attempts < count * 400) {
    attempts++
    // Bias samples low so the floor fills before the walls.
    const y = FLOOR_Y + piece * 0.45 + Math.pow(rand(), 1.35) * 0.62
    const moundTop = RIM_Y + 0.1
    if (y > moundTop) continue
    const rWall = y <= RIM_Y - 0.03
      ? innerRadiusAt(y) - piece * 0.55
      : (innerRadiusAt(RIM_Y - 0.03) - piece * 0.55) * (1 - (y - (RIM_Y - 0.03)) / (moundTop - RIM_Y + 0.03 + 1e-6))
    if (rWall <= 0) continue
    const r = Math.sqrt(rand()) * rWall
    const a = rand() * Math.PI * 2
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    let ok = true
    for (let i = 0; i < out.length; i += 3) {
      const dx = out[i] - x, dy = out[i + 1] - y, dz = out[i + 2] - z
      if (dx * dx + dy * dy + dz * dz < minD2) { ok = false; break }
    }
    if (ok) out.push(x, y, z)
  }
  // Fill order: lowest first, and from the middle outwards within a layer.
  const idx = Array.from({ length: out.length / 3 }, (_, i) => i)
  idx.sort((a, b) => {
    const ya = Math.round(out[a * 3 + 1] / (piece * 0.7))
    const yb = Math.round(out[b * 3 + 1] / (piece * 0.7))
    if (ya !== yb) return ya - yb
    return Math.hypot(out[a * 3], out[a * 3 + 2]) - Math.hypot(out[b * 3], out[b * 3 + 2])
  })
  const sorted = new Float32Array(idx.length * 3)
  idx.forEach((k, i) => { sorted.set(out.slice(k * 3, k * 3 + 3), i * 3) })
  return sorted
}
