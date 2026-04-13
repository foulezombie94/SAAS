'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Quote } from '@/types/dashboard'
import { Eye, Landmark, Check, PenLine, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuoteSnapshotProps {
  quote: Quote
  onOpenPreview: () => void
}

export function QuoteSnapshot({ quote, onOpenPreview }: QuoteSnapshotProps) {
  const profile = quote.profiles
  const client = quote.clients

  return (
    <div className="space-y-4">
      {/* 🏷️ HEADER SECTION */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-primary rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aperçu du Document</h3>
        </div>
        <button 
          onClick={onOpenPreview}
          className="text-primary hover:text-primary-container transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest group"
        >
          Agrandir <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      <Card 
        onClick={onOpenPreview}
        className="relative aspect-[3/4.2] bg-slate-100 border border-slate-200/50 shadow-diffused rounded-[2.5rem] overflow-hidden cursor-pointer group transition-all duration-700 hover:shadow-3xl hover:border-primary/20"
      >
        {/* 📄 THE LIVE MINIATURE DOCUMENT (NO MORE SKELETONS) */}
        <div className="absolute inset-4 bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-700 group-hover:scale-[1.03] group-hover:-rotate-1">
          {/* Top Border Accent */}
          <div className="h-1 bg-primary w-full" />
          
          <div className="p-4 flex flex-col h-full pointer-events-none select-none overflow-hidden">
            {/* 🏢 REAL HEADER CONTENT */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-primary flex items-center justify-center rounded-[3px]">
                  <Landmark className="text-white" size={8} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[5px] font-black text-primary uppercase italic leading-none">ArtisanFlow</span>
                  <span className="text-[3px] font-bold text-slate-300 uppercase tracking-tighter leading-none whitespace-nowrap">Professional Systems</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-0.5">
                <span className="text-[5px] font-black text-slate-900 uppercase leading-none truncate max-w-[40px]">{profile?.company_name || 'Artisan'}</span>
                <span className="text-[3px] font-bold text-slate-400 uppercase leading-none italic">{profile?.phone || '+33 6...'}</span>
              </div>
            </div>

            {/* 📄 REAL TITLE & REFERENCE */}
            <div className="mb-4 border-b-2 border-primary/20 pb-2">
               <h4 className="text-[8px] font-black text-primary uppercase italic tracking-tighter leading-none">Devis #{quote.number}</h4>
               <p className="text-[4px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Ref : PROJET-{quote.id.substring(0, 4).toUpperCase()}</p>
            </div>

            {/* 👥 REAL CLIENT BOX & DATES */}
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
                  <span className="text-[3px] font-black text-primary uppercase tracking-widest mb-1 block opacity-50">Client</span>
                  <h5 className="text-[6px] font-black text-slate-900 uppercase leading-none truncate">{client?.name || 'Client'}</h5>
                  <p className="text-[4px] font-medium text-slate-400 mt-1 truncate italic">{client?.address}</p>
               </div>
               <div className="space-y-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center"><span className="text-[4px] text-slate-300 font-bold uppercase">Émis le</span><span className="text-[4px] text-slate-900 font-black">{new Date(quote.created_at).toLocaleDateString()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[4px] text-slate-300 font-bold uppercase">Valide</span><span className="text-[4px] text-slate-900 font-black">{quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '30j'}</span></div>
               </div>
            </div>

            {/* 🏗️ REAL ITEMS LIST (First few rows) */}
            <div className="flex-1 space-y-1">
               <div className="grid grid-cols-12 gap-1 bg-primary/10 p-1 rounded-sm">
                  <div className="col-span-8 text-[4px] font-black text-primary uppercase">Désignation</div>
                  <div className="col-span-4 text-[4px] font-black text-primary uppercase text-right">Total HT</div>
               </div>
               {quote.quote_items?.slice(0, 3).map((item, i) => (
                 <div key={i} className="grid grid-cols-12 gap-1 border-b border-slate-50 py-1">
                    <div className="col-span-8 flex flex-col gap-0.5">
                       <span className="text-[5px] font-black text-slate-900 leading-none truncate">{item.description}</span>
                       <span className="text-[3px] font-bold text-slate-300 tracking-tighter leading-none truncate italic">Prestation ArtisanFlow</span>
                    </div>
                    <div className="col-span-4 text-[5px] font-black text-slate-900 text-right leading-none self-center">{(item.total_price ?? 0).toLocaleString()} €</div>
                 </div>
               ))}
               {quote.quote_items && quote.quote_items.length > 3 && (
                 <div className="text-[3px] text-slate-300 italic text-center py-1">... et {(quote.quote_items.length - 3)} autres articles</div>
               )}
            </div>

            {/* 💰 REAL TOTALS & SIGNATURES */}
            <div className="mt-4 flex flex-col items-end gap-2">
               <div className="bg-primary/5 p-1.5 rounded-lg border border-primary/10 flex items-center gap-2">
                  <span className="text-[5px] font-black text-primary uppercase italic">Net à Payer</span>
                  <span className="text-[9px] font-black text-primary italic leading-none">{(quote.total_ttc ?? 0).toLocaleString()} €</span>
               </div>
               
               <div className="flex gap-2 w-full mt-2">
                  <div className={cn(
                    "flex-1 h-6 rounded-lg flex items-center justify-center border",
                    quote.artisan_signature_url ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                  )}>
                    {quote.artisan_signature_url ? <Check size={8} className="text-emerald-500" /> : <PenLine size={8} className="text-slate-200" />}
                  </div>
                  <div className={cn(
                    "flex-1 h-6 rounded-lg flex items-center justify-center border",
                    quote.client_signature_url ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                  )}>
                    {quote.client_signature_url ? <Check size={8} className="text-emerald-500" /> : <PenLine size={8} className="text-slate-200" />}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* 👁️ PREMIUM OVERLAY */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 backdrop-blur-[0px] group-hover:backdrop-blur-[3px] transition-all duration-700 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-white shadow-3xl flex items-center justify-center text-primary scale-0 group-hover:scale-100 transition-all duration-700 ease-out-back transform rotate-12 group-hover:rotate-0">
            <Eye size={28} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 translate-y-8 group-hover:translate-y-0 transition-all duration-700 delay-100">
             <span className="text-[12px] font-black uppercase tracking-[0.4em] text-primary">VOIR DOCUMENT RÉEL</span>
             <span className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Plein Écran HD</span>
          </div>
        </div>

        {/* Status indicator */}
        <div className={cn(
           "absolute top-10 right-10 w-2.5 h-2.5 rounded-full z-10",
           quote.status === 'accepted' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]',
           "animate-pulse"
        )} />
      </Card>

      {/* 📊 CONTEXTUAL METRICS */}
      <div className="grid grid-cols-2 gap-4">
         <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-xl hover:-translate-y-1">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Client</span>
            <span className="text-xs font-black text-primary truncate uppercase tracking-tight">{client?.name || 'N/A'}</span>
         </div>
         <div className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-xl hover:-translate-y-1">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Échéance</span>
            <span className="text-xs font-black text-primary uppercase tracking-tight">
              {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'J-30'}
            </span>
         </div>
      </div>
    </div>
  )
}
