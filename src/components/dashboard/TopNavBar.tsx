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
            placeholder="Rechercher un devis, client..." 
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
              Créer un Devis
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button 
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen)
              if (!isDropdownOpen && unreadCount > 0) markAllAsRead()
            }}
            className={`p-3 transition-all rounded-full relative ${
              isDropdownOpen ? "bg-slate-100 text-primary" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Bell size={22} className={unreadCount > 0 ? "text-primary animate-bounce-subtle" : ""} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-error text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white ring-2 ring-error/20">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-4 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest italic">Notifications récentes</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      markAllAsRead()
                    }} 
                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors group"
                  >
                    <Check size={12} className="group-hover:scale-110 transition-transform" />
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-[450px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center">
                    <Bell size={40} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest text-center">Rien à signaler pour le moment</p>
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
                          "mt-1 p-2 rounded-xl flex-shrink-0",
                          notif.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 
                          notif.status === 'expired' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'
                        )}>
                            {notif.status === 'expired' ? <Bell size={18} className="animate-pulse" /> : 
                             notif.status === 'paid' ? <CreditCard size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-0.5 truncate",
                            notif.status === 'expired' ? "text-amber-600" : "text-primary"
                          )}>
                             {(() => {
                               // 🚀 Prioritize 'Viewed' if it was triggered recently, or if status is still 'sent' but viewed
                               if (notif.last_viewed_at && notif.status === 'sent') return 'Devis Consulté'
                               
                               switch(notif.status) {
                                 case 'paid': return 'Paiement Encaissé'
                                 case 'accepted': return 'Signature Reçue'
                                 case 'sent': return 'Lien Envoyé'
                                 case 'expired': return 'Lien Expiré'
                                 case 'invoiced': return 'Facturation Auto'
                                 default: return 'Information Devis'
                               }
                             })()}
                          </p>
                          <p className="text-[11px] font-bold text-slate-600 mb-1.5 leading-tight">
                             {notif.status === 'paid' ? 'Règlement validé avec succès' : 
                              notif.status === 'accepted' ? 'Document signé électroniquement' : 
                              (notif.last_viewed_at && notif.status === 'sent') ? 'Le client parcourt actuellement le devis' :
                              notif.status === 'expired' ? 'Ce document n\'est plus accessible' : 'Nouvelle activité enregistrée'} pour{' '}
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
              
              <div className="p-4 bg-slate-50/30 border-t border-slate-100">
                <Link 
                  href="/dashboard/quotes"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block w-full text-center py-2 text-[10px] font-black text-primary/40 uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Voir toute l'activité
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 pl-4 border-l border-slate-200/20 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-primary uppercase tracking-tighter opacity-40 mb-0.5">Connecté en tant que</p>
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
            <span className="text-[9px] font-black text-slate-500 group-hover:text-red-600 uppercase tracking-widest leading-none pr-1">Quitter</span>
          </button>
        </div>
      </div>
    </header>
  )
}
