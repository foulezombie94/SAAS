'use client'

import React, { useState, useEffect } from 'react'
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

interface InvoicesClientProps {
  initialInvoices: any[]
  userId: string
}

export function InvoicesClient({ initialInvoices, userId }: InvoicesClientProps) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('invoices-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${userId}` },
        () => {
          // Refresh list on any change
          fetchInvoices()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) setInvoices(data)
  }

  const totals = {
    paid: invoices?.filter(i => i.status === 'paid').reduce((acc, i) => acc + Number(i.total_ttc), 0) || 0,
    unpaid: invoices?.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((acc, i) => acc + Number(i.total_ttc), 0) || 0,
    count: invoices?.length || 0
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between self-stretch gap-8">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none mb-3">Factures & Paiements</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs opacity-60">
            Gestion administrative et suivi de vos encaissements
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              className="bg-white border-none outline-none focus:ring-2 focus:ring-primary/10 pl-12 pr-6 py-4 rounded-2xl shadow-diffused text-on-surface font-bold placeholder:text-slate-300 transition-all uppercase text-[10px] tracking-widest w-64" 
              placeholder="N° Facture..." 
              type="text"
            />
          </div>
          <Button variant="tertiary" className="h-14 px-6 font-black uppercase tracking-widest text-[10px] gap-2">
            <Filter size={16} /> Filtrer
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none shadow-diffused bg-surface-container-lowest border-2 border-primary/5">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-8">Nombre de factures</p>
          <div className="flex items-center gap-6">
            <span className="text-4xl font-black tracking-tighter text-primary">{totals.count}</span>
          </div>
        </Card>
        
        <Card className="p-8 bg-green-50/50 border-none shadow-sm flex flex-col justify-between">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-green-700/60 mb-8">CA Encaissé (TTC)</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black tracking-tighter text-green-700">{totals.paid.toLocaleString('fr-FR')}</span>
             <span className="text-xl font-black text-green-700/40">€</span>
          </div>
        </Card>

        <Card className="p-8 bg-tertiary-container text-on-tertiary-container border-none shadow-diffused">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60 mb-8">En attente de paiement</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black tracking-tighter">{totals.unpaid.toLocaleString('fr-FR')}</span>
             <span className="text-xl font-black opacity-40">€</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {invoices?.map((invoice) => (
          <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className="group">
            <Card className="p-8 border-none shadow-sm hover:shadow-lg transition-all bg-white relative overflow-hidden group-hover:scale-[1.02] active:scale-[0.98]">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                invoice.status === 'paid' ? 'bg-green-500' : 'bg-slate-300'
              }`} />

              <div className="flex justify-between items-start mb-10">
                <div>
                    <h5 className="font-black text-primary tracking-tighter text-2xl uppercase">{invoice.number}</h5>
                    <p className="text-[0.6875rem] font-black text-on-surface-variant/40 uppercase tracking-widest mt-1">
                      {invoice.clients?.name}
                    </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-surface-container-high text-on-surface-variant'
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

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                    Voir la facture <ArrowRight size={14} />
                 </div>
                 <MoreVertical size={20} className="text-slate-100" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
