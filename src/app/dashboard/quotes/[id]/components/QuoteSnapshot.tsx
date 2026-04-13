'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Quote } from '@/types/dashboard'
import { Eye, FileText, User, Calendar, ArrowUpRight } from 'lucide-react'
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
        className="relative aspect-[3/4] bg-white border-2 border-slate-100 shadow-diffused rounded-[2rem] overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:border-primary/20 hover:shadow-2xl"
      >
        {/* DOCUMENT CONTENT (MINIATURE) */}
        <div className="absolute inset-0 p-6 flex flex-col gap-4 select-none pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
          {/* Mini Header */}
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-[10px]">
              {profile?.company_name?.[0] || 'A'}
            </div>
            <div className="w-20 h-2 bg-slate-100 rounded-full" />
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="w-full h-4 bg-slate-50 rounded-lg" />
            <div className="w-2/3 h-4 bg-slate-50 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="h-16 bg-slate-50 rounded-xl" />
            <div className="h-16 bg-slate-50 rounded-xl" />
          </div>

          <div className="space-y-1.5 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between">
                <div className="w-1/2 h-2 bg-slate-50 rounded-full" />
                <div className="w-1/4 h-2 bg-slate-50 rounded-full" />
              </div>
            ))}
          </div>

          <div className="mt-auto flex justify-end">
             <div className="w-1/3 h-6 bg-primary/5 rounded-lg" />
          </div>
        </div>

        {/* OVERLAY ON HOVER */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 backdrop-blur-[0px] group-hover:backdrop-blur-[2px] transition-all duration-500 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-primary scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
            <Eye size={24} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-200">
            Aperçu
          </span>
        </div>

        {/* TOP STATUS INDICATOR */}
        <div className={cn(
           "absolute top-6 right-6 w-2 h-2 rounded-full animate-pulse",
           quote.status === 'accepted' ? 'bg-emerald-500' : 'bg-orange-500'
        )} />
      </Card>

      {/* QUICK STATS BELOW PREVIEW */}
      <div className="grid grid-cols-2 gap-3">
         <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Client</span>
            <span className="text-[10px] font-bold text-primary truncate uppercase">{client?.name || 'N/A'}</span>
         </div>
         <div className="p-4 bg-white rounded-2xl border border-slate-50 shadow-sm flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Expiration</span>
            <span className="text-[10px] font-bold text-primary uppercase">
              {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'J-30'}
            </span>
         </div>
      </div>
    </div>
  )
}
