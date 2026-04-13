import React from 'react'
import { Quote } from '@/types/dashboard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuoteHeaderProps {
  quote: Quote
  isTokenExpired: boolean | null
}

export function QuoteHeader({
  quote,
  isTokenExpired
}: QuoteHeaderProps) {
  
  const getStatusConfig = (status: string, hasBeenViewed: boolean) => {
    // Priority: If the client has viewed it, show 'Consulté' instead of 'Envoyé'
    if (status === 'sent' && hasBeenViewed) {
      return { label: 'Consulté', class: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
    }

    switch (status) {
      case 'draft': return { label: 'Brouillon', class: 'bg-slate-100 text-slate-700 border-slate-200' }
      case 'sent': return { label: 'Envoyé', class: 'bg-blue-100 text-blue-700 border-blue-200' }
      case 'accepted': return { label: 'Validé', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      case 'rejected': return { label: 'Refusé', class: 'bg-rose-100 text-rose-700 border-rose-200' }
      case 'paid': return { label: 'Payé', class: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
      case 'expired': return { label: 'Expiré', class: 'bg-amber-100 text-amber-700 border-amber-200' }
      default: return { label: status, class: 'bg-slate-100 text-slate-700' }
    }
  }

  const statusConfig = getStatusConfig(quote.status, !!quote.last_viewed_at)

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex flex-col gap-2">
        <Link 
          href="/dashboard/quotes" 
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors group mb-1"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour aux devis
        </Link>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1.5 flex items-center gap-2">
              Devis {quote.number}
            </h1>
            <div className="flex items-center gap-2">
              <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", statusConfig.class)}>
                {statusConfig.label}
              </div>
              {isTokenExpired && (
                <div className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-sm">
                  Lien public expiré
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
