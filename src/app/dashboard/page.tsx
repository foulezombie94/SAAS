import { createClient } from '@/utils/supabase/server'
import { 
  getCachedDashboardStats, 
  getCachedRecentQuotes 
} from '@/utils/supabase/cached-queries'
import { Quote, DashboardStats } from '@/types/dashboard'
import Link from 'next/link'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { getDashboardActivity } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 🚀 Fetch stats & activity with Session Security
  const [stats, quotes] = await Promise.all([
    getCachedDashboardStats(user.id) as Promise<DashboardStats>,
    getCachedRecentQuotes(user.id)
  ])
  
  const initialActivity = await getDashboardActivity(7)

  return (
    <div className="p-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-1">
              <h2 className="text-[1.75rem] font-headline font-bold tracking-tight text-on-surface">
                Bonjour, {user?.email?.split('@')[0]}
              </h2>
              <p className="text-on-surface-variant font-medium">Voici l&apos;état actuel de votre activité pour ce mois.</p>
          </div>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CA Mensuel */}
          <div className="bg-surface-container-low p-8 rounded-xl space-y-4 shadow-sm border border-outline-variant/10">
              <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-primary text-2xl">payments</span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                    stats.revenue_change >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                      <span className="material-symbols-outlined text-sm">
                        {stats.revenue_change >= 0 ? 'trending_up' : 'trending_down'}
                      </span> 
                      {stats.revenue_change >= 0 ? '+' : ''}{stats.revenue_change}%
                  </div>
              </div>
              <div>
                  <p className="text-[0.6875rem] font-label uppercase tracking-widest text-on-surface-variant mb-1 font-bold">CA Mensuel</p>
                  <h3 className="text-[3.5rem] font-headline font-bold leading-none tracking-tighter text-on-surface">
                    {Math.round(stats.revenue).toLocaleString('fr-FR')}€
                  </h3>
              </div>
          </div>

          {/* Factures Impayées */}
          <div className="bg-tertiary-fixed text-on-tertiary-fixed p-8 rounded-xl space-y-4 shadow-sm">
              <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-tertiary text-2xl">pending_actions</span>
                  <div className="flex items-center gap-1 bg-tertiary-fixed-dim/20 px-2 py-1 rounded text-xs font-bold">
                    {stats.unpaid_count} en attente
                  </div>
              </div>
              <div>
                  <p className="text-[0.6875rem] font-label uppercase tracking-widest mb-1 font-bold opacity-70">Factures Impayées</p>
                  <h3 className="text-[3.5rem] font-headline font-bold leading-none tracking-tighter text-on-tertiary-fixed">
                    {Math.round(stats.unpaid).toLocaleString('fr-FR')}€
                  </h3>
              </div>
          </div>

          {/* Devis Acceptés */}
          <div className="bg-surface-container-lowest border-2 border-primary/5 p-8 rounded-xl space-y-4 shadow-sm">
              <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-green-600 text-2xl">task_alt</span>
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Ce mois</div>
              </div>
              <div>
                  <p className="text-[0.6875rem] font-label uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Devis Acceptés</p>
                  <h3 className="text-[3.5rem] font-headline font-bold leading-none tracking-tighter text-primary">
                    {stats.acceptedCount}
                  </h3>
              </div>
          </div>
      </section>

      {/* Main Analysis Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex justify-between items-center mb-10">
                  <h4 className="text-xl font-headline font-bold text-on-surface uppercase tracking-tight">Activité Mensuelle</h4>
                  <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-md border border-outline-variant/20 text-xs font-bold text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    7 DERNIERS JOURS
                  </div>
              </div>
              <div className="h-72">
                <ActivityChart initialData={initialActivity} />
              </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-6">
              <h4 className="text-xl font-headline font-bold text-on-surface uppercase tracking-tight">Actions Rapides</h4>
              <Link href="/dashboard/quotes/new" className="block">
                <button className="w-full h-24 bg-tertiary-fixed-dim hover:bg-tertiary-fixed transition-all flex items-center justify-between px-6 rounded-xl group shadow-sm active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-on-tertiary-fixed/10 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-tertiary-fixed text-2xl">add_box</span>
                        </div>
                        <span className="font-headline font-black text-on-tertiary-fixed uppercase tracking-widest text-sm">Créer un Devis</span>
                    </div>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-on-tertiary-fixed">chevron_right</span>
                </button>
              </Link>

              <Link href="/dashboard/clients" className="block">
                <button className="w-full h-24 bg-surface-container-high hover:bg-surface-container-highest transition-all flex items-center justify-between px-6 rounded-xl group shadow-sm active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
                        </div>
                        <span className="font-headline font-black text-on-surface uppercase tracking-widest text-sm">Nouveau Client</span>
                    </div>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-on-surface">chevron_right</span>
                </button>
              </Link>
          </div>
      </section>

      {/* Recent Activity Table */}
      <section className="space-y-6 pb-12">
          <div className="flex justify-between items-center px-1">
              <h4 className="text-xl font-headline font-bold text-on-surface uppercase tracking-tight">Activités Récentes</h4>
              <Link href="/dashboard/quotes">
                <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Voir tout</button>
              </Link>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="grid grid-cols-4 px-8 py-5 bg-surface-container-high text-[0.6875rem] font-label uppercase tracking-widest text-on-surface-variant font-bold">
                  <span>Client</span>
                  <span>Référence</span>
                  <span>Montant</span>
                  <span className="text-right pr-2">Statut</span>
              </div>
              
              <div className="divide-y divide-outline-variant/10">
                  {(quotes as Quote[] || []).slice(0, 5).map((quote) => (
                    <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} 
                      className="grid grid-cols-4 px-8 py-6 items-center hover:bg-surface-container/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-[11px] font-black text-primary border border-primary/10">
                              {quote.clients?.name?.charAt(0) || 'C'}
                            </div>
                            <span className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                              {quote.clients?.name || 'Client Inconnu'}
                            </span>
                        </div>
                        <span className="text-on-surface-variant font-bold text-sm tracking-tight">{quote.number}</span>
                        <span className="font-black text-lg text-on-surface tracking-tighter">
                          {Number(quote.total_ttc).toLocaleString('fr-FR')}€
                        </span>
                        <div className="text-right">
                            <span className={`inline-flex items-center px-6 py-2.5 rounded-lg font-label font-black text-[11px] uppercase tracking-[0.15em] border shadow-sm transition-transform active:scale-95 ${
                              quote.status === 'accepted' ? 'bg-green-100/50 text-green-700 border-green-200' :
                              quote.status === 'sent' ? 'bg-tertiary-container/10 text-on-tertiary-container border-tertiary-fixed-dim/20' :
                              quote.status === 'draft' ? 'bg-slate-100/50 text-slate-600 border-slate-200' :
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {quote.status === 'accepted' ? 'Accepté' : 
                               quote.status === 'sent' ? 'En Attente' : 
                               quote.status === 'draft' ? 'Brouillon' : 
                               quote.status}
                            </span>
                        </div>
                    </Link>
                  ))}
              </div>
          </div>
      </section>
    </div>
  )
}
