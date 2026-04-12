import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/supabase/cached-queries'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopNavBar } from '@/components/dashboard/TopNavBar'
import { Home, Users, PlusCircle, Receipt, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Toaster } from 'sonner'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { LanguageProvider } from '@/components/providers/LanguageProvider'
import { NavLabel } from '@/components/dashboard/NavLabel'

import { Suspense } from 'react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile(user.id)
  const isPro = profile?.is_pro ?? false

  return (
    <NotificationProvider userId={user.id}>
      <LanguageProvider initialLanguage={profile?.preferred_language}>
        <div className="flex min-h-screen bg-white">
        <Toaster position="top-right" expand={false} richColors />
        {/* Sidebar - Desktop */}
        <Sidebar isPro={isPro} />

        {/* Main Content Area */}
        <div className="flex-1 md:ml-60 flex flex-col min-h-screen relative">
          {/* TopNavBar */}
          <TopNavBar userEmail={user.email} />

          {/* Content Canvas */}
          <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-white pb-24 md:pb-2">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            }>
              <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
              </div>
            </Suspense>
          </main>

          {/* BottomNavBar (Mobile Only) */}
          <nav className="fixed bottom-0 left-0 w-full z-[60] flex justify-around items-end px-6 pb-6 bg-white backdrop-blur-2xl md:hidden rounded-t-3xl shadow-[0_-8px_24px_rgba(0,35,111,0.08)] border-t border-slate-100">
            <Link href="/dashboard" className="flex flex-col items-center justify-center text-primary py-2 scale-95 active:scale-90 transition-all">
            <Home size={24} />
            <span className="text-[10px] uppercase tracking-widest font-black mt-1">
              <NavLabel id="dashboard" fallback="Accueil" />
            </span>
          </Link>
          <Link href="/dashboard/clients" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-2 scale-95 active:scale-90 transition-all">
            <Users size={24} />
            <span className="text-[10px] uppercase tracking-widest font-black mt-1">
              <NavLabel id="clients" fallback="Clients" />
            </span>
          </Link>
          {isPro && (
            <Link href="/dashboard/calendar" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-2 scale-95 active:scale-90 transition-all">
              <Calendar size={24} />
              <span className="text-[10px] uppercase tracking-widest font-black mt-1">
                <NavLabel id="agenda" fallback="Agenda" />
              </span>
            </Link>
          )}
          <Link href="/dashboard/quotes/new" className="flex flex-col items-center justify-center bg-tertiary-container text-on-tertiary-container rounded-2xl h-14 w-14 mb-2 shadow-lg shadow-tertiary-container/30 scale-100 active:scale-90 transition-all">
            <PlusCircle size={28} />
          </Link>
          <Link href="/dashboard/invoices" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-2 scale-95 active:scale-90 transition-all">
            <Receipt size={24} />
            <span className="text-[10px] uppercase tracking-widest font-black mt-1">
              <NavLabel id="invoices" fallback="Factures" />
            </span>
          </Link>
          </nav>
        </div>
      </div>
     </LanguageProvider>
    </NotificationProvider>
  )
}
