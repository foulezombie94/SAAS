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
        className="relative aspect-[3/4.2] bg-white border border-slate-200 shadow-diffused rounded-[2.5rem] overflow-hidden cursor-pointer group transition-all duration-700 hover:shadow-3xl hover:border-primary/20"
      >
        {/* 📄 THE PIXEL-PERFECT MINIATURE (VRAI DEVIS) */}
        <div className="absolute inset-0 overflow-hidden transition-all duration-700 group-hover:scale-[1.05]">
          {/* 
              Full Space Filling Technique:
              - Render the real component with a fixed width 
              - Scale it precisely to match the card width (no inset/padding)
          */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] origin-top pointer-events-none select-none scale-[0.42] md:scale-[0.45] lg:scale-[0.48]">
             <QuotePreview quote={quote} />
          </div>
        </div>

        {/* 👁️ PREMIUM OVERLAY */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 backdrop-blur-[0px] group-hover:backdrop-blur-[2px] transition-all duration-700 flex flex-col items-center justify-center gap-4 z-20">
          <div className="w-16 h-16 rounded-[2rem] bg-white shadow-3xl flex items-center justify-center text-primary scale-0 group-hover:scale-100 transition-all duration-700 ease-out-back transform rotate-12 group-hover:rotate-0">
            <Eye size={28} strokeWidth={2.5} />
          </div>
        </div>

        {/* Pulse Status Indicator */}
        <div className={cn(
           "absolute top-6 right-6 w-3 h-3 rounded-full z-30 ring-4 ring-white shadow-xl",
           quote.status === 'accepted' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500 animate-pulse',
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
      
      <style jsx>{`
        .ease-out-back {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  )
}
