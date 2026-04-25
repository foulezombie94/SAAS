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
    <header className="bg-white border-b border-slate-100 shadow-sm flex justify-center items-center w-full px-8 h-20 sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-4">
        {/* 👤 PREMIUM USER SECTION */}
        <Link href="/dashboard/profile">
            <motion.div 
              whileHover={{ x: -4 }}
              className="flex items-center gap-4 bg-slate-50/50 hover:bg-white border border-slate-100/50 hover:border-slate-200 hover:shadow-sm px-4 py-2 rounded-[1.25rem] transition-all group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">
                  {t('navbar.connected_as')}
                </p>
                <p className="text-[12px] font-bold text-slate-700 truncate max-w-[140px] leading-tight">
                  {userEmail?.split('@')[0]}
                  <span className="text-slate-300 font-medium">@{userEmail?.split('@')[1]}</span>
                </p>
              </div>
              
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-container p-[1px] shadow-sm group-hover:shadow-md transition-all">
                  <div className="w-full h-full rounded-[0.95rem] bg-white flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-primary/70 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
            </motion.div>
          </Link>

          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="h-12 px-6 ml-2 rounded-2xl border-slate-100 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300 group shadow-sm flex items-center gap-2"
          >
            <motion.div
              animate={{ x: 0 }}
              whileHover={{ x: 3 }}
              className="bg-slate-50 group-hover:bg-red-100 p-1.5 rounded-lg transition-colors"
            >
              <LogOut size={14} className="text-slate-400 group-hover:text-red-500" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{t('navbar.logout')}</span>
          </Button>
      </div>
    </header>
  )
}
