'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Calendar,
  RefreshCw,
  Loader2,
  Check,
  Send,
  MessageSquare,
  PenTool,
  Banknote,
  Receipt
} from 'lucide-react'
import { Quote } from '@/types/dashboard'
import { useSyncCache } from '@/lib/hooks/useSyncCache'
import { createClient } from '@/utils/supabase/client'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { getQuotesServer } from '@/app/dashboard/data-actions'

interface QuotesClientProps {
  initialQuotes: Quote[]
  userId: string
}

export function QuotesClient({ initialQuotes, userId }: QuotesClientProps) {
  const supabase = createClient()

  // 0. Fetcher pour la synchronisation (Source de Vérité)
  const fetcher = useCallback(async () => {
    return await getQuotesServer()
  }, [])

  const { data: quotes, isSyncing, revalidate } = useSyncCache<Quote[]>(
    `quotes-${userId}`, 
    initialQuotes, 
    fetcher,
    { ttl: 1000 * 60 * 30, refreshInterval: 1000 * 60 * 5 } // Polling 5 min
  )
  
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 200)

  // 1. Realtime Push (Synchronisation Instantanée God Tier)
  useEffect(() => {
    const channel = supabase
      .channel(`quotes-list-sync-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'quotes', 
          filter: `user_id=eq.${userId}` 
        },
        () => {
          console.log("🔄 Realtime update for quotes list")
          revalidate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, revalidate, userId])

  // 2. Filtrage instantané (God Tier)
  const filteredQuotes = useMemo<Quote[]>(() => {
    const quotesList = (quotes || []) as Quote[]
    if (!debouncedSearch) return quotesList
    const lowerSearch = debouncedSearch.toLowerCase()
    return quotesList.filter(q => 
      (q.number || '').toLowerCase().includes(lowerSearch) || 
      (q.clients?.name || '').toLowerCase().includes(lowerSearch)
    )
  }, [quotes, debouncedSearch])

  // 3. Stats calculées dynamiquement
  const stats = useMemo(() => ({
    total: filteredQuotes.length,
    accepted: filteredQuotes.filter((q: Quote) => q.status === 'accepted').length,
    pending: filteredQuotes.filter((q: Quote) => q.status === 'sent' || q.status === 'draft').length,
    totalValue: filteredQuotes.reduce((acc: number, q: Quote) => acc + Number(q.total_ttc), 0)
  }), [filteredQuotes])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-[#e6fcf5] text-[#0ca678]'
      case 'sent': return 'bg-[#e7f5ff] text-[#228be6]'
      case 'rejected': return 'bg-rose-50 text-rose-700'
      case 'invoiced': return 'bg-purple-50 text-purple-700'
      case 'draft': return 'bg-[#3e2400] text-white'
      default: return 'bg-slate-100 text-slate-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepté'
      case 'sent': return 'Envoyé'
      case 'rejected': return 'Refusé'
      case 'invoiced': return 'Facturé'
      case 'draft': return 'En Attente'
      default: return status
    }
  }


  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between self-stretch gap-8">
        <div className="flex-1">
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none mb-3 italic">Archives Pro</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 flex items-center gap-2">
             {stats.total} projets {searchTerm ? 'filtrés' : 'répertoriés'} • 
             {isSyncing ? (
               <span className="flex items-center gap-1.5 text-primary animate-pulse">
                 <Loader2 size={10} className="animate-spin" /> Synchronisation...
               </span>
             ) : (
               <span className="text-emerald-500">Données à jour</span>
             )}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              className="w-full bg-white border-2 border-slate-50 outline-none focus:ring-4 focus:ring-primary/5 pl-14 pr-6 py-4 rounded-3xl shadow-sm text-primary font-black placeholder:text-slate-300 transition-all uppercase text-[10px] tracking-widest" 
              placeholder="Numéro, client, montant..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href="/dashboard/quotes/new" className="w-full md:w-auto">
            <Button className="w-full h-14 px-8 bg-primary hover:bg-primary-container text-on-primary font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl active:scale-95 transition-all rounded-3xl">
              <Plus size={20} /> Nouveau Devis
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-8 bg-primary text-on-primary border-none shadow-2xl relative overflow-hidden flex flex-col justify-between h-48 rounded-3xl group">
          <TrendingUp className="absolute -top-4 -right-4 opacity-5 group-hover:scale-125 transition-transform" size={140} />
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60">Volume Brut</p>
          <span className="text-4xl font-black tracking-tighter uppercase leading-none">
            {stats.totalValue.toLocaleString('fr-FR')} €
          </span>
        </Card>
        
        <Card className="p-8 bg-white border-2 border-slate-50 shadow-sm flex flex-col justify-between h-48 group hover:border-primary/20 transition-all rounded-3xl">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">En Attente</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black tracking-tighter text-primary group-hover:scale-110 transition-transform">{stats.pending}</span>
            <Clock className="text-orange-400" size={32} />
          </div>
        </Card>

        <Card className="p-8 bg-white border-2 border-slate-50 shadow-sm flex flex-col justify-between h-48 group hover:border-emerald-200 transition-all rounded-3xl">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">Succès Client</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black tracking-tighter text-emerald-600 group-hover:scale-110 transition-transform">{stats.accepted}</span>
            <CheckCircle2 className="text-emerald-500" size={32} />
          </div>
        </Card>

        <Card className="p-8 bg-slate-50/50 border-none shadow-inner flex flex-col justify-between h-48 rounded-3xl">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">Conversion</p>
          <span className="text-4xl font-black tracking-tighter text-primary">
            {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0} <span className="text-xl opacity-40">%</span>
          </span>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="hidden md:grid grid-cols-12 px-12 py-4 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">
          <div className="col-span-2">Dossier</div>
          <div className="col-span-3">Mandataire</div>
          <div className="col-span-5 text-center">État</div>
          <div className="col-span-2 text-right">Volume TTC</div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredQuotes?.map((quote) => (
            <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="block group">
              <Card className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group-hover:scale-[1.01] active:scale-[0.99] rounded-3xl">
                <div className="col-span-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">N°</span>
                    <span className="font-black text-primary tracking-tighter text-xl uppercase italic underline decoration-primary/10 group-hover:decoration-primary/40 transition-all">{quote.number}</span>
                  </div>
                </div>

                <div className="col-span-3 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-on-primary transition-all uppercase shadow-sm shrink-0">
                    {quote.clients?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-primary uppercase tracking-tighter text-lg truncate group-hover:text-primary-container transition-colors">{quote.clients?.name || 'Client Inconnu'}</h4>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                       {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="col-span-5 flex items-center justify-center -mx-4">
                  <div className="flex items-center justify-between w-full max-w-sm">
                    {[
                      { id: 'created', label: 'CREATED', icon: Check, active: true },
                      { id: 'sent', label: 'SENT', icon: Send, active: quote.status !== 'draft' },
                      { id: 'consulted', label: 'CONSULTED', icon: MessageSquare, active: !!quote.last_viewed_at },
                      { id: 'signed', label: 'SIGNED', icon: PenTool, active: ['accepted', 'paid', 'invoiced'].includes(quote.status || 'draft') },
                      { id: 'paid', label: 'PAID', icon: Banknote, active: ['paid', 'invoiced'].includes(quote.status || 'draft') }, 
                      { id: 'invoiced', label: 'INVOICED', icon: Receipt, active: quote.status === 'invoiced' },
                    ].map((step, idx, arr) => {
                       const isActive = step.active;
                       const isNextActive = idx < arr.length - 1 && arr[idx + 1].active;
                       const Icon = step.icon;
                       
                       return (
                         <React.Fragment key={step.label}>
                           <div className="flex flex-col items-center gap-2 relative z-10 bg-white px-1">
                             <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-all ${
                               isActive 
                                 ? 'bg-[#002878] text-white shadow-[0_4px_12px_rgba(0,40,120,0.2)]' 
                                 : 'bg-white border-2 border-slate-100 text-slate-300'
                             }`}>
                               <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                             </div>
                             <span className={`text-[7px] font-black uppercase tracking-[0.2em] absolute -bottom-4 whitespace-nowrap ${
                               isActive ? 'text-[#002878]' : 'text-slate-300'
                             }`}>
                               {step.label}
                             </span>
                           </div>
                           {idx < arr.length - 1 && (
                             <div className={`h-[2px] flex-1 rounded-full -mx-2 relative top-[-8px] ${
                               isNextActive ? 'bg-[#002878]' : 'bg-slate-100'
                             }`} />
                           )}
                         </React.Fragment>
                       )
                    })}
                  </div>
                </div>

                <div className="col-span-2 flex flex-col justify-center text-right pr-4">
                    <span className="font-black text-primary text-3xl tracking-tighter group-hover:scale-105 transition-transform origin-right">
                      {Number(quote.total_ttc).toLocaleString('fr-FR')} €
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Net à payer</span>
                </div>
              </Card>
            </Link>
          ))}

          {filteredQuotes.length === 0 && (
            <Card className="flex flex-col items-center justify-center p-32 bg-slate-50/30 border-2 border-dashed border-slate-100 text-center rounded-3xl shadow-inner">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary/10 mb-8 shadow-sm">
                <Search size={48} />
              </div>
              <h3 className="text-3xl font-black text-primary uppercase tracking-tighter mb-4 opacity-40">Aucun devis détecté</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-sm mb-10 leading-relaxed">
                Affinez vos critères ou créez un nouveau projet pour alimenter votre archive.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
