'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  MeshTransmissionMaterial, 
  Environment,
  Sparkles,
  Float,
  PerspectiveCamera,
  RoundedBox
} from '@react-three/drei'
import * as THREE from 'three'
import { useTransform } from 'framer-motion'

function SceneController({ scrollY }: { scrollY: any }) {
  // FORWARD CHASE: Camera moves slightly back as objects fly past
  const cameraZ = useTransform(scrollY, [0, 1], [15, 30])
  const fov = useTransform(scrollY, [0, 0.5, 1], [35, 45, 60]) // Wider FOV as things come closer

  useFrame((state) => {
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraZ.get(), 0.05)
    
    // Immersive tilt
    state.camera.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05

    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, fov.get(), 0.05)
      state.camera.updateProjectionMatrix()
    }
  })

  return null
}

function FloatingShape({ scrollY, position, color, delay = 0, scale = 1 }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  // High-performance mapping for thickness and distortion - FORWARD sync
  const thickness = useTransform(scrollY, 
    [0, 0.4, 0.6, 1], 
    [2, 4, 3, 2]
  )
  
  const distortion = useTransform(scrollY, 
    [0, 0.4, 0.6, 1], 
    [0.1, 0.5, 0.3, 0.1]
  )

  useFrame((state) => {
    const time = state.clock.getElapsedTime() + delay
    const s = scrollY.get()
    
    if (!meshRef.current) return

    // Elements fly FORWARDS (towards viewer)
    meshRef.current.rotation.x = time * 0.1 + s * 2
    meshRef.current.rotation.z = time * 0.05 + s * 3
    
    // FLY THROUGH: Start deep (-60), fly past camera (+40)
    meshRef.current.position.z = position[2] - 40 + s * 100 
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.2
  })

  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.3}>
      <RoundedBox 
        ref={meshRef} 
        args={[2, 4, 0.1]} 
        radius={0.05} 
        smoothness={4}
        position={position} 
        scale={scale}
      >
        <MeshTransmissionMaterial
          backside
          samples={6} 
          thickness={thickness.get()}
          roughness={0.08}
          transmission={1}
          chromaticAberration={0.3}
          anisotropy={0.1}
          distortion={distortion.get()}
          distortionScale={0.3}
          temporalDistortion={0.05}
          color={color}
        />
      </RoundedBox>
    </Float>
  )
}

export default function ThreeBackground({ scrollY }: { scrollY: any }) {
  const shapes = useMemo(() => [
    { position: [0, 0, 0] as [number, number, number], color: "#ffffff", scale: 1 },
    { position: [-12, 6, -10] as [number, number, number], color: "#002878", scale: 0.8, delay: 1 },
    { position: [12, -6, -5] as [number, number, number], color: "#ef9900", scale: 0.7, delay: 2 },
    { position: [-10, -10, -30] as [number, number, number], color: "#cbd5e1", scale: 2.5, delay: 3 },
    { position: [15, 12, -50] as [number, number, number], color: "#002878", scale: 1.5, delay: 4 },
  ], [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] bg-white">
      <Canvas 
        shadows={false}
        dpr={1.5}
        gl={{ 
          antialias: false,
          alpha: true, 
          stencil: false, 
          depth: true,
          powerPreference: "high-performance"
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={35} />
        <SceneController scrollY={scrollY} />
        
        <color attach="background" args={['#ffffff']} />
        <fog attach="fog" args={['#ffffff', 5, 120]} />
        
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 5]} intensity={1} color="#002878" />

        {shapes.map((s, i) => (
          <FloatingShape key={i} scrollY={scrollY} {...s} />
        ))}

        <Sparkles 
          count={100}
          scale={[40, 40, 150]} 
          size={2} 
          speed={0.2} 
          opacity={0.1} 
          color="#002878" 
        />
        
        <Environment preset="studio" />
      </Canvas>
      
      {/* Dynamic grain/noise overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://res.cloudinary.com/dvwvkt76a/image/upload/v1713532467/noise_tvxq9j.png')] mix-blend-overlay" />
    </div>
  )
}
