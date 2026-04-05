import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Filter,
  Calendar
} from 'lucide-react'

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, clients(name)')
    .eq('user_id', user?.id || '')
    .order('created_at', { ascending: false })

  const safeQuotes = quotes || []

  const stats = {
    total: safeQuotes.length,
    accepted: safeQuotes.filter(q => q.status === 'accepted').length,
    pending: safeQuotes.filter(q => q.status === 'sent' || q.status === 'draft').length,
    totalValue: safeQuotes.reduce((acc, q) => acc + Number(q.total_ttc), 0)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100'
      case 'invoiced': return 'bg-purple-50 text-purple-700 border-purple-100'
      default: return 'bg-slate-50 text-slate-500 border-slate-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepté'
      case 'sent': return 'Envoyé'
      case 'rejected': return 'Refusé'
      case 'invoiced': return 'Facturé'
      case 'draft': return 'Brouillon'
      default: return status
    }
  }

  return (
    <div className="space-y-12">
      {/* Header & Search */}
      <header className="flex flex-col md:flex-row md:items-end justify-between self-stretch gap-8">
        <div className="flex-1">
          <h2 className="text-4xl font-black text-[#00236f] tracking-tighter uppercase leading-none mb-3">Gestion des Devis</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60">
            {stats.total} devis émis • Suivi de vos chantiers en temps réel
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00236f] transition-colors" size={20} />
            <input 
              className="w-full bg-white border border-slate-100 outline-none focus:ring-2 focus:ring-[#00236f]/10 pl-14 pr-6 py-4 rounded-2xl shadow-sm text-[#00236f] font-bold placeholder:text-slate-300 transition-all uppercase text-[10px] tracking-widest" 
              placeholder="Numéro, client, montant..." 
              type="text"
            />
          </div>
          <Link href="/dashboard/quotes/new" className="w-full md:w-auto">
            <Button className="w-full h-14 px-8 bg-[#00236f] hover:bg-[#001b54] text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg shadow-blue-900/10 active:scale-95 transition-all">
              <Plus size={20} /> Nouveau Devis
            </Button>
          </Link>
        </div>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-8 bg-[#00236f] text-white border-none shadow-xl relative overflow-hidden flex flex-col justify-between h-48">
          <TrendingUp className="absolute -top-4 -right-4 opacity-10" size={120} />
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60">Valeur Totale Émise</p>
          <span className="text-4xl font-black tracking-tighter uppercase leading-none">
            {stats.totalValue.toLocaleString('fr-FR')} €
          </span>
        </Card>
        
        <Card className="p-8 bg-white border border-slate-100 shadow-sm flex flex-col justify-between h-48 group hover:border-[#00236f]/20 transition-all">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">En Attente / Brouillons</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black tracking-tighter text-[#00236f]">{stats.pending}</span>
            <Clock className="text-orange-400" size={32} />
          </div>
        </Card>

        <Card className="p-8 bg-white border border-slate-100 shadow-sm flex flex-col justify-between h-48 group hover:border-[#00236f]/20 transition-all">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">Devis Acceptés</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black tracking-tighter text-emerald-600">{stats.accepted}</span>
            <CheckCircle2 className="text-emerald-500" size={32} />
          </div>
        </Card>

        <Card className="p-8 bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-between h-48">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">Taux de Conversion</p>
          <span className="text-4xl font-black tracking-tighter text-[#00236f]">
            {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0} %
          </span>
        </Card>
      </div>

      {/* Quote List Layout */}
      <div className="space-y-4">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 px-10 py-3 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">
          <div className="col-span-2">N° Devis</div>
          <div className="col-span-4">Client / Entreprise</div>
          <div className="col-span-2">Date Émission</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-2 text-right">Montant TTC</div>
        </div>

        {/* Quote Slabs */}
        <div className="flex flex-col gap-4">
          {quotes?.map((quote) => (
            <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="block">
              <Card className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#00236f]/30 transition-all cursor-pointer bg-white group hover:scale-[1.01] active:scale-[0.99] rounded-2xl">
                <div className="col-span-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Dossier n°</span>
                    <span className="font-black text-[#00236f] tracking-tighter text-xl uppercase">{quote.number}</span>
                  </div>
                </div>

                <div className="col-span-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#00236f]/5 flex items-center justify-center text-[#00236f] font-black text-lg group-hover:bg-[#00236f] group-hover:text-white transition-all uppercase">
                    {quote.clients?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="font-black text-[#00236f] uppercase tracking-tighter text-lg">{quote.clients?.name || 'Client Inconnu'}</h4>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <Calendar size={10} />
                      Mis à jour récemment
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                   {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}
                </div>

                <div className="col-span-2">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${getStatusStyle(quote.status || 'draft')}`}>
                    {getStatusLabel(quote.status || 'draft')}
                  </span>
                </div>

                <div className="col-span-2 text-right">
                  <div className="flex flex-col">
                    <span className="font-black text-[#00236f] text-2xl tracking-tighter">
                      {Number(quote.total_ttc).toLocaleString('fr-FR')} €
                    </span>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">TTC</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {(!quotes || quotes.length === 0) && (
            <Card className="flex flex-col items-center justify-center p-32 bg-white border-2 border-dashed border-slate-100 text-center rounded-3xl">
              <div className="w-24 h-24 bg-[#00236f]/5 rounded-full flex items-center justify-center text-[#00236f]/30 mb-8 animate-pulse">
                <FileText size={48} />
              </div>
              <h3 className="text-3xl font-black text-[#00236f] uppercase tracking-tighter mb-4">Aucun devis enregistré</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-sm mb-10 leading-relaxed">
                Il est temps de lancer votre premier projet. Chaque devis accepté peut être converti en facture instantanément.
              </p>
              <Link href="/dashboard/quotes/new">
                <Button className="h-16 px-10 bg-[#00236f] hover:bg-[#001b54] text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl">
                  <Plus size={20} /> Créer mon premier devis
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
