'use client'

import React from 'react'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#1a1b21] antialiased">
      <header className="w-full top-0 left-0 bg-white z-50 sticky border-b border-slate-100">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto font-['Inter'] antialiased tracking-tight">
          <div className="text-xl font-black tracking-tighter text-[#00236f] uppercase">Artisan Architect</div>
          <div className="flex gap-8 items-center">
            <span className="text-[#5a5c63] text-sm font-medium uppercase tracking-widest cursor-default">Support</span>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  )
}
