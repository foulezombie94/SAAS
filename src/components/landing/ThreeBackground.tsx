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
  // MainLabs Dolly Zoom: Moves deeper into the 'Void' as we scroll
  const cameraZ = useTransform(scrollY, [0, 1], [12, -40])
  const cameraRotationX = useTransform(scrollY, [0, 0.5, 1], [0, -0.2, -0.1])
  const fov = useTransform(scrollY, [0, 0.2, 0.4, 0.6, 0.8, 1], [40, 55, 40, 60, 40, 30])

  useFrame((state) => {
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraZ.get(), 0.05)
    state.camera.rotation.x = THREE.MathUtils.lerp(state.camera.rotation.x, cameraRotationX.get(), 0.05)
    
    // Dimension Shudder effect
    const shudder = Math.sin(scrollY.get() * Math.PI * 10) * 0.02 * (Math.sin(scrollY.get() * Math.PI) > 0.9 ? 1 : 0)
    state.camera.position.x = shudder

    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, fov.get(), 0.1)
      state.camera.updateProjectionMatrix()
    }
  })

  return null
}

function FloatingShape({ scrollY, position, color, delay = 0, scale = 1 }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  // Transition logic: Thickness and Distortion spike during 'Dimension Jumps'
  // We simulate jumps at 20%, 40%, 60%, 80% scroll
  const thickness = useTransform(scrollY, 
    [0, 0.18, 0.22, 0.38, 0.42, 0.58, 0.62, 0.78, 0.82, 1], 
    [2, 8, 2, 8, 2, 8, 2, 8, 2, 2]
  )
  
  const distortion = useTransform(scrollY, 
    [0, 0.18, 0.22, 0.38, 0.42, 0.58, 0.62, 0.78, 0.82, 1], 
    [0.2, 2.0, 0.2, 2.0, 0.2, 2.0, 0.2, 2.0, 0.2, 0.2]
  )

  useFrame((state) => {
    const time = state.clock.getElapsedTime() + delay
    const s = scrollY.get()
    
    if (!meshRef.current) return

    // Float + Scroll-influenced rotation
    meshRef.current.rotation.x = Math.sin(time * 0.15) * 0.1 + s * 4
    meshRef.current.rotation.y = Math.cos(time * 0.2) * 0.1 + s * 6
    
    // Objects fly past the camera faster during transitions
    meshRef.current.position.z = position[2] + s * 50
    meshRef.current.position.y = position[1] + Math.sin(time * 0.4) * 0.5
  })

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
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
          samples={16}
          thickness={thickness.get()}
          roughness={0.02}
          transmission={1}
          chromaticAberration={0.5}
          anisotropy={2}
          distortion={distortion.get()}
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
    { position: [0, 0, 2] as [number, number, number], color: "#ffffff", scale: 1 },
    { position: [-8, 4, -5] as [number, number, number], color: "#002878", scale: 0.8, delay: 1 },
    { position: [8, -3, -2] as [number, number, number], color: "#ef9900", scale: 0.7, delay: 2 },
    { position: [-5, -6, -10] as [number, number, number], color: "#cbd5e1", scale: 1.5, delay: 3 },
    { position: [6, 7, -15] as [number, number, number], color: "#002878", scale: 1.1, delay: 4 },
    { position: [0, -8, -20] as [number, number, number], color: "#ef9900", scale: 2, delay: 5 },
  ], [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] bg-white">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, stencil: false, depth: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        <SceneController scrollY={scrollY} />
        
        <color attach="background" args={['#ffffff']} />
        <fog attach="fog" args={['#ffffff', 5, 45]} />
        
        <ambientLight intensity={1.5} />
        <spotLight position={[20, 30, 10]} angle={0.15} penumbra={1} intensity={2} />
        <pointLight position={[-15, -10, -5]} intensity={1.5} color="#002878" />

        {shapes.map((s, i) => (
          <FloatingShape key={i} scrollY={scrollY} {...s} />
        ))}

        <Sparkles 
          count={400} 
          scale={[20, 20, 60]} 
          size={2} 
          speed={0.4} 
          opacity={0.3} 
          color="#002878" 
        />
        
        <Environment preset="studio" />
      </Canvas>
      
      {/* Dynamic grain/noise overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://res.cloudinary.com/dvwvkt76a/image/upload/v1713532467/noise_tvxq9j.png')] mix-blend-overlay" />
    </div>
  )
}
