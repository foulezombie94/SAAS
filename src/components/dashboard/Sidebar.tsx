'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings,
  MessageSquare,
  Package,
  LineChart,
  Sparkles,
  Shield,
  HelpCircle,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  PlusCircle,
  LucideIcon
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/components/providers/LanguageProvider'
import { getUIPreference, setUIPreference, UI_COOKIES } from '@/lib/ui-persistence'
import { motion, AnimatePresence } from 'framer-motion'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface NavItem {
  id: string
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
  isBeta?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
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

  const sections: NavSection[] = [
    {
      title: 'general',
      items: [
        { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { id: 'payment', name: 'Payment', href: '/dashboard/payments', icon: ArrowLeftRight },
        { id: 'clients', name: 'Customers', href: '/dashboard/clients', icon: Users },
        { id: 'message', name: 'Message', href: '/dashboard/messages', icon: MessageSquare, badge: 8 },
      ]
    },
    {
      title: 'tools',
      items: [
        { id: 'product', name: 'Product', href: '/dashboard/products', icon: Package },
        { id: 'invoices', name: 'Invoice', href: '/dashboard/invoices', icon: FileText },
        { id: 'analytics', name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
        { id: 'automation', name: 'Automation', href: '/dashboard/automation', icon: Sparkles, isBeta: true },
      ]
    },
    {
      title: 'support',
      items: [
        { id: 'settings', name: 'Settings', href: '/dashboard/profile', icon: Settings },
        { id: 'security', name: 'Security', href: '/dashboard/security', icon: Shield },
        { id: 'help', name: 'Help', href: '/dashboard/help', icon: HelpCircle },
      ]
    }
  ]

  if (!isMounted) return <aside className="h-full w-64 hidden md:flex border-r border-slate-100 bg-white" />

  return (
    <aside 
      className={cn(
        "h-screen hidden md:flex flex-col fixed left-0 top-0 bg-white border-r border-slate-100 z-50 transition-all duration-300 ease-in-out shadow-sm",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header / Logo */}
      <div className={cn("h-20 flex items-center px-6 border-b border-slate-50", isCollapsed && "justify-center px-0")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00236f] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl italic leading-none">A</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">ArtisanFlow</h1>
          </div>
        ) : (
          <div className="w-10 h-10 bg-[#00236f] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-2xl italic leading-none">A</span>
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        {sections.map((section, idx) => (
          <div key={section.title} className={cn(idx !== 0 && "mt-8")}>
            {!isCollapsed && (
              <h2 className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                {t(`sidebar.${section.title}`)}
              </h2>
            )}
            
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                      isActive 
                        ? "bg-slate-50 text-slate-900" 
                        : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-900",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon 
                      size={20} 
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "text-[#00236f]" : "text-slate-400 group-hover:text-slate-600"
                      )} 
                    />
                    
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{t(`sidebar.${item.id}`)}</span>
                    )}

                    {/* Badges */}
                    {!isCollapsed && (
                      <>
                        {item.badge && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            {item.badge}
                          </span>
                        )}
                        {item.isBeta && (
                          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                            BETA
                          </span>
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0">
                        {t(`sidebar.${item.id}`)}
                      </div>
                    )}

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute left-0 w-1 h-6 bg-[#00236f] rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto border-t border-slate-50 p-4 space-y-4 bg-slate-50/30">
        {/* Team Switcher */}
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors cursor-pointer group">
            <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('sidebar.team')}</p>
              <p className="text-sm font-bold text-slate-900 truncate">{t('sidebar.marketing')}</p>
            </div>
            <ChevronsUpDown size={16} className="text-slate-400 group-hover:text-slate-600" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center text-white shadow-sm cursor-pointer">
              <Sparkles size={20} />
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        {!isCollapsed ? (
          <Button 
            className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm rounded-xl h-11 text-xs font-bold"
            variant="outline"
          >
            {t('sidebar.upgrade_plan')}
          </Button>
        ) : (
          <button 
            onClick={toggleCollapse}
            className="w-full flex justify-center p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Collapse Toggle Button (Fixed Position if needed, or integrated) */}
      {!isCollapsed && (
        <button 
          onClick={toggleCollapse}
          className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#00236f] hover:border-[#00236f] transition-all shadow-sm z-50 group"
        >
          <ChevronLeft size={14} className="group-hover:scale-110 transition-transform" />
        </button>
      )}
    </aside>
  )
}
