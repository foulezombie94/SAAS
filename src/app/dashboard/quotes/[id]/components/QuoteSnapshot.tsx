'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Quote } from '@/types/dashboard'
import { Eye, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuotePreview } from './QuotePreview'

interface QuoteSnapshotProps {
  quote: Quote
  onOpenPreview: () => void
}

export function QuoteSnapshot({ quote, onOpenPreview }: QuoteSnapshotProps) {
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
        className="relative aspect-[3/4.2] bg-slate-200/50 border border-slate-200/50 shadow-diffused rounded-[2.5rem] overflow-hidden cursor-pointer group transition-all duration-700 hover:shadow-3xl hover:border-primary/20"
      >
        {/* 📄 THE PIXEL-PERFECT MINIATURE (Scaled Live Version) */}
        <div className="absolute inset-4 overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-700 group-hover:scale-[1.03] group-hover:-rotate-1">
          {/* 
              Scaling Wrapper: We render the REAL QuotePreview at full size 
              but scale it down to fit the container. 
              Approx width of A4 in px is ~800px. Container is ~300px. Scale ~0.37.
          */}
          <div className="absolute top-0 left-0 w-[800px] origin-top-left pointer-events-none select-none scale-[0.38] md:scale-[0.35] lg:scale-[0.32]">
             <QuotePreview quote={quote} />
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

        {/* Status indicator pill */}
        <div className={cn(
           "absolute top-10 right-10 px-3 py-1 rounded-full z-10 text-[8px] font-black uppercase tracking-widest shadow-xl border-l-2",
           quote.status === 'accepted' ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-orange-500 text-white border-orange-300',
        )}>
          {quote.status === 'accepted' ? 'Accepté' : 'En attente'}
        </div>
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
      
      <style jsx>{`
        .ease-out-back {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}
