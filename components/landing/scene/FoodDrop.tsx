'use client'

import { useMemo, useReducer, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, Group, LatheGeometry, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Vector2 } from 'three'
import { story, type Drop, type Verdict } from '../story'
import { RIM_Y } from './bowlShape'

const VERDICT_COLOR: Record<Verdict, string> = { safe: '#8FD9A8', caution: '#FFD98E', toxic: '#FF5F6D' }

/** Simple, readable food models — recognisable at a glance, cheap to draw. */
export function FoodModel({ model, verdict }: Pick<Drop, 'model' | 'verdict'>) {
  const mats = useMemo(() => ({
    grape: new MeshPhysicalMaterial({ color: '#4a1b57', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 }),
    stem: new MeshPhysicalMaterial({ color: '#5d6b2e', roughness: 0.7 }),
    choc: new MeshPhysicalMaterial({ color: '#4b2416', roughness: 0.32, clearcoat: 0.5 }),
    onion: new MeshPhysicalMaterial({ color: '#d7a8b6', roughness: 0.35, sheen: 1, sheenColor: new Color('#fff0f5'), clearcoat: 0.6 }),
    carrot: new MeshPhysicalMaterial({ color: '#f07a24', roughness: 0.55 }),
    leaf: new MeshPhysicalMaterial({ color: '#4f9a3a', roughness: 0.6 }),
    berry: new MeshPhysicalMaterial({ color: '#34407a', roughness: 0.55, sheen: 1, sheenColor: new Color('#b9c4ff') }),
    apple: new MeshPhysicalMaterial({ color: '#c3312c', roughness: 0.3, clearcoat: 1 }),
    token: new MeshPhysicalMaterial({ color: VERDICT_COLOR[verdict], roughness: 0.3, clearcoat: 1 }),
  }), [verdict])

  const lathe = useMemo(() => ({
    onion: new LatheGeometry([
      [0, -0.13], [0.06, -0.12], [0.12, -0.07], [0.145, 0.0], [0.12, 0.07], [0.06, 0.12], [0.02, 0.17], [0, 0.19],
    ].map(([x, y]) => new Vector2(x, y)), 40),
    carrot: new LatheGeometry([
      [0, -0.34], [0.02, -0.3], [0.045, -0.15], [0.06, 0.02], [0.068, 0.12], [0.06, 0.15], [0, 0.155],
    ].map(([x, y]) => new Vector2(x, y)), 32),
  }), [])

  switch (model) {
    case 'grape': {
      const pts: [number, number, number][] = [
        [0, 0.12, 0], [0.11, 0.08, 0.03], [-0.1, 0.08, -0.02], [0.05, -0.02, 0.09], [-0.06, 0, 0.08],
        [0.04, -0.03, -0.09], [0, -0.13, 0.01],
      ]
      return (
        <group>
          {pts.map((p, i) => (
            <mesh key={i} position={p} material={mats.grape} castShadow><sphereGeometry args={[0.07, 24, 16]} /></mesh>
          ))}
          <mesh position={[0, 0.24, 0]} material={mats.stem}><cylinderGeometry args={[0.008, 0.012, 0.12, 6]} /></mesh>
        </group>
      )
    }
    case 'chocolate':
      return (
        <group rotation={[0.3, 0.4, 0.15]}>
          {[-1, 0, 1].flatMap(x => [-0.5, 0.5].map(z => (
            <RoundedBox key={`${x}${z}`} args={[0.1, 0.045, 0.1]} radius={0.012} smoothness={3} position={[x * 0.106, 0, z * 0.106]} material={mats.choc} castShadow />
          )))}
        </group>
      )
    case 'onion':
      return <mesh geometry={lathe.onion} material={mats.onion} castShadow />
    case 'carrot':
      return (
        <group rotation={[0, 0, 0.9]}>
          <mesh geometry={lathe.carrot} material={mats.carrot} castShadow />
          {[-0.3, 0, 0.3].map(a => (
            <mesh key={a} position={[Math.sin(a) * 0.03, 0.22, 0]} rotation={[0, 0, a]} material={mats.leaf}>
              <coneGeometry args={[0.018, 0.16, 6]} />
            </mesh>
          ))}
        </group>
      )
    case 'blueberry':
      return (
        <group>
          {[[0, 0, 0], [0.1, 0.02, 0.04], [-0.06, 0.03, 0.08], [0.03, 0.08, -0.06]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} material={mats.berry} castShadow><sphereGeometry args={[0.055, 20, 14]} /></mesh>
          ))}
        </group>
      )
    case 'apple':
      return (
        <group>
          <mesh scale={[1, 0.86, 1]} material={mats.apple} castShadow><sphereGeometry args={[0.14, 32, 24]} /></mesh>
          <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0.2]} material={mats.stem}><cylinderGeometry args={[0.008, 0.01, 0.07, 6]} /></mesh>
        </group>
      )
    default:
      return <RoundedBox args={[0.22, 0.08, 0.22]} radius={0.035} smoothness={4} material={mats.token} castShadow />
  }
}

