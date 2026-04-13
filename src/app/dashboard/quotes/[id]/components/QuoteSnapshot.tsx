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
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aperçu du Document</h3>
        <button 
          onClick={onOpenPreview}
          className="text-primary hover:text-primary-container transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest group"
        >
          Plein écran <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      <Card 
        onClick={onOpenPreview}
        className="relative aspect-[3/4] bg-white border-2 border-slate-100 shadow-diffused rounded-[2.5rem] overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:border-primary/20 hover:shadow-2xl"
      >
        {/* 📄 HIGH-FIDELITY MINIATURE PREVIEW */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-primary opacity-80" />
        
        <div className="absolute inset-0 p-6 flex flex-col select-none pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-[0.9] origin-center">
          {/* Mini Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 bg-primary rounded shadow-sm flex items-center justify-center">
                  <Landmark className="text-white" size={10} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[7px] font-black text-primary uppercase italic">ArtisanFlow</span>
                 <span className="text-[4px] font-bold text-slate-300 uppercase tracking-widest">Professional Systems</span>
               </div>
            </div>
            <div className="text-right">
               <div className="w-12 h-1 bg-slate-900/10 rounded-full mb-1" />
               <div className="w-8 h-1 bg-slate-400/10 rounded-full ml-auto" />
            </div>
          </div>

          {/* Mini Title */}
          <div className="mb-4 border-b border-primary/20 pb-2">
             <div className="w-20 h-3 bg-primary/5 rounded mb-1" />
             <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>

          {/* Mini Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="w-full h-2 bg-slate-900/10 rounded-full mb-1.5" />
                <div className="w-2/3 h-1 bg-slate-300/20 rounded-full" />
             </div>
             <div className="space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between"><div className="w-6 h-1 bg-slate-200 rounded-full" /><div className="w-8 h-1 bg-slate-400 rounded-full" /></div>
                <div className="flex justify-between"><div className="w-6 h-1 bg-slate-200 rounded-full" /><div className="w-8 h-1 bg-slate-400 rounded-full" /></div>
             </div>
          </div>

          {/* Mini Table Representation */}
          <div className="flex-1">
             <div className="w-full h-2.5 bg-primary/10 rounded-t-lg mb-1" />
             <div className="space-y-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between border-b border-slate-50 pb-1">
                    <div className="w-1/2 h-1.5 bg-slate-100 rounded-full" />
                    <div className="w-6 h-1.5 bg-slate-900/10 rounded-full" />
                  </div>
                ))}
             </div>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
             <div className="w-16 h-4 bg-primary/10 rounded shadow-sm" />
          </div>

          {/* Mini Signatures */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-100 flex justify-between gap-4">
             <div className="flex-1 h-8 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
               <Check className="text-primary/20" size={10} />
             </div>
             <div className="flex-1 h-8 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
               <PenLine className="text-slate-200" size={10} />
             </div>
          </div>
        </div>

        {/* 👁️ HOVER OVERLAY (Premium Blur) */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 backdrop-blur-[0px] group-hover:backdrop-blur-[2.5px] transition-all duration-700 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-primary scale-0 group-hover:scale-100 transition-all duration-500 ease-out-back transform rotate-12 group-hover:rotate-0">
            <Eye size={24} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 delay-100">
            DÉTAILS
          </span>
        </div>

        {/* TOP STATUS PULSE */}
        <div className={cn(
           "absolute top-8 right-8 w-1.5 h-1.5 rounded-full",
           quote.status === 'accepted' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]',
           "animate-pulse"
        )} />
      </Card>

      {/* QUICK STATS BELOW PREVIEW */}
      <div className="grid grid-cols-2 gap-3">
         <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md hover:border-slate-200">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Client</span>
            <span className="text-[10px] font-black text-primary truncate uppercase tracking-tight">{client?.name || 'N/A'}</span>
         </div>
         <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md hover:border-slate-200">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Échéance</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-tight">
              {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'J-30'}
            </span>
         </div>
      </div>
    </div>
  )
}
