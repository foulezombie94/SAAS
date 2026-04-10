'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, User, CheckCircle2, CreditCard, ChevronRight, LogOut, Check } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { signOut } from '@/app/login/actions'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useI18n } from '@/components/providers/LanguageProvider'

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
            <Button size="sm" className="px-6 font-bold tracking-tight bg-[#00236f] hover:bg-[#001b54] text-white rounded-xl">
              {t('sidebar.create_quote')}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button 
            id="notifications-trigger"
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen)
            }} 
            className={cn(
              "relative p-2.5 rounded-2xl transition-all duration-300",
              isDropdownOpen 
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                : unreadCount > 0 && notifications.length > 0
                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            )}
          >
            <Bell size={20} className={cn(unreadCount > 0 && notifications.length > 0 && "animate-pulse")} />
            {unreadCount > 0 && notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-white shadow-sm" />
            )}
          </button>

          {/* Notification Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-4 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest italic">{t('navbar.notifications_recent')}</h3>
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

              <div className="max-h-[450px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center">
                    <Bell size={40} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest text-center">{t('navbar.no_notifications')}</p>
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
                          "flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors group",
                          notif.status === 'expired' && "bg-amber-50/30 hover:bg-amber-50/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                          notif.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                          notif.status === 'expired' ? "bg-amber-50 text-amber-600" : "bg-primary/5 text-primary"
                        )}>
                          {notif.status === 'paid' ? <CheckCircle2 size={20} /> : <div className="p-2 border-2 border-current rounded-lg" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-0.5 truncate",
                            notif.status === 'expired' ? "text-amber-600" : "text-primary"
                          )}>
                             {(() => {
                              // 🚀 Prioritize 'Viewed' if it was triggered recently, or if status is still 'sent' but viewed
                               if (notif.last_viewed_at && notif.status === 'sent') return t('notif.viewed')
                               
                               switch(notif.status) {
                                 case 'paid': return t('notif.paid')
                                 case 'accepted': return t('notif.accepted')
                                 case 'sent': return t('notif.sent')
                                 case 'expired': return t('notif.expired')
                                 case 'invoiced': return t('notif.invoiced')
                                 default: return t('notif.info')
                               }
                             })()}
                          </p>
                          <p className="text-[11px] font-bold text-slate-600 mb-1.5 leading-tight">
                             {notif.status === 'paid' ? t('notif.desc_paid') : 
                              notif.status === 'accepted' ? t('notif.desc_accepted') : 
                              (notif.last_viewed_at && notif.status === 'sent') ? t('notif.desc_viewed') :
                              notif.status === 'expired' ? t('notif.desc_expired') : t('notif.desc_default')} pour{' '}
                             <span className={cn("text-secondary font-black", notif.status === 'expired' && "text-amber-500")}>
                               {notif.number}
                             </span>
                          </p>
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1.5">
                               <div className={cn("w-1 h-1 rounded-full", notif.status === 'paid' ? "bg-emerald-400" : "bg-slate-300")} />
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                 {notif.clients?.name || 'Client ArtisanFlow'}
                               </span>
                             </div>
                             {notif.status === 'paid' && (
                               <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">PAYÉ</span>
                             )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 pl-4 border-l border-slate-200/20 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-primary uppercase tracking-tighter opacity-40 mb-0.5">{t('navbar.connected_as')}</p>
            <p className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{userEmail}</p>
          </div>
          
          <div className="p-1 text-slate-300">
            <User size={28} className="bg-slate-50 rounded-full border border-slate-100 p-1" />
          </div>

          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 ml-2 group transition-all rounded-full bg-slate-50/50 border border-slate-100 hover:bg-red-50/50 hover:border-red-200 hover:shadow-[0_4px_12px_rgba(239,68,68,0.08)] active:scale-95"
            title="Se déconnecter"
          >
            <div className="bg-white p-1 rounded-full shadow-sm border border-slate-50 group-hover:border-red-100 group-hover:bg-red-50 transition-all">
              <LogOut size={10} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            </div>
            <span className="text-[9px] font-black text-slate-500 group-hover:text-red-600 uppercase tracking-widest leading-none pr-1">{t('navbar.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
