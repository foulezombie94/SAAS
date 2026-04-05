'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TransitionPage() {
  const router = useRouter()

  useEffect(() => {
    // Artificial delay for a "premium" transition feel
    const timer = setTimeout(() => {
      router.push('/onboarding/stripe-connect')
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)]">
      <div className="relative">
        {/* The Animated "Rond" */}
        <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
      </div>
      
      <div className="mt-12 text-center animate-pulse">
        <h2 className="text-xl font-black tracking-tighter text-primary uppercase">Préparation de votre espace</h2>
        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Un instant, nous optimisons votre expérience...</p>
      </div>
    </div>
  )
}
