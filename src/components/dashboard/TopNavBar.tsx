'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, User, CheckCircle2, CreditCard, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { signOut } from '@/app/login/actions'

interface TopNavBarProps {
  userEmail?: string
}

export function TopNavBar({ userEmail }: TopNavBarProps) {
  const { unreadCount, notifications, markAllAsRead, clearAllNotifications } = useNotifications()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
                      clearAllNotifications()
                    }} 
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    Effacer
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
                    {notifications.map((notif, i) => (
                      <Link 
                        key={`${notif.id}-${i}`} 
                        href={`/dashboard/quotes/${notif.id}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors group"
                      >
                        <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${
                          notif.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {notif.status === 'paid' ? <CreditCard size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-primary uppercase tracking-tight mb-1 truncate">
                            {notif.status === 'paid' ? 'Paiement Encaissé' : 'Devis Signature reçue'}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500 mb-2">
                             Devis <span className="text-secondary">{notif.number}</span> par {notif.clients?.name || 'le client'}.
                          </p>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Récent</span>
                             <ChevronRight size={10} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ))}
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
        
        <div className="flex items-center gap-3 pl-2 relative border-l border-slate-200/20 ml-2">
          <div className="text-right hidden sm:block">
             <p className="text-xs font-black text-primary uppercase tracking-tighter">Artisan Connecté</p>
             <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{userEmail}</p>
          </div>
          <button className="p-1 text-slate-300 dark:text-slate-500">
            <User size={32} />
          </button>
          
          <button 
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 p-2 ml-2 group transition-all rounded-xl hover:bg-error/5"
            title="Se déconnecter"
          >
            <LogOut size={20} className="text-slate-300 group-hover:text-error group-hover:translate-x-0.5 transition-all" />
            <span className="text-[8px] font-black text-slate-300 group-hover:text-error uppercase tracking-widest">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  )
}
