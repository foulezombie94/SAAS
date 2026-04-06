'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  ArrowRight
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Invoice } from '@/types/dashboard'
import { useSyncCache } from '@/lib/hooks/useSyncCache'
import { Loader2 } from 'lucide-react'
import { useCallback } from 'react'

interface InvoicesClientProps {
  initialInvoices: Invoice[]
  userId: string
}

export function InvoicesClient({ initialInvoices, userId }: InvoicesClientProps) {
  const supabase = createClient()

  // 0. Fetcher Source de Vérité
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Invoice[]
  }, [supabase, userId])

  const { data: invoices, isSyncing, revalidate } = useSyncCache<Invoice[]>(
    `invoices-${userId}`, 
    initialInvoices, 
    fetcher,
    { ttl: 1000 * 60 * 30, refreshInterval: 1000 * 60 * 5 } // Polling 5 min
  )

  const [searchTerm, setSearchTerm] = useState('')

  // 2. Sync Realtime & Fetch
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

  // 3. Filtrage Haute Performance (0ms latence)
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices
    if (!Array.isArray(invoices)) return []
    const lowerSearch = searchTerm.toLowerCase()
    return invoices.filter(invoice => 
      (invoice.number || '').toLowerCase().includes(lowerSearch) || 
      (invoice.clients?.name || '').toLowerCase().includes(lowerSearch)
    )
  }, [invoices, searchTerm])

  // 4. Calculs Optimisés (useMemo)
  const totals = useMemo(() => ({
    paid: filteredInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + Number(i.total_ttc), 0),
    unpaid: filteredInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((acc, i) => acc + Number(i.total_ttc), 0),
    count: filteredInvoices.length
  }), [filteredInvoices])

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between self-stretch gap-8">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none mb-3 italic">Factures & Flux</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 flex items-center gap-2">
             {totals.count} documents {searchTerm ? 'filtrés' : 'détectés'} • 
             {isSyncing ? (
               <span className="flex items-center gap-1.5 text-primary animate-pulse">
                 <Loader2 size={10} className="animate-spin" /> Synchronisation...
               </span>
             ) : (
               <span className="text-emerald-500">Flux à jour</span>
             )}
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              className="bg-white border-2 border-slate-50 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 pl-12 pr-6 py-4 rounded-2xl shadow-diffused text-on-surface font-black placeholder:text-slate-300 transition-all uppercase text-[10px] tracking-widest w-72" 
              placeholder="Recherche instantanée..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-14 px-6 font-black uppercase tracking-widest text-[10px] gap-2 border-slate-100">
            <Filter size={16} /> Filtre
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none shadow-diffused bg-surface-container-lowest border-2 border-primary/5 group hover:border-primary/20 transition-all">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-8">Nombre de factures</p>
          <div className="flex items-center gap-6">
            <span className="text-4xl font-black tracking-tighter text-primary group-hover:scale-110 transition-transform">{totals.count}</span>
          </div>
        </Card>
        
        <Card className="p-8 bg-emerald-50/50 border-none shadow-sm flex flex-col justify-between group hover:bg-emerald-50 transition-all">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-emerald-700/60 mb-8">CA Encaissé (TTC)</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black tracking-tighter text-emerald-700">{totals.paid.toLocaleString('fr-FR')}</span>
             <span className="text-xl font-black text-emerald-700/40">€</span>
          </div>
        </Card>

        <Card className="p-8 bg-primary/5 border-none shadow-diffused group hover:bg-primary/10 transition-all">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-primary/60 mb-8">En attente de paiement</p>
          <div className="flex items-baseline gap-2 text-primary">
             <span className="text-4xl font-black tracking-tighter">{totals.unpaid.toLocaleString('fr-FR')}</span>
             <span className="text-xl font-black opacity-40">€</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInvoices?.map((invoice) => (
          <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className="group">
            <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all bg-white relative overflow-hidden group-hover:scale-[1.02] active:scale-[0.98] rounded-3xl">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                invoice.status === 'paid' ? 'bg-emerald-500' : 'bg-slate-200'
              }`} />

              <div className="flex justify-between items-start mb-10">
                <div>
                    <h5 className="font-black text-primary tracking-tighter text-2xl uppercase group-hover:text-primary-container transition-colors">{invoice.number}</h5>
                    <p className="text-[0.6875rem] font-black text-on-surface-variant/40 uppercase tracking-widest mt-1">
                      {invoice.clients?.name}
                    </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {invoice.status}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[0.6875rem] font-black uppercase tracking-widest text-on-surface-variant/30 mb-1">Montant TTC</p>
                  <span className="text-3xl font-black text-primary tracking-tighter">{Number(invoice.total_ttc).toLocaleString('fr-FR')}€</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                    Détails facture <ArrowRight size={14} />
                 </div>
                 <MoreVertical size={20} className="text-slate-100 group-hover:text-slate-300 transition-colors" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {filteredInvoices.length === 0 && (
        <Card className="p-20 text-center flex flex-col items-center justify-center gap-6 bg-slate-50/50 border-dashed border-2 border-slate-200 rounded-3xl mt-12">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm">
             <Search size={32} />
           </div>
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-md">
             Aucune trace de ce numéro ou client dans vos archives.
           </p>
        </Card>
      )}
    </div>
  )
}
