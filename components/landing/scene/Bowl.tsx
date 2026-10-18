'use client'

import { useMemo } from 'react'
import { DoubleSide, LatheGeometry, MeshPhysicalMaterial, Color } from 'three'
import { innerProfile, outerProfile } from './bowlShape'

/**
 * Speckled stoneware glaze. A physical material with a clearcoat (the wet,
 * glassy top layer of a fired glaze) plus a few lines of shader that scatter
 * iron speckles through the colour, the way a real reactive glaze does.
 * Done in the material, so it costs nothing per frame.
 */
function glaze(color: string, speckle: string, roughness: number) {
  const m = new MeshPhysicalMaterial({
    color: new Color(color),
    roughness,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    sheen: 0.25,
    sheenColor: new Color('#fff1e0'),
  })
  m.onBeforeCompile = shader => {
    shader.uniforms.uSpeckle = { value: new Color(speckle) }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vObjPos;
        uniform vec3 uSpeckle;
        float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float h = hash3(floor(vObjPos * 140.0));
          float speck = step(0.986, h);
          float h2 = hash3(floor(vObjPos * 38.0) + 7.0);
          float mottle = smoothstep(0.2, 0.9, h2) * 0.06;
          diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - mottle), uSpeckle, speck * 0.75);
        }`)
  }
  return m
}

export default function Bowl() {
  const { inner, outer, innerMat, outerMat } = useMemo(() => ({
    inner: new LatheGeometry(innerProfile, 96),
    outer: new LatheGeometry(outerProfile, 96),
    innerMat: (() => { const m = glaze('#F3E7D6', '#6b4a33', 0.32); m.side = DoubleSide; return m })(),
    outerMat: glaze('#E8875A', '#5a2a15', 0.38),
  }), [])

  return (
    <group>
      <mesh geometry={outer} material={outerMat} castShadow receiveShadow />
      <mesh geometry={inner} material={innerMat} receiveShadow />
    </group>
  )
}
