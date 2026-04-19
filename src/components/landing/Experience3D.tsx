'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useScroll } from 'framer-motion'

// Dynamic import to avoid SSR issues with Three.js
const ThreeBackground = dynamic(() => import('./ThreeBackground'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#002878]/5 animate-pulse" />
})

export function Experience3D() {
  const { scrollYProgress } = useScroll()

  return (
    <Suspense fallback={null}>
      <ThreeBackground scrollY={scrollYProgress} />
    </Suspense>
  )
}
