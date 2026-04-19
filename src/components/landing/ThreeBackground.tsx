'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  Float, 
  MeshDistortMaterial, 
  MeshTransmissionMaterial, 
  PerspectiveCamera,
  Environment
} from '@react-three/drei'
import * as THREE from 'three'

function FloatingShape({ shape, color, position, rotation, speed, scrollY }: any) {
  const mesh = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    mesh.current.rotation.x = rotation[0] + time * speed * 0.2
    mesh.current.rotation.y = rotation[1] + time * speed * 0.3
    
    // Scroll reaction: Move up/down and rotate based on scroll
    const scrollEffect = scrollY.get() * 2
    mesh.current.position.y = position[1] - scrollEffect * speed * 0.5
    mesh.current.rotation.z += scrollEffect * 0.001
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={mesh} position={position} rotation={rotation}>
        {shape === 'torus' && <torusKnotGeometry args={[1, 0.3, 128, 32]} />}
        {shape === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {shape === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
        
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.06}
          anisotropy={0.1}
          distortion={0.3}
          distortionScale={0.3}
          temporalDistortion={0.5}
          ior={1.2}
          color={color}
          roughness={0}
          transmission={1}
        />
      </mesh>
    </Float>
  )
}

export default function ThreeBackground({ scrollY }: { scrollY: any }) {
  const shapes = useMemo(() => [
    { shape: 'torus', color: '#002878', position: [4, 2, -2], rotation: [0.5, 0.5, 0], speed: 1.2 },
    { shape: 'icosahedron', color: '#ef9900', position: [-5, -1, -3], rotation: [0, 1, 0.5], speed: 0.8 },
    { shape: 'dodecahedron', color: '#002878', position: [2, -4, -1], rotation: [1, 0.2, 0], speed: 1.5 },
    { shape: 'torus', color: '#ffffff', position: [-3, 4, -4], rotation: [0.2, 0, 1], speed: 1 },
  ], [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#002878" />
        
        {shapes.map((s, i) => (
          <FloatingShape key={i} {...s} scrollY={scrollY} />
        ))}
        
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
