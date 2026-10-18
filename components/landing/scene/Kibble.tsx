'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color, IcosahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D, Euler, Quaternion, Vector3,
} from 'three'
import { packKibble, prng } from './bowlShape'
import { story } from '../story'

const FALL_S = 0.62
const SHRINK_S = 0.22
/** Pieces released per second while pouring. */
const POUR_RATE = 160
const BROWNS = ['#8a5631', '#9a6339', '#7b4626', '#a8733f', '#6f3f22', '#b9844b']

/** One lumpy piece of kibble: an icosphere pushed about by a little noise. */
function kibbleGeometry() {
  const g = new IcosahedronGeometry(0.046, 2)
  const p = g.attributes.position
  const rand = prng(3)
  const bumps = Array.from({ length: 6 }, () => new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize())
  const v = new Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = v.clone().normalize()
    let d = 0
    for (const b of bumps) d += Math.max(0, n.dot(b)) ** 6 * 0.18
    v.multiplyScalar(1 + d - 0.05)
    v.set(v.x, v.y * 0.62, v.z * 0.92)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

export default function Kibble({ max }: { max: number }) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(kibbleGeometry, [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.78, metalness: 0 }), [])
  const rest = useMemo(() => packKibble(max), [max])
  const count = rest.length / 3

  // Per-piece state lives in typed arrays, not objects, so the frame loop
  // allocates nothing.
  const state = useMemo(() => {
    const rand = prng(11)
    const rot = new Float32Array(count * 3)
    const spin = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      rot[i] = rand() * Math.PI * 2
      spin[i] = (rand() - 0.5) * 9
    }
    return {
      rot, spin,
      startedAt: new Float32Array(count).fill(-1),
      leavingAt: new Float32Array(count).fill(-1),
      active: new Set<number>(),
      shown: 0,
      carry: 0,
    }
  }, [count])

  const tmp = useMemo(() => ({ o: new Object3D(), e: new Euler(), q: new Quaternion() }), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const rand = prng(5)
    const c = new Color()
    for (let i = 0; i < count; i++) {
      c.set(BROWNS[Math.floor(rand() * BROWNS.length)]).offsetHSL(0, 0, (rand() - 0.5) * 0.04)
      mesh.setColorAt(i, c)
      tmp.o.position.set(0, -10, 0)
      tmp.o.scale.setScalar(0)
      tmp.o.updateMatrix()
      mesh.setMatrixAt(i, tmp.o.matrix)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.instanceMatrix.needsUpdate = true
  }, [count, tmp])

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const now = performance.now() / 1000
    const s = state
    const target = Math.max(0, Math.min(count, Math.round(story.kibble)))

    if (target > s.shown) {
      if (story.reducedMotion) {
        for (let i = s.shown; i < target; i++) { s.startedAt[i] = now - FALL_S; s.leavingAt[i] = -1; s.active.add(i) }
        s.shown = target
      } else {
        s.carry += POUR_RATE * Math.min(delta, 0.05)
        const n = Math.min(target - s.shown, Math.floor(s.carry))
        s.carry -= n
        for (let k = 0; k < n; k++) {
          const i = s.shown + k
          s.startedAt[i] = now - k * 0.004
          s.leavingAt[i] = -1
          s.active.add(i)
        }
        s.shown += n
      }
    } else if (target < s.shown) {
      for (let i = target; i < s.shown; i++) {
        if (s.leavingAt[i] < 0) { s.leavingAt[i] = now; s.active.add(i) }
      }
      s.shown = target
      s.carry = 0
    }

    if (s.active.size === 0) return
    const { o, e, q } = tmp
    for (const i of s.active) {
      const rx = rest[i * 3], ry = rest[i * 3 + 1], rz = rest[i * 3 + 2]
      let scale = 1
      let done = false
      let fall = 1
      if (s.leavingAt[i] >= 0) {
        const k = Math.min(1, (now - s.leavingAt[i]) / SHRINK_S)
        scale = 1 - k
        if (k >= 1) { scale = 0; done = true }
      } else {
        fall = Math.min(1, Math.max(0, (now - s.startedAt[i]) / FALL_S))
        if (fall >= 1) done = true
      }
      // Falls from a narrow pour stream above the bowl, lands with a small settle.
      const inv = 1 - fall
      const eased = 1 - inv * inv * inv
      const settle = fall < 1 ? Math.sin(fall * Math.PI) * 0.05 * (1 - fall) : 0
      o.position.set(
        rx * (0.25 + 0.75 * eased),
        ry + (1 - eased) * 2.4 + settle,
        rz * (0.25 + 0.75 * eased),
      )
      const spinAmt = (1 - eased) * 1.6
      e.set(
        s.rot[i * 3] + s.spin[i * 3] * spinAmt,
        s.rot[i * 3 + 1] + s.spin[i * 3 + 1] * spinAmt,
        s.rot[i * 3 + 2] + s.spin[i * 3 + 2] * spinAmt,
      )
      q.setFromEuler(e)
      o.quaternion.copy(q)
      o.scale.setScalar(scale * (fall < 0.05 ? fall * 20 : 1))
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
      if (done) {
        s.active.delete(i)
        if (scale === 0) s.leavingAt[i] = -1
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}
