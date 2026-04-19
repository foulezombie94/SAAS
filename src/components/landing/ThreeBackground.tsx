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
  // MainLabs-style Camera Movement: Deep Dolly Zoom
  // Camera moves forward as we scroll
  const cameraZ = useTransform(scrollY, [0, 1], [10, -5])
  const cameraRotationX = useTransform(scrollY, [0, 1], [0, -0.3])
  const fov = useTransform(scrollY, [0, 0.5, 1], [45, 55, 35])

  useFrame((state) => {
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraZ.get(), 0.05)
    state.camera.rotation.x = THREE.MathUtils.lerp(state.camera.rotation.x, cameraRotationX.get(), 0.05)
    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, fov.get(), 0.05)
      state.camera.updateProjectionMatrix()
    }
  })

  return null
}

function FloatingShape({ scrollY, position, color, delay = 0, scale = 1 }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  // High-end MainLabs blur effects: chromatic aberration and thickness shifts
  const thickness = useTransform(scrollY, [0, 0.4, 0.6, 1], [1, 5, 5, 1])
  const chromaticAberration = useTransform(scrollY, [0, 0.4, 0.6, 1], [0.05, 0.4, 0.4, 0.05])
  const transmission = useTransform(scrollY, [0, 0.5, 1], [1, 0.8, 1])

  useFrame((state) => {
    const time = state.clock.getElapsedTime() + delay
    const s = scrollY.get()
    
    // Smooth floating and reaction to scroll
    meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.2 + s * 0.5
    meshRef.current.rotation.y = Math.cos(time * 0.3) * 0.2 + s * 0.8
    
    // FLY GLIDE: Objects move past the camera slightly on scroll
    meshRef.current.position.z = position[2] + s * 15
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.2
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <RoundedBox 
        ref={meshRef} 
        args={[2, 4, 0.1]} 
        radius={0.1} 
        smoothness={4}
        position={position} 
        scale={scale}
      >
        <MeshTransmissionMaterial
          backside
          samples={16} // High quality blur
          thickness={thickness.get()}
          roughness={0.05}
          transmission={transmission.get()}
          chromaticAberration={chromaticAberration.get()}
          anisotropy={1.5}
          distortion={0.3}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color={color}
        />
      </RoundedBox>
    </Float>
  )
}

export default function ThreeBackground({ scrollY }: { scrollY: any }) {
  const shapes = useMemo(() => [
    { position: [0, 0, 0] as [number, number, number], color: "#ffffff", scale: 1 },
    { position: [-6, 3, -4] as [number, number, number], color: "#002878", scale: 0.8, delay: 1 },
    { position: [6, -2, -2] as [number, number, number], color: "#ef9900", scale: 0.7, delay: 2 },
    { position: [-4, -4, -6] as [number, number, number], color: "#cbd5e1", scale: 1.2, delay: 3 },
    { position: [5, 5, -8] as [number, number, number], color: "#002878", scale: 0.9, delay: 4 },
  ], [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] bg-white">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
        <SceneController scrollY={scrollY} />
        
        <color attach="background" args={['#ffffff']} />
        <fog attach="fog" args={['#ffffff', 5, 20]} />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[15, 20, 5]} angle={0.2} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -5, -5]} intensity={1} color="#002878" />

        {shapes.map((s, i) => (
          <FloatingShape key={i} scrollY={scrollY} {...s} />
        ))}

        <Sparkles 
          count={250} 
          scale={20} 
          size={2.5} 
          speed={0.6} 
          opacity={0.4} 
          color="#002878" 
        />
        
        <Environment preset="city" />
      </Canvas>
      
      {/* Noise overlay for cinematic texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://res.cloudinary.com/dvwvkt76a/image/upload/v1713532467/noise_tvxq9j.png')] mix-blend-overlay" />
    </div>
  )
}