/**
 * One drop at a time: falls toward the bowl, then
 *   safe    → lands and settles on the kibble,
 *   caution → lands, then shrinks to a small portion ("only a little"),
 *   toxic   → the rim flashes red and it is knocked away.
 */
export default function FoodDrop() {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const current = useRef<Drop | null>(null)
  const ringMat = useMemo(() => new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), [])
  // Re-render only when a NEW drop arrives — never per frame.
  const [, force] = useReducer((n: number) => n + 1, 0)

  useFrame(() => {
    const d = story.drop
    if (d && d.id !== current.current?.id) {
      current.current = d
      force()
    }
    const g = group.current
    const r = ring.current
    const cur = current.current
    if (!g || !r || !cur) return

    const s = (performance.now() - cur.startedAt) / 1000
    const fallT = Math.min(1, s / 0.6)
    const fallY = 3.0 - (3.0 - (RIM_Y + 0.12)) * fallT * fallT
    ringMat.color.set(VERDICT_COLOR[cur.verdict])

    let x = 0, y = fallY, rz = s * 2.2, scale = 1
    let ringOpacity = 0
    const after = Math.max(0, s - 0.6)

    if (cur.verdict === 'toxic') {
      if (s > 0.6) {
        // Knocked away: up, sideways, spinning, gone.
        x = after * 2.6
        y = RIM_Y + 0.12 + after * 1.5 - after * after * 3.2
        rz = s * 2.2 + after * 9
        scale = Math.max(0, 1 - Math.max(0, after - 0.55) * 2.2)
      }
      ringOpacity = s > 0.5 ? Math.max(0, 0.9 - (s - 0.5) * 1.1) : 0
    } else {
      if (s > 0.6) {
        const land = Math.min(1, after / 0.35)
        y = RIM_Y + 0.12 - land * 0.04 + Math.sin(land * Math.PI) * 0.05
        rz = 2.2 * 0.6 + land * 0.4
        if (cur.verdict === 'caution') scale = 1 - Math.min(1, Math.max(0, after - 0.5) / 0.6) * 0.55
      }
      ringOpacity = s > 0.5 ? Math.max(0, 0.6 - (s - 0.5) * 0.6) : 0
    }

    g.position.set(x, y, 0.05)
    g.rotation.set(0.2, s * 0.6, rz)
    g.scale.setScalar(story.reducedMotion ? 1 : scale)
    ringMat.opacity = ringOpacity
    r.scale.setScalar(1 + (1 - ringOpacity) * 0.08)
    g.visible = scale > 0.01
  })

  return (
    <>
      <group ref={group}>
        {current.current && <FoodModel key={current.current.id} model={current.current.model} verdict={current.current.verdict} />}
      </group>
      <mesh ref={ring} position={[0, RIM_Y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
        <torusGeometry args={[0.97, 0.014, 8, 96]} />
      </mesh>
    </>
  )
}
