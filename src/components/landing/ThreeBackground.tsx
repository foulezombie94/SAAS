'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  Float, 
  MeshTransmissionMaterial, 
  PerspectiveCamera,
  Environment,
  Sparkles
} from '@react-three/drei'
import * as THREE from 'three'

function CentralMonolith({ scrollY }: { scrollY: any }) {
  const mesh = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    // Slow organic rotation
    mesh.current.rotation.x = time * 0.1
    mesh.current.rotation.y = time * 0.15
    
    // Scroll reaction: Scale and slight position shift
    const scrollProgress = scrollY.get()
    const scale = 1.5 + scrollProgress * 0.5
    mesh.current.scale.set(scale, scale, scale)
    mesh.current.position.y = -scrollProgress * 2
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 15]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={1}
          chromaticAberration={0.1}
          anisotropy={0.3}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.2}
          ior={1.2}
          color="#ffffff"
          roughness={0.1}
          transmission={1}
        />
      </mesh>
    </Float>
  )
}

function SmallFloatingShapes({ scrollY }: { scrollY: any }) {
  const shapes = useMemo(() => [
    { position: [5, 3, -5], scale: 0.2, speed: 0.5 },
    { position: [-6, -2, -4], scale: 0.3, speed: 0.8 },
    { position: [4, -5, -6], scale: 0.25, speed: 0.6 },
  ], [])

  return (
    <>
      {shapes.map((s, i) => (
        <Float key={i} speed={s.speed} position={s.position as any}>
          <mesh scale={s.scale}>
            <dodecahedronGeometry />
            <meshStandardMaterial color="#002878" wireframe />
          </mesh>
        </Float>
      ))}
    </>
  )
}

export default function ThreeBackground({ scrollY }: { scrollY: any }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] bg-black">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={35} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#ffffff" castShadow />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#002878" />
        
        <CentralMonolith scrollY={scrollY} />
        <SmallFloatingShapes scrollY={scrollY} />
        
        <Sparkles count={100} scale={15} size={1} speed={0.4} color="#ffffff" />
        
        <Environment preset="night" />
      </Canvas>
      
      {/* Film Grain / Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)]" />
    </div>
  )
}
