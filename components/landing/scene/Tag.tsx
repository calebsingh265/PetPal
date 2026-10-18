'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  CanvasTexture, ExtrudeGeometry, Group, MeshPhysicalMaterial, Path, Shape, SRGBColorSpace,
} from 'three'
import { story } from '../story'

/** Bone-shaped outline — the classic pet ID tag. Units match the bowl. */
function boneShape() {
  const r = 0.19
  const s = new Shape()
  s.moveTo(-0.31, 0.12)
  s.lineTo(0.31, 0.12)
  s.absarc(0.5, 0.13, r, Math.PI + 0.0526, -0.753, true)
  s.absarc(0.5, -0.13, r, 0.753, -Math.PI - 0.0526, true)
  s.lineTo(-0.31, -0.12)
  s.absarc(-0.5, -0.13, r, 0.0526, 2.388 - Math.PI * 2, true)
  s.absarc(-0.5, 0.13, r, -2.388, -0.0526 - Math.PI * 2, true)
  const hole = new Path()
  hole.absarc(-0.53, 0.16, 0.045, 0, Math.PI * 2, false)
  s.holes.push(hole)
  return s
}

const BOX = { minX: -0.7, minY: -0.33, w: 1.4, h: 0.66 }

function drawEngraving(ctx: CanvasRenderingContext2D, name: string) {
  const { width: W, height: H } = ctx.canvas
  // Light background = polished steel, dark = engraved groove.
  ctx.fillStyle = '#d9d4cb'
  ctx.fillRect(0, 0, W, H)
  const shown = name.trim() || 'Your pet'
  ctx.fillStyle = '#3b3631'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 150
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-pp-display').trim() || 'Georgia'
  ctx.font = `italic 500 ${size}px ${family}, Georgia, serif`
  while (ctx.measureText(shown).width > W * 0.6 && size > 60) {
    size -= 6
    ctx.font = `italic 500 ${size}px ${family}, Georgia, serif`
  }
  // flipY (the default) already puts the canvas the right way up on the
  // front face of the tag.
  ctx.save()
  ctx.translate(W * 0.52, H * 0.47)
  ctx.fillText(shown, 0, 0)
  ctx.font = `500 30px ui-monospace, monospace`
  ctx.globalAlpha = 0.75
  ctx.fillText('PETPAL · IF FOUND, PLEASE CALL', 0, size * 0.62)
  ctx.restore()
}

export default function Tag() {
  const group = useRef<Group>(null)
  const version = useRef(-1)

  const { geometry, material, texture, ctx } = useMemo(() => {
    const geometry = new ExtrudeGeometry(boneShape(), {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.014, bevelSegments: 5, curveSegments: 48,
    })
    geometry.center()
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    // Extrude caps use the shape's x/y as UVs; map that box onto 0..1.
    texture.repeat.set(1 / BOX.w, 1 / BOX.h)
    texture.offset.set(-BOX.minX / BOX.w, -BOX.minY / BOX.h)
    const material = new MeshPhysicalMaterial({
      color: '#f6f1ea', metalness: 0.82, roughness: 0.3, map: texture,
      bumpMap: texture, bumpScale: 1.2, clearcoat: 0.6, clearcoatRoughness: 0.2,
    })
    return { geometry, material, texture, ctx }
  }, [])

  useEffect(() => () => { geometry.dispose(); material.dispose(); texture.dispose() }, [geometry, material, texture])

  useFrame(({ clock }) => {
    if (version.current !== story.tagVersion) {
      version.current = story.tagVersion
      drawEngraving(ctx, story.tagName)
      texture.needsUpdate = true
    }
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime
    const calm = story.reducedMotion ? 0 : 1
    g.rotation.y = -0.35 + Math.sin(t * 0.6) * 0.18 * calm + story.pointer.x * 0.25
    g.rotation.x = -0.08 + story.pointer.y * 0.12
    g.rotation.z = Math.sin(t * 0.9) * 0.04 * calm
  })

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} castShadow />
      {/* Split ring through the hole */}
      <mesh position={[-0.53, 0.18, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.1, 0.012, 12, 48]} />
        <meshPhysicalMaterial color="#d8d2c8" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  )
}
