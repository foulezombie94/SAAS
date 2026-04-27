'use client'

import React, { useState, useRef, useEffect } from 'react'
import { User, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { signOut } from '@/app/login/actions'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useI18n } from '@/components/providers/LanguageProvider'
import { getUIPreference, setUIPreference, UI_COOKIES } from '@/lib/ui-persistence'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface TopNavBarProps {
  userEmail?: string
}

export function TopNavBar({ userEmail }: TopNavBarProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Load theme preference
  useEffect(() => {
    const savedTheme = getUIPreference(UI_COOKIES.THEME) as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
    setIsMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    setUIPreference(UI_COOKIES.THEME, newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }


  const handleSignOut = async () => {
    await signOut()
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <header className="h-[80px] bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm sticky top-0">
      {/* Search Bar */}
      <div className="flex items-center bg-slate-50 rounded-lg px-4 py-2.5 w-96 border border-slate-100 focus-within:ring-2 focus-within:ring-brand-purple/20 transition-all group">
        <svg className="w-5 h-5 text-slate-400 mr-3 group-focus-within:text-brand-purple transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input 
          type="text" 
          placeholder="Search" 
          className="bg-transparent border-none outline-none text-base w-full text-slate-600 placeholder-slate-400" 
        />
        <span className="text-sm text-slate-400 font-medium ml-2 border border-slate-200 rounded px-2 py-0.5 bg-white">⌘ F</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4 border-r border-slate-100 pr-5">
          <button className="text-slate-400 hover:text-brand-purple transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </button>
          <div className="relative">
            <button className="text-slate-400 hover:text-brand-purple transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white"></span>
          </div>
          <button className="text-slate-400 hover:text-brand-purple transition-colors" onClick={() => router.push('/dashboard/profile')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/dashboard/profile')}>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-brand-purple transition-all">
            <img 
              src={`https://ui-avatars.com/api/?name=${userEmail?.split('@')[0]}&background=random`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:block">
            <p className="text-base font-semibold text-slate-800 leading-tight group-hover:text-brand-purple transition-colors">
              {userEmail?.split('@')[0]}
            </p>
            <p className="text-sm text-slate-400 leading-tight mt-0.5 uppercase tracking-widest font-bold text-[10px]">
              Business
            </p>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title={t('navbar.logout')}
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
