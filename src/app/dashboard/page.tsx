import { createClient } from '@/utils/supabase/server'
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: quotes } = await supabase.from('quotes').select('*, clients(*)').order('created_at', { ascending: false })
  const { data: invoices } = await supabase.from('invoices').select('*, clients(*)').order('created_at', { ascending: false })

  const stats = {
    revenue: quotes?.reduce((acc, q) => acc + (q.status === 'accepted' || q.status === 'invoiced' ? Number(q.total_ttc) : 0), 0) || 0,
    unpaid: invoices?.reduce((acc, i) => acc + (i.status !== 'paid' ? Number(i.total_ttc) : 0), 0) || 0,
    acceptedCount: quotes?.filter(q => q.status === 'accepted').length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black tracking-tighter text-primary leading-none uppercase">Bonjour, {user?.email?.split('@')[0]}</h2>
          <p className="text-on-surface-variant font-bold text-sm">Voici l'état actuel de votre activité pour ce mois.</p>
        </div>
        <div className="bg-primary-container/10 px-5 py-3 rounded-xl flex items-center gap-3 border border-primary/5 shadow-sm">
          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-on-surface-variant/60">Votre Plan</p>
            <p className="font-black text-primary text-base uppercase tracking-tighter">Plan Pro Actif</p>
          </div>
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
            <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              <TrendingUp size={10} /> +12%
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
              {invoices?.filter(i => i.status !== 'paid').length || 0} en attente
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
            <div className="text-[0.625rem] font-black text-on-surface-variant/40 uppercase tracking-widest">Ce mois</div>
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
            <div className="w-full bg-primary/10 rounded-t-lg h-[40%] hover:bg-primary/20 transition-all cursor-help" title="Semaine 1"></div>
            <div className="w-full bg-primary/10 rounded-t-lg h-[55%] hover:bg-primary/20 transition-all cursor-help"></div>
            <div className="w-full bg-primary/30 rounded-t-lg h-[35%] hover:bg-primary/40 transition-all cursor-help"></div>
            <div className="w-full bg-primary/40 rounded-t-lg h-[65%] hover:bg-primary/50 transition-all cursor-help"></div>
            <div className="w-full bg-primary rounded-t-lg h-[85%] hover:shadow-lg transition-all cursor-help"></div>
            <div className="w-full bg-primary/10 rounded-t-lg h-[45%] hover:bg-primary/20 transition-all cursor-help"></div>
            <div className="w-full bg-primary/20 rounded-t-lg h-[60%] hover:bg-primary/30 transition-all cursor-help"></div>
            <div className="w-full bg-primary rounded-t-lg h-[95%] hover:shadow-lg transition-all cursor-help"></div>
          </div>
          <div className="flex justify-between mt-4 text-[0.625rem] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>SEM 1</span>
            <span>SEM 2</span>
            <span>SEM 3</span>
            <span>SEM 4</span>
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
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest px-2">Besoin d'aide ?</p>
            <Link href="#" className="text-primary font-black text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest hover:underline decoration-2">
              Centre d'Aide
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
            {quotes?.slice(0, 5).map((quote) => (
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
