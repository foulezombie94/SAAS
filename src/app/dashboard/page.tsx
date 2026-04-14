import { createClient } from '@/utils/supabase/server'
import { 
  getCachedDashboardStats, 
  getCachedRecentQuotes, 
  getCachedInvoices 
} from '@/utils/supabase/cached-queries'
import { Quote, DashboardStats } from '@/types/dashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Plus, 
  TrendingUp, 
  CreditCard, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  UserPlus,
  HelpCircle,
  ExternalLink
} from 'lucide-react'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { getDashboardActivity } from './actions'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const { onboarding } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 🚀 Fetch stats & activity with Intelligent Cache + Session Security (Grade 3)
  const [stats, quotes, invoices] = await Promise.all([
    getCachedDashboardStats(user.id) as Promise<DashboardStats>,
    getCachedRecentQuotes(user.id),
    getCachedInvoices(user.id)
  ])
  
  const initialActivity = await getDashboardActivity(7)

  return (
    <div className="space-y-6">
      {onboarding === 'success' && (
        <div className="bg-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
              <CheckCircle2 size={120} />
           </div>
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                 <CheckCircle2 size={32} />
              </div>
              <div className="text-center md:text-left">
                 <h3 className="text-2xl font-black tracking-tighter uppercase mb-1">C&apos;est parti ! Votre compte est prêt.</h3>
                 <p className="text-primary-container font-bold text-sm">Félicitations, vous avez finalisé votre configuration. Vous pouvez maintenant créer vos premiers devis et factures.</p>
              </div>
              <div className="md:ml-auto">
                 <Link href="/dashboard/quotes/new">
                    <Button variant="outline" className="bg-white text-primary border-none hover:bg-primary-container font-black uppercase tracking-widest text-[10px] h-12 px-8">Créer mon 1er devis</Button>
                 </Link>
              </div>
           </div>
        </div>
      )}

      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black tracking-tighter text-primary leading-none uppercase">Bonjour, {user?.email?.split('@')[0]}</h2>
          <p className="text-on-surface-variant font-bold text-sm">Voici l&apos;état actuel de votre activité pour ce mois.</p>
        </div>

      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CA Card */}
        <Card className="p-6 space-y-3 border-none shadow-diffused bg-surface-container-lowest">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
              <CreditCard size={20} />
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              stats.revenue_change >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              <TrendingUp size={10} className={stats.revenue_change < 0 ? 'rotate-180' : ''} /> 
              {stats.revenue_change >= 0 ? '+' : ''}{stats.revenue_change}%
            </div>
          </div>
          <div>
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">CA Accepté</p>
            <h3 className="text-3xl font-black leading-none tracking-tighter text-primary">{stats.revenue.toLocaleString('fr-FR')}€</h3>
          </div>
        </Card>

        {/* Unpaid Invoices Card */}
        <Card className="p-6 space-y-3 border-none shadow-diffused bg-[#fdf2e9] text-[#433228]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-[#433228]/5 rounded-full flex items-center justify-center text-[#433228]">
              <Clock size={20} />
            </div>
            <div className="flex items-center gap-1 bg-[#433228]/10 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#433228]">
              {stats.unpaid_count || 0} en attente
            </div>
          </div>
          <div>
            <p className="text-[0.625rem] font-black uppercase tracking-widest opacity-60 mb-1 text-[#433228]/70">Factures Impayées</p>
            <h3 className="text-3xl font-black leading-none tracking-tighter text-[#433228]">{stats.unpaid.toLocaleString('fr-FR')}€</h3>
          </div>
        </Card>

        {/* Accepted Quotes Card */}
        <Card className="p-6 space-y-3 border-none shadow-diffused bg-surface-container-lowest border-2 border-primary/5">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <div className={`text-[0.625rem] font-black uppercase tracking-widest ${
              stats.quotes_change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.quotes_change >= 0 ? '+' : ''}{stats.quotes_change}% vs mois dernier
            </div>
          </div>
          <div>
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">Devis Acceptés</p>
            <h3 className="text-3xl font-black leading-none tracking-tighter text-primary">{stats.acceptedCount}</h3>
          </div>
        </Card>
      </section>

      {/* Activity Chart & Quick Actions Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart initialData={initialActivity} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h4 className="text-lg font-black text-primary uppercase tracking-tighter">Actions Rapides</h4>
          <Link href="/dashboard/quotes/new" className="block">
            <button className="btn w-full h-16 bg-tertiary-fixed-dim hover:bg-tertiary-fixed transition-all flex items-center justify-between px-6 rounded-md shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-on-tertiary-fixed/10 rounded-full flex items-center justify-center">
                  <Plus className="text-on-tertiary-fixed" size={20} />
                </div>
                <span className="font-black text-xs text-on-tertiary-fixed uppercase tracking-[0.15em]">Créer un Devis</span>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </Link>
          
          <Link href="/dashboard/clients" className="block">
            <button className="btn w-full h-16 bg-surface-container-high hover:bg-surface-container-highest transition-all flex items-center justify-between px-6 rounded-md shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="text-primary" size={20} />
                </div>
                <span className="font-black text-xs text-primary uppercase tracking-[0.15em]">Nouveau Client</span>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </Link>

          <div className="bg-surface-container-lowest p-5 rounded-xl border-2 border-dashed border-outline-variant/30 text-center flex flex-col items-center gap-3">
            <HelpCircle className="text-slate-300" size={24} />
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest px-2">Besoin d&apos;aide ?</p>
            <Link href="#" className="text-primary font-black text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest hover:underline decoration-2">
              Centre d&apos;Aide
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1 pt-4">
          <h4 className="text-xl font-black text-[#1a1b21] tracking-tighter uppercase">Activités Récentes</h4>
          <Link href="/dashboard/quotes">
            <span className="font-black text-primary text-[10px] uppercase tracking-widest hover:underline cursor-pointer">Voir tout</span>
          </Link>
        </div>
        
        <Card className="rounded-2xl shadow-diffused overflow-hidden border-none bg-white py-4">
          <div className="grid grid-cols-4 px-10 py-5 text-xs font-black uppercase tracking-widest text-[#5e6c84]/70">
            <span>Client</span>
            <span>Référence</span>
            <span>Montant</span>
            <span className="text-right pr-6">Statut</span>
          </div>
          
          <div className="border-b border-dashed border-[#4A90E2]/40 mx-8 mb-4"></div>

          <div className="space-y-1">
            {(quotes as Quote[] || []).slice(0, 5).map((quote) => (
              <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="grid grid-cols-4 px-10 py-5 items-center hover:bg-slate-50/50 transition-all cursor-pointer group rounded-xl mx-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary font-black text-sm shadow-sm border border-slate-200">
                    {quote.clients?.name?.charAt(0) || 'C'}
                  </div>
                  <span className="font-bold text-[#1a1b21] tracking-tight text-base">{quote.clients?.name || 'Client Inconnu'}</span>
                </div>
                <span className="text-[#5e6c84] font-bold text-sm tracking-tight">{quote.number}</span>
                <span className="font-black text-xl tracking-tighter text-[#1a1b21]">{Number(quote.total_ttc).toLocaleString('fr-FR')}€</span>
                <div className="text-right">
                  <span className={`inline-flex items-center justify-center h-12 w-36 rounded-md font-black text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-sm ${
                    quote.status === 'accepted' ? 'bg-[#e6fcf5] text-[#0ca678]' :
                    quote.status === 'sent' ? 'bg-[#e7f5ff] text-[#228be6]' :
                    quote.status === 'draft' ? 'bg-[#3e2400] text-white' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {quote.status === 'accepted' ? 'ACCEPTÉ' : 
                     quote.status === 'sent' ? 'ENVOYÉ' : 
                     quote.status === 'draft' ? 'EN ATTENTE' : 
                     quote.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
