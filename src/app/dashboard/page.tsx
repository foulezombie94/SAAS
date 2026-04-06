import { createClient } from '@/utils/supabase/server'
import { getCachedDashboardStats, getCachedRecentQuotes } from '@/utils/supabase/cached-queries'
import { Quote } from '@/types/dashboard'
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
  const [stats, quotes] = await Promise.all([
    getCachedDashboardStats(),
    getCachedRecentQuotes()
  ])
  
  // Fetch only necessary recent activity
  const { data: invoices } = await supabase
    .from('invoices')
    .select('status, total_ttc')
    .eq('user_id', user.id)

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
              (stats as any).revenue_change >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              <TrendingUp size={10} className={(stats as any).revenue_change < 0 ? 'rotate-180' : ''} /> 
              {(stats as any).revenue_change >= 0 ? '+' : ''}{(stats as any).revenue_change}%
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
              {(stats as any).unpaid_count || 0} en attente
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
              (stats as any).quotes_change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(stats as any).quotes_change >= 0 ? '+' : ''}{(stats as any).quotes_change}% vs mois dernier
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
        <div className="lg:col-span-2 bg-surface-container-low/40 p-6 rounded-2xl border border-outline-variant/10">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-black text-primary tracking-tighter uppercase">Activité Mensuelle</h4>
            <select className="bg-white border-none text-[10px] font-black uppercase tracking-widest rounded-full px-4 py-2 shadow-sm focus:ring-primary/20">
              <option>30 derniers jours</option>
              <option>90 derniers jours</option>
            </select>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {(stats as any).history?.map((item: any, idx: number) => {
              const maxRev = Math.max(...(stats as any).history.map((h: any) => h.revenue), 1000);
              const height = Math.max((item.revenue / maxRev) * 100, 5); // Min 5% height
              return (
                <div 
                  key={idx}
                  className={`w-full rounded-t-lg transition-all cursor-help relative group ${
                    idx === (stats as any).history.length - 1 ? 'bg-primary shadow-lg' : 'bg-primary/20 hover:bg-primary/40'
                  }`}
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl pointer-events-none">
                    {item.revenue.toLocaleString('fr-FR')}€
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-[0.625rem] font-black uppercase tracking-[0.2em] text-slate-400">
            {(stats as any).history?.map((item: any, idx: number) => (
              <span key={idx}>{item.month}</span>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h4 className="text-lg font-black text-primary uppercase tracking-tighter">Actions Rapides</h4>
          <Link href="/dashboard/quotes/new" className="block">
            <button className="w-full h-16 bg-tertiary-fixed-dim hover:bg-tertiary-fixed transition-all flex items-center justify-between px-6 rounded-xl group shadow-sm active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-on-tertiary-fixed/10 rounded-full flex items-center justify-center">
                  <Plus className="text-on-tertiary-fixed" size={20} />
                </div>
                <span className="font-black text-base text-on-tertiary-fixed uppercase tracking-tighter">Créer un Devis</span>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </Link>
          
          <Link href="/dashboard/clients" className="block">
            <button className="w-full h-16 bg-surface-container-high hover:bg-surface-container-highest transition-all flex items-center justify-between px-6 rounded-xl group shadow-sm active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="text-primary" size={20} />
                </div>
                <span className="font-black text-base text-primary uppercase tracking-tighter">Nouveau Client</span>
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
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xl font-black text-primary uppercase tracking-tighter">Activités Récentes</h4>
          <Link href="/dashboard/quotes">
            <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px]">Voir tout</Button>
          </Link>
        </div>
        
        <Card className="rounded-2xl shadow-diffused overflow-hidden border-none bg-white">
          <div className="grid grid-cols-4 px-8 py-3 bg-surface-container-low/50 text-[0.625rem] font-black uppercase tracking-widest text-on-surface-variant/50">
            <span>Client</span>
            <span>Référence</span>
            <span>Montant</span>
            <span className="text-right">Statut</span>
          </div>
          <div className="divide-y divide-slate-100/30">
            {(quotes as Quote[] || []).slice(0, 5).map((quote) => (
              <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="grid grid-cols-4 px-8 py-4 items-center hover:bg-surface-container-low/20 transition-all cursor-pointer group active:bg-surface-container-low/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    {quote.clients?.name?.charAt(0) || 'C'}
                  </div>
                  <span className="font-black text-primary tracking-tighter uppercase text-sm">{quote.clients?.name || 'Client Inconnu'}</span>
                </div>
                <span className="text-on-surface-variant font-bold text-xs tracking-tight">{quote.number}</span>
                <span className="font-black text-base tracking-tighter text-on-surface">{Number(quote.total_ttc).toLocaleString('fr-FR')}€</span>
                <div className="text-right">
                  <span className={`inline-flex items-center h-8 px-4 rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm ${
                    quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    quote.status === 'draft' ? 'bg-tertiary-container/10 text-on-tertiary-container' :
                    quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {quote.status}
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
