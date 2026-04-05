import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopNavBar } from '@/components/dashboard/TopNavBar'
import { Home, Users, PlusCircle, Receipt } from 'lucide-react'
import Link from 'next/link'
import { Toaster } from 'sonner'
import { NotificationProvider } from '@/components/providers/NotificationProvider'

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

  return (
    <NotificationProvider userId={user.id}>
      <div className="flex min-h-screen bg-white">
      <Toaster position="top-right" expand={false} richColors />
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen relative">
        {/* TopNavBar */}
        <TopNavBar userEmail={user.email} />

        {/* Content Canvas */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-white pb-32 md:pb-12">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>

        {/* BottomNavBar (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 w-full z-[60] flex justify-around items-end px-6 pb-6 bg-white backdrop-blur-2xl md:hidden rounded-t-3xl shadow-[0_-8px_24px_rgba(0,35,111,0.08)] border-t border-slate-100">
          <Link href="/dashboard" className="flex flex-col items-center justify-center text-primary py-2 scale-95 active:scale-90 transition-all">
            <Home size={24} />
            <span className="text-[10px] uppercase tracking-widest font-black mt-1">Accueil</span>
          </Link>
          <Link href="/dashboard/clients" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-2 scale-95 active:scale-90 transition-all">
            <Users size={24} />
            <span className="text-[10px] uppercase tracking-widest font-black mt-1">Clients</span>
          </Link>
          <Link href="/dashboard/quotes/new" className="flex flex-col items-center justify-center bg-tertiary-container text-on-tertiary-container rounded-2xl h-14 w-14 mb-2 shadow-lg shadow-tertiary-container/30 scale-100 active:scale-90 transition-all">
            <PlusCircle size={28} />
          </Link>
          <Link href="/dashboard/invoices" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-2 scale-95 active:scale-90 transition-all">
            <Receipt size={24} />
            <span className="text-[10px] uppercase tracking-widest font-black mt-1">Factures</span>
          </Link>
        </nav>
      </div>
    </div>
    </NotificationProvider>
  )
}
