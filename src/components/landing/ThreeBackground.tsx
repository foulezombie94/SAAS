'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Float, 
  MeshTransmissionMaterial, 
  PerspectiveCamera,
  Environment,
  Sparkles,
  ContactShadows
} from '@react-three/drei'
import * as THREE from 'three'
import { useTransform, useSpring, motion } from 'framer-motion'

// Dimension Profiles: [Position 0 (Hero), 0.33 (Features), 0.66 (Process), 1.0 (Pricing)]
const DIMENSIONS = {
  colors: ['#002878', '#ef9900', '#6366f1', '#0f172a'], // Blue, Amber, Indigo, Dark
  distortion: [0.3, 0.8, 0.2, 0.5],
  ior: [1.2, 1.5, 1.1, 1.4],
  thickness: [0.5, 2, 0.2, 1],
}

function SceneContent({ scrollY }: { scrollY: any }) {
  // Map scroll to global dimension parameters
  const color1 = useTransform(scrollY, [0, 0.33, 0.66, 1], ['#002878', '#ef9900', '#ffffff', '#002878'])
  const color2 = useTransform(scrollY, [0, 0.33, 0.66, 1], ['#ef9900', '#ffffff', '#002878', '#ef9900'])
  const distortion = useTransform(scrollY, [0, 0.25, 0.33, 0.66, 0.75, 1], [0.3, 1.5, 0.8, 0.2, 1.2, 0.5])
  const cameraZ = useTransform(scrollY, [0, 0.5, 1], [8, 12, 6])
  const fov = useTransform(scrollY, [0, 0.5, 1], [40, 50, 35])
  const bgIntensity = useTransform(scrollY, [0, 0.5, 1], [0.5, 1.5, 0.2])

  const shapes = useMemo(() => [
    { shape: 'torus', baseColor: '#002878', position: [4, 2, -2], rotation: [0.5, 0.5, 0], speed: 1.2 },
    { shape: 'icosahedron', baseColor: '#ef9900', position: [-5, -1, -3], rotation: [0, 1, 0.5], speed: 0.8 },
    { shape: 'dodecahedron', baseColor: '#002878', position: [2, -4, -1], rotation: [1, 0.2, 0], speed: 1.5 },
    { shape: 'torus', baseColor: '#ffffff', position: [-3, 4, -4], rotation: [0.2, 0, 1], speed: 1 },
  ], [])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, cameraZ.get()]} fov={fov.get()} />
      <ambientLight intensity={bgIntensity.get()} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
      <pointLight position={[-10, -10, -10]} intensity={1} color={color1.get()} />
      
      {shapes.map((s, i) => (
        <FloatingShape 
          key={i} 
          {...s} 
          scrollY={scrollY} 
          globalDistortion={distortion}
          colorShift={i % 2 === 0 ? color1 : color2}
        />
      ))}

      <Sparkles count={100} scale={20} size={2} speed={0.5} opacity={bgIntensity.get() * 0.5} />
      <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} />
      <Environment preset="city" />
    </>
  )
}

function FloatingShape({ shape, position, rotation, speed, scrollY, globalDistortion, colorShift }: any) {
  const mesh = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<any>(null!)
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const s = scrollY.get()
    
    // Smoothly apply scroll-based transformations
    mesh.current.rotation.x = rotation[0] + time * speed * 0.1 + s * 2
    mesh.current.rotation.y = rotation[1] + time * speed * 0.15 + s * 3
    
    // Drift effect
    mesh.current.position.y = position[1] + Math.sin(time + position[0]) * 0.5 - s * 10
    mesh.current.position.x = position[0] + Math.cos(time + position[1]) * 0.2
    
    // Update material properties dynamically from Scroll progress
    if (materialRef.current) {
      materialRef.current.distortion = globalDistortion.get()
      materialRef.current.color.lerp(new THREE.Color(colorShift.get()), 0.05)
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <mesh ref={mesh} position={position} rotation={rotation}>
        {shape === 'torus' && <torusKnotGeometry args={[1, 0.3, 128, 32]} />}
        {shape === 'icosahedron' && <icosahedronGeometry args={[1.2, 0]} />}
        {shape === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
        
        <MeshTransmissionMaterial
          ref={materialRef}
          backside
          samples={4}
          thickness={1}
          chromaticAberration={0.1}
          anisotropy={0.3}
          distortion={0.3}
          distortionScale={0.5}
          temporalDistortion={0.5}
          ior={1.2}
          roughness={0.1}
          transmission={1}
        />
      </mesh>
    </Float>
  )
}

export default function ThreeBackground({ scrollY }: { scrollY: any }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1]">
      {/* Background layer color shift using Framer Motion */}
      <motion.div 
        style={{
          backgroundColor: useTransform(scrollY, [0, 0.5, 1], ['rgba(255,255,255,1)', 'rgba(0,40,120,0.05)', 'rgba(255,255,255,1)'])
        }}
        className="absolute inset-0 transition-colors duration-1000"
      />
      
      <Canvas dpr={[1, 1.5]} gl={{ antialias: false }}>
        <SceneContent scrollY={scrollY} />
      </Canvas>
    </div>
  )
}
