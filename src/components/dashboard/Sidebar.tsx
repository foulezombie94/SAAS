'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  Settings,
  Mail,
  PlusCircle,
  ShieldCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/components/providers/LanguageProvider'
import { getUIPreference, setUIPreference, UI_COOKIES } from '@/lib/ui-persistence'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Sidebar({ isPro }: { isPro: boolean }) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load preference
  useEffect(() => {
    const saved = getUIPreference(UI_COOKIES.SIDEBAR_COLLAPSED)
    if (saved === 'true') setIsCollapsed(true)
    setIsMounted(true)
  }, [])

  const toggleCollapse = () => {
    const newVal = !isCollapsed
    setIsCollapsed(newVal)
    setUIPreference(UI_COOKIES.SIDEBAR_COLLAPSED, String(newVal))
  }

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { id: 'clients', name: 'Clients', href: '/dashboard/clients', icon: Users },
    { id: 'quotes', name: 'Devis', href: '/dashboard/quotes', icon: FileText },
    { id: 'agenda', name: 'Agenda', href: '/dashboard/calendar', icon: Calendar },
    { id: 'invoices', name: 'Factures', href: '/dashboard/invoices', icon: Receipt },
    { id: 'settings', name: 'Profil', href: '/dashboard/profile', icon: Settings },
    { id: 'emails', name: 'E-mails', href: '/dashboard/profile/email', icon: Mail },
  ]

  if (!isMounted) return <aside className="h-full w-60 hidden md:flex border-r border-slate-100 bg-white" />

  return (
    <aside 
      className={cn(
        "h-full hidden md:flex flex-col fixed left-0 top-0 bg-white p-4 gap-2 border-r border-slate-100 z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-60"
      )}
    >
      <div className={cn("mb-8 flex items-center justify-between px-2 pt-4", isCollapsed && "justify-center")}>
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-black text-[#00236f] tracking-tighter uppercase leading-none">ArtisanFlow</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Maître Artisan</p>
          </div>
        )}
        <button 
          onClick={toggleCollapse}
          className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          if ((item.id === 'emails' || item.id === 'agenda') && !isPro) return null

          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] group relative",
                isActive 
                  ? "bg-white text-[#00236f] shadow-[0_4px_12px_rgba(0,35,111,0.08)] border border-slate-100/50" 
                  : "text-slate-500 hover:bg-slate-50",
                isCollapsed && "justify-center"
              )}
            >
              <item.icon size={20} className={cn("shrink-0", isActive ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
              {!isCollapsed && <span>{t(`sidebar.${item.id}`)}</span>}
              
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[#00236f] text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
                  {t(`sidebar.${item.id}`)}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-slate-50 pt-6 px-2">
        <Link href="/dashboard/quotes/new">
          <Button className={cn(
            "w-full justify-start gap-3 h-12 mb-4 bg-[#00236f] hover:bg-[#001b54] text-white rounded-xl shadow-lg shadow-blue-900/10 active:scale-95 transition-all overflow-hidden",
            isCollapsed && "justify-center px-0"
          )}>
            <PlusCircle size={18} className="shrink-0" />
            {!isCollapsed && <span className="font-black uppercase tracking-widest text-[9px]">{t('sidebar.create_quote')}</span>}
          </Button>
        </Link>
        
        {!isCollapsed && (
          isPro ? (
            <div className="flex items-center gap-3 p-3 text-[#00236f] font-black text-[10px] uppercase tracking-widest bg-blue-50/50 rounded-xl border border-blue-100/50">
              <ShieldCheck size={16} className="text-primary" />
              {t('sidebar.pro_plan')}
            </div>
          ) : (
            <Link href="/onboarding/plans">
              <div className="flex items-center gap-3 p-3 text-slate-500 hover:text-primary hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest rounded-xl group">
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-slate-200 group-hover:bg-primary rounded-full" />
                </div>
                {t('sidebar.free_plan')}
              </div>
            </Link>
          )
        )}
      </div>
    </aside>
  )
}
