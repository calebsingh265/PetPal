'use client'

import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { story } from '../story'

/** Where the ID tag hangs — far enough away that the bowl is never in shot. */
export const TAG_POS: [number, number, number] = [0, 0.95, -14]

type Key = { t: number; cam: [number, number, number]; look: [number, number, number] }

/*
 * Camera choreography, keyed by scene time. Between keys the camera eases
 * (smoothstep), then is damped toward the target every frame, so scrolling
 * fast or reversing never snaps. Wide screens put the bowl beside the copy;
 * tall screens put it under the copy.
 *
 * Positions are worked out from the lens (32° vertical field of view): the
 * camera stands far enough back that the bowl fills roughly 40% of a wide
 * screen, and the look-at point is shifted sideways along the camera's own
 * right vector so the bowl sits beside the copy instead of behind it.
 */
const WIDE: Key[] = [
  { t: 0, cam: [1.13, 2.55, 4.41], look: [-0.77, 0.3, 0.36] },     // hero: bowl right of the headline
  { t: 1, cam: [0.73, 5.04, 3.65], look: [-0.77, 0.3, 0.35] },     // portions: from above, bowl right of the panel
  { t: 2, cam: [-1.64, 2.12, 4.64], look: [0.7, 0.35, 0.38] },     // food check: low, bowl left of the card
  { t: 3, cam: [-0.6, 3.4, 7.2], look: [0.4, 0.4, 0.4] },          // (covered by paper)
  { t: 5, cam: [TAG_POS[0] + 2, TAG_POS[1] + 0.8, TAG_POS[2] + 6], look: TAG_POS },
  { t: 6, cam: [TAG_POS[0] + 0.68, TAG_POS[1] + 0.12, TAG_POS[2] + 3.4], look: [TAG_POS[0] + 0.68, TAG_POS[1], TAG_POS[2]] },
]

/* Phones: the copy takes the top of the screen, the bowl sits below it. */
const TALL: Key[] = [
  { t: 0, cam: [2.6, 4.8, 8.4], look: [0, 1.7, 0] },
  { t: 1, cam: [1.2, 7.6, 5.4], look: [0, 1.3, 0] },
  { t: 2, cam: [-2.6, 3.7, 8.0], look: [0, 1.6, 0] },
  { t: 3, cam: [-1.5, 4.5, 9.5], look: [0, 1.3, 0] },
  { t: 5, cam: [TAG_POS[0] + 1, TAG_POS[1] + 0.5, TAG_POS[2] + 8], look: TAG_POS },
  { t: 6, cam: [TAG_POS[0], TAG_POS[1] - 0.8, TAG_POS[2] + 7.1], look: [TAG_POS[0], TAG_POS[1] - 1.0, TAG_POS[2]] },
]

const smooth = (x: number) => x * x * (3 - 2 * x)

function sample(keys: Key[], t: number, cam: Vector3, look: Vector3) {
  if (t <= keys[0].t) { cam.set(...keys[0].cam); look.set(...keys[0].look); return }
  const last = keys[keys.length - 1]
  if (t >= last.t) { cam.set(...last.cam); look.set(...last.look); return }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i]
    if (t <= b.t) {
      const k = smooth((t - a.t) / (b.t - a.t))
      cam.set(
        a.cam[0] + (b.cam[0] - a.cam[0]) * k,
        a.cam[1] + (b.cam[1] - a.cam[1]) * k,
        a.cam[2] + (b.cam[2] - a.cam[2]) * k,
      )
      look.set(
        a.look[0] + (b.look[0] - a.look[0]) * k,
        a.look[1] + (b.look[1] - a.look[1]) * k,
        a.look[2] + (b.look[2] - a.look[2]) * k,
      )
      return
    }
  }
}

export default function Rig() {
  const { camera, size } = useThree()
  const v = useMemo(() => ({
    cam: new Vector3(), look: new Vector3(), curLook: new Vector3(-0.77, 0.3, 0.36), ready: false,
  }), [])

  useFrame((_, delta) => {
    const keys = size.width / size.height < 0.9 ? TALL : WIDE
    sample(keys, story.t, v.cam, v.look)
    // A little parallax from the pointer — never while reduced motion is on.
    if (!story.reducedMotion) {
      v.cam.x += story.pointer.x * 0.18
      v.cam.y += story.pointer.y * 0.1
    }
    if (!v.ready || story.reducedMotion) {
      camera.position.copy(v.cam)
      v.curLook.copy(v.look)
      v.ready = true
    } else {
      const k = 1 - Math.exp(-Math.min(delta, 0.05) * 5)
      camera.position.lerp(v.cam, k)
      v.curLook.lerp(v.look, k)
    }
    camera.lookAt(v.curLook)
  })

  return null
}
