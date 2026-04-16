"use client"

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Quote {
  id: string
  number: string
  created_at: string | null
  status: string | null
  total_ttc: string | number
}

interface ProjectHistoryListProps {
  quotes: Quote[]
}

export function ProjectHistoryList({ quotes }: ProjectHistoryListProps) {
  const [showAll, setShowAll] = useState(false)
  
  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-50/50 border-2 border-dashed border-slate-100 text-center rounded-2xl">
        <span className="material-symbols-outlined text-slate-200 mb-4 scale-[2]">folder_open</span>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">
          Aucune archive pour ce client. Commencez par créer un devis.
        </p>
      </div>
    )
  }

  const displayedQuotes = showAll ? quotes : quotes.slice(0, 5)
  const remainingCount = quotes.length - 5

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {displayedQuotes.map((quote) => (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Link href={`/dashboard/quotes/${quote.id}`}>
              <div className="flex items-center justify-between p-5 bg-surface-container-low hover:bg-surface-container-high transition-all rounded-xl group cursor-pointer border border-transparent hover:border-primary/10 hover:shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white text-primary flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div>
                    <div className="font-black text-primary font-body group-hover:text-primary transition-colors text-lg italic tracking-tighter uppercase">{quote.number}</div>
                    <div className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                      {quote.created_at ? new Date(quote.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    quote.status === 'accepted' || quote.status === 'paid' || quote.status === 'invoiced'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : quote.status === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {quote.status === 'accepted' ? 'Accepté' : 
                     quote.status === 'paid' ? 'Payé' :
                     quote.status === 'invoiced' ? 'Facturé' :
                     quote.status === 'sent' ? 'Envoyé' : 
                     quote.status === 'draft' ? 'Brouillon' : quote.status}
                  </span>
                  
                  <div className="font-headline font-black text-primary w-28 text-right text-xl tracking-tighter italic">
                    {Number(quote.total_ttc).toLocaleString('fr-FR')} €
                  </div>
                  
                  <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>

      {!showAll && remainingCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-4 mt-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-slate-50 hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
        >
          Voir tout l'historique (+{remainingCount} dossiers)
          <span className="material-symbols-outlined text-lg group-hover:translate-y-0.5 transition-transform">keyboard_double_arrow_down</span>
        </button>
      )}

      {showAll && quotes.length > 5 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-4 mt-2 bg-white/50 border border-dashed border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center gap-3 group"
        >
          Réduire l'affichage
          <span className="material-symbols-outlined text-lg group-hover:-translate-y-0.5 transition-transform rotate-180">keyboard_double_arrow_down</span>
        </button>
      )}
    </div>
  )
}
