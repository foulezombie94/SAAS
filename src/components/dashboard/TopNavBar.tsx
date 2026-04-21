'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, User, CheckCircle2, CreditCard, ChevronRight, LogOut, Check, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useNotifications } from '@/components/providers/NotificationProvider'
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
  const { unreadCount, notifications, markAllAsRead, clearAllNotifications } = useNotifications()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  // 🛡️ OPTIMISATION RECHERCHE : Debounce de 500ms pour éviter de bombarder la DB
  useEffect(() => {
    if (!searchQuery.trim()) return

    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, router])

  const handleSignOut = async () => {
    await signOut()
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    setIsMounted(true)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm flex justify-between items-center w-full px-8 h-20 sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            className="w-full bg-slate-50 border border-slate-100 rounded-full pl-12 pr-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 placeholder:font-medium font-bold" 
            placeholder={t('navbar.search_placeholder')} 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`)
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-3 pr-6 border-r border-slate-200/20 h-10">
          <Link href="/dashboard/quotes/new">
            <Button size="sm" className="px-6 font-bold tracking-tight bg-[#00236f] hover:bg-[#001b54] text-white rounded-lg">
              {t('sidebar.create_quote')}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <motion.button 
            id="notifications-trigger"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className={cn(
              "relative p-3 rounded-2xl transition-all duration-500 glass-card",
              isDropdownOpen 
                ? "bg-primary text-white shadow-xl shadow-primary/20" 
                : unreadCount > 0 && notifications.length > 0
                  ? "bg-amber-50/80 text-amber-600 border-amber-200/50"
                  : "bg-slate-50/50 text-slate-400 hover:bg-white hover:shadow-md hover:border-slate-200"
            )}
          >
            <Bell 
              size={20} 
              className={cn(
                "transition-all",
                isMounted && unreadCount > 0 && notifications.length > 0 && "animate-ring text-secondary"
              )} 
            />
            {isMounted && unreadCount > 0 && notifications.length > 0 && (
              <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-secondary ring-2 ring-white shadow-[0_0_10px_rgba(239,153,0,0.5)] animate-pulse" />
            )}
          </motion.button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute top-full right-0 mt-4 w-[400px] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50 shadow-diffused"
              >
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">{t('navbar.notifications_recent')}</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        markAllAsRead()
                      }} 
                      className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors group"
                    >
                      <Check size={12} className="group-hover:scale-110 transition-transform" />
                      {t('navbar.mark_all_read')}
                    </button>
                  )}
                </div>

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-16 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell size={32} className="text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t('navbar.no_notifications')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((n, i) => {
                        const notif = n as any
                        return (
                        <Link 
                          key={`${notif.id}-${i}`} 
                          href={`/dashboard/quotes/${notif.id}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className={cn(
                            "flex items-start gap-4 p-5 hover:bg-primary/[0.02] transition-colors group relative overflow-hidden",
                            notif.status === 'expired' && "bg-amber-50/10 hover:bg-amber-50/20"
                          )}
                        >
                          <div className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:shadow-lg group-hover:scale-110",
                            notif.status === 'paid' ? "bg-emerald-50 text-emerald-600 shadow-emerald-100/50" :
                            notif.status === 'expired' ? "bg-amber-50 text-amber-600 shadow-amber-100/50" : 
                            "bg-slate-50 text-primary shadow-slate-100/50"
                          )}>
                            {notif.status === 'paid' ? <CheckCircle2 size={20} /> : <div className="p-1.5 border-2 border-current rounded-lg opacity-40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={cn(
                                "text-[9px] font-black uppercase tracking-[0.15em]",
                                notif.status === 'expired' ? "text-amber-500" : "text-primary/40"
                              )}>
                                {(() => {
                                  if (notif.last_viewed_at && notif.status === 'sent') return t('notif.viewed')
                                  switch(notif.status) {
                                    case 'paid': return t('notif.paid')
                                    case 'accepted': return t('notif.accepted')
                                    case 'sent': return t('notif.sent')
                                    case 'expired': return t('notif.expired')
                                    default: return t('notif.info')
                                  }
                                })()}
                              </p>
                              <span className="text-[8px] font-bold text-slate-300 uppercase">Aujourd'hui</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 leading-snug">
                               {notif.status === 'paid' ? t('notif.desc_paid') : 
                                notif.status === 'accepted' ? t('notif.desc_accepted') : 
                                (notif.last_viewed_at && notif.status === 'sent') ? t('notif.desc_viewed') :
                                notif.status === 'expired' ? t('notif.desc_expired') : t('notif.desc_default')}
                                <span className={cn("inline-block ml-1 text-secondary font-black", notif.status === 'expired' && "text-amber-500")}>
                                  #{notif.number}
                                </span>
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                               <div className="flex items-center gap-1.5">
                                 <div className={cn("w-1 h-1 rounded-full", notif.status === 'paid' ? "bg-emerald-400 animate-pulse" : "bg-slate-300")} />
                                 <span className="text-[10px] font-bold text-slate-400 capitalize">
                                   {notif.clients?.name || 'Client'}
                                 </span>
                               </div>
                            </div>
                          </div>
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                        </Link>
                      )
                    })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 👤 PREMIUM USER SECTION */}
        <div className="flex items-center gap-2 pl-6 border-l border-slate-100 ml-2">
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
      </div>
    </header>
  )
}
