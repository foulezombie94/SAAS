'use client'

import React from 'react'
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
  LucideIcon
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/Button'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Devis', href: '/dashboard/quotes', icon: FileText },
  { name: 'Factures', href: '/dashboard/invoices', icon: Receipt },
  { name: 'E-mails', href: '/dashboard/settings', icon: Mail },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="h-full w-60 hidden md:flex flex-col fixed left-0 top-0 bg-white p-4 gap-2 border-r border-slate-100 z-50">
      <div className="mb-8 px-2 pt-4">
        <h1 className="text-xl font-black text-[#00236f] tracking-tighter uppercase leading-none">ArtisanFlow</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Maître Artisan</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]",
                isActive 
                  ? "bg-white text-[#00236f] shadow-[0_4px_12px_rgba(0,35,111,0.08)] border border-slate-100/50" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-slate-50 pt-6 px-2">
        <Link href="/dashboard/quotes/new">
          <Button className="w-full justify-start gap-3 h-12 mb-4 bg-[#00236f] hover:bg-[#001b54] text-white rounded-xl shadow-lg shadow-blue-900/10 active:scale-95 transition-all">
            <PlusCircle size={18} />
            <span className="font-black uppercase tracking-widest text-[9px]">Créer un Devis</span>
          </Button>
        </Link>
          <div className="flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <ShieldCheck size={16} className="text-primary" />
            Abonnement Pro
          </div>
      </div>
    </aside>
  )
}
