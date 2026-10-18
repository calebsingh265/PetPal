'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { CanvasTexture, NeutralToneMapping } from 'three'
import Bowl from './Bowl'
import Kibble from './Kibble'
import FoodDrop, { FoodModel } from './FoodDrop'
import Tag from './Tag'
import Rig, { TAG_POS } from './Rig'
import { MAX_KIBBLE, type Tier } from '../story'

const INK = '#0D0A14'

const WARM_MODELS = ['grape', 'chocolate', 'onion', 'carrot', 'blueberry', 'apple', 'token'] as const

/**
 * Compiles every shader the page will ever need BEFORE the scene is shown.
 *
 * Without this, each material compiled on first sight, and the browser
 * blocked for 400-700 ms while the GPU linked the program — a visible freeze
 * mid-scroll (measured with a performance trace). compileAsync waits for the
 * driver to finish in the background instead; the canvas fades in only
 * afterwards. Every food model is mounted once, out of sight, so the first
 * "Drop it" does not stall either.
 */
function Warmup({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree()
  const [warming, setWarming] = useState(true)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    let alive = true
    const id = requestAnimationFrame(async () => {
      try { await gl.compileAsync(scene, camera) } catch { /* compile on first use instead */ }
      if (!alive) return
      gl.render(scene, camera) // also builds the shadow-map programs
      setWarming(false)
      done.current()
    })
    return () => { alive = false; cancelAnimationFrame(id) }
  }, [gl, scene, camera])
  if (!warming) return null
  return (
    <group position={[0, 0.6, 0.4]} scale={0.001}>
      {WARM_MODELS.map(m => <FoodModel key={m} model={m} verdict="safe" />)}
    </group>
  )
}

/**
 * The fixed WebGL layer behind the landing page.
 *
 * pointer-events are off, so it never steals a scroll or a click. `paused`
 * stops the render loop entirely while an opaque paper section covers it —
 * there is no point drawing a scene nobody can see.
 */
export default function BowlCanvas({
  tier, paused, onReady, onFail,
}: { tier: Tier; paused: boolean; onReady: () => void; onFail: () => void }) {
  const maxDpr = tier === 'high' ? 2 : tier === 'medium' ? 1.5 : 1
  const [dpr, setDpr] = useState(Math.min(maxDpr, typeof window !== 'undefined' ? window.devicePixelRatio : 1))
  const shadows = tier !== 'low'
  const contactShadow = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128)
    grad.addColorStop(0, 'rgba(0,0,0,0.75)')
    grad.addColorStop(0.5, 'rgba(0,0,0,0.35)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
    return new CanvasTexture(c)
  }, [])

  return (
    <Canvas
      className="!fixed inset-0 !pointer-events-none"
      dpr={dpr}
      shadows={shadows}
      frameloop={paused ? 'never' : 'always'}
      camera={{ fov: 32, near: 0.1, far: 80, position: [1.13, 2.55, 4.41] }}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', toneMapping: NeutralToneMapping }}
      onCreated={({ gl }) => {
        // Synchronous shader-error checks stall the main thread; dev only.
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production'
        // A software renderer would be a slideshow — use the still layout.
        const info = gl.getContext()
        const ext = info.getExtension('WEBGL_debug_renderer_info')
        const renderer = ext ? String(info.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
        if (/swiftshader|llvmpipe|software/i.test(renderer) && !location.search.includes('force3d')) onFail()
      }}
    >
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 11, 30]} />

      <PerformanceMonitor
        onDecline={() => setDpr(d => Math.max(1, d - 0.5))}
        onIncline={() => setDpr(d => Math.min(maxDpr, d + 0.25))}
      />

      <hemisphereLight args={['#fff1e3', '#2a1c2e', 0.35]} />
      <directionalLight
        position={[2.6, 4.2, 2.2]}
        intensity={2.4}
        color="#ffe6cf"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />
      {/* Cool rim from behind, in the app's lavender, to separate the bowl from the dark. */}
      <directionalLight position={[-3, 1.8, -3]} intensity={1.6} color="#a9a6ff" />

      <Suspense fallback={null}>
        <Environment resolution={256} frames={1} environmentIntensity={1.15}>
          <Lightformer form="rect" intensity={2.2} color="#fff3e6" position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#ffd9b8" position={[4, 1.5, 2]} rotation-y={-Math.PI / 2.5} scale={[2, 4, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[-3, 2, 3]} scale={1.4} />
          <Lightformer form="rect" intensity={0.8} color="#8e8bf5" position={[-4, 1, -2]} rotation-y={Math.PI / 2.5} scale={[2, 3, 1]} />
          {/* A broad warm panel in front, so polished steel has something bright to reflect. */}
          <Lightformer form="rect" intensity={1.1} color="#f6e7d6" position={[0, 0.5, 6]} scale={[10, 4, 1]} />
        </Environment>

        <group>
          <Bowl />
          <Kibble max={MAX_KIBBLE[tier]} />
          <FoodDrop />
          {/* Floor: catches the bowl's shadow, fades into the dark with the fog. */}
          <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} receiveShadow>
            <circleGeometry args={[60, 64]} />
            <meshStandardMaterial color="#251c2b" roughness={0.92} />
          </mesh>
          {/* A soft contact shadow so the bowl sits ON the floor rather than
              floating — painted once into a texture, no extra render pass. */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 0]}>
            <planeGeometry args={[3.4, 3.4]} />
            <meshBasicMaterial map={contactShadow} transparent depthWrite={false} />
          </mesh>
        </group>

        <group position={TAG_POS}>
          <Tag />
          <pointLight position={[0.9, 0.7, 1.8]} intensity={6} color="#ffd9b8" distance={7} />
          <pointLight position={[-1.4, -0.4, 1.2]} intensity={2.5} color="#a9a6ff" distance={6} />
        </group>

        {/* Last inside the same Suspense boundary, so it only runs once the
            lighting environment and every model above it exist. */}
        <Warmup onDone={onReady} />
      </Suspense>

      <Rig />
    </Canvas>
  )
}
