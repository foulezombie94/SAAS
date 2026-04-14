'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Receipt, 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  FileCheck,
  ChevronRight,
  MoreVertical,
  Plus,
  ArrowRight,
  RefreshCw,
  Loader2,
  User
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Invoice } from '@/types/dashboard'
import { useSyncCache } from '@/lib/hooks/useSyncCache'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { getInvoicesServer } from '@/app/dashboard/data-actions'

interface InvoicesClientProps {
  initialInvoices: Invoice[]
  userId: string
}

export function InvoicesClient({ initialInvoices, userId }: InvoicesClientProps) {
  const supabase = createClient()

  // 0. Fetcher pour la synchronisation (Source de Vérité)
  const fetcher = useCallback(async () => {
    return await getInvoicesServer()
  }, [])

  const { data: invoices, isSyncing, revalidate } = useSyncCache<Invoice[]>(
    `invoices-${userId}`, 
    initialInvoices, 
    fetcher,
    { ttl: 1000 * 60 * 30, refreshInterval: 1000 * 60 * 5 }
  )

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  // 1. Sync Realtime
  useEffect(() => {
    const channel = supabase
      .channel('invoices-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${userId}` },
        () => { revalidate() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId, revalidate])

  // 2. Filtrage instantané
  const filteredInvoices = useMemo(() => {
    if (!debouncedSearch) return invoices || []
    if (!Array.isArray(invoices)) return []
    const lowerSearch = debouncedSearch.toLowerCase()
    return invoices.filter(invoice => 
      (invoice.number || '').toLowerCase().includes(lowerSearch) || 
      (invoice.clients?.name || '').toLowerCase().includes(lowerSearch)
    )
  }, [invoices, debouncedSearch])

  // 3. Stats calculées dynamiquement
  const totals = useMemo(() => ({
    paid: filteredInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + Number(i.total_ttc), 0),
    unpaid: filteredInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((acc, i) => acc + Number(i.total_ttc), 0),
    count: filteredInvoices.length
  }), [filteredInvoices])

  return (
    <div className="space-y-20 pb-32 mt-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between self-stretch gap-12">
        <div>
          <h2 className="text-6xl font-black text-primary tracking-tighter uppercase leading-none mb-4 italic">Factures & Flux</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-[0.3em] text-[10px] opacity-40 flex items-center gap-4">
             <span className="flex items-center gap-2">
                <Receipt size={14} className="text-primary/40" />
                {totals.count} documents {searchTerm ? 'filtrés' : 'détectés'}
             </span>
             <span className="w-1 h-1 bg-slate-200 rounded-full" />
             <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm font-black italic">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                Flux en direct
             </span>
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={20} />
            <input 
              className="bg-white border-2 border-slate-50 outline-none focus:ring-[12px] focus:ring-primary/5 focus:border-primary/20 pl-16 pr-8 h-16 rounded-2xl shadow-sm text-on-surface font-black placeholder:text-slate-200 transition-all uppercase text-[11px] tracking-widest w-96" 
              placeholder="Recherche instantanée..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-16 px-8 gap-3 border-slate-100 hover:bg-slate-50">
            <Filter size={18} /> Filtre
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <Card className="p-10 border-none shadow-xl shadow-slate-100 bg-white border-2 border-transparent group hover:border-primary/10 transition-all rounded-[32px]">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 mb-10 flex items-center gap-2">
            <Receipt size={14} /> Nombre de factures
          </p>
          <div className="flex items-center gap-4">
            <span className="text-6xl font-black tracking-tighter text-primary group-hover:scale-105 transition-transform duration-500">{totals.count}</span>
            <div className="w-12 h-1 bg-primary/10 rounded-full mt-4" />
          </div>
        </Card>
        
        <Card className="p-10 bg-emerald-50/30 border-none shadow-xl shadow-emerald-900/5 flex flex-col justify-between group hover:bg-emerald-50 transition-all rounded-[32px] border border-emerald-100/50">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.3em] text-emerald-700/40 mb-10 flex items-center gap-2">
            <TrendingUp size={14} /> CA Encaissé (TTC)
          </p>
          <div className="flex items-baseline gap-3">
             <span className="text-6xl font-black tracking-tighter text-emerald-700">{totals.paid.toLocaleString('fr-FR')}</span>
             <span className="text-2xl font-black text-emerald-700/30 italic">€</span>
          </div>
        </Card>

        <Card className="p-10 bg-primary/5 border-none shadow-xl shadow-blue-900/5 group hover:bg-primary/10 transition-all rounded-[32px] border border-primary/10">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.3em] text-primary/40 mb-10 flex items-center gap-2">
            <Clock size={14} /> En attente
          </p>
          <div className="flex items-baseline gap-3 text-primary">
             <span className="text-6xl font-black tracking-tighter italic">{totals.unpaid.toLocaleString('fr-FR')}</span>
             <span className="text-2xl font-black opacity-20 uppercase italic">€</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {filteredInvoices?.map((invoice) => (
          <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className="group">
            <Card className="p-10 border border-slate-100/50 shadow-lg shadow-slate-100 hover:shadow-[0_32px_64px_-12px_rgba(0,40,120,0.12)] transition-all bg-white relative overflow-hidden group-hover:scale-[1.02] active:scale-[0.98] rounded-[40px]">
              <div className={`absolute top-0 left-0 w-full h-2 transition-all duration-500 group-hover:h-3 ${
                invoice.status === 'paid' ? 'bg-emerald-500' : 'bg-primary'
              }`} />

              <div className="flex justify-between items-start mb-12">
                <div>
                    <h5 className="font-black text-primary tracking-tighter text-4xl uppercase leading-none mb-3 italic">{invoice.number}</h5>
                    <p className="text-[0.75rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                      <User size={12} className="opacity-30" />
                      {invoice.clients?.name}
                    </p>
                </div>
                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm italic transition-all ${
                  invoice.status === 'paid' 
                    ? 'bg-emerald-500 text-white shadow-emerald-200' 
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {invoice.status === 'paid' ? 'Payée' : 'Envoyée'}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[0.6875rem] font-black uppercase tracking-[0.3em] text-slate-300 mb-2">Montant Total TTC</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-primary tracking-tighter">{Number(invoice.total_ttc).toLocaleString('fr-FR')}</span>
                    <span className="text-xl font-black text-primary/30 uppercase">€</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3 text-primary font-black text-[11px] uppercase tracking-[0.2em] group-hover:gap-6 transition-all italic">
                    Détails facture <ArrowRight size={18} className="text-primary/40 group-hover:text-primary transition-colors" />
                 </div>
                 <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                    <ChevronRight size={20} />
                 </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {filteredInvoices.length === 0 && (
        <Card className="p-32 text-center flex flex-col items-center justify-center gap-8 bg-slate-50/50 border-dashed border-4 border-slate-100 rounded-[48px] mt-20">
           <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-slate-100 shadow-xl border border-slate-50">
             <Search size={48} />
           </div>
           <div>
              <p className="text-xl font-black text-[#002878] uppercase tracking-tighter mb-2 italic">Aucune Enregistrement</p>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed max-w-sm mx-auto">
                Vos archives ne contiennent aucune trace de ce numéro ou client.
              </p>
           </div>
        </Card>
      )}
    </div>
  )
}
