import React from 'react'
import { Rocket, Crown, ArrowRight, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface LimitBannerProps {
  type: 'clients' | 'devis' | 'factures'
  count: number
  limit?: number
}

export function LimitBanner({ type, count, limit = 3 }: LimitBannerProps) {
  const labels = {
    clients: 'clients',
    devis: 'devis',
    factures: 'factures'
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-8 rounded-3xl shadow-sm relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl group-hover:bg-amber-300/30 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <Rocket size={32} />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-black text-amber-900 uppercase tracking-tighter mb-1">
            Limite atteinte : {count} / {limit} {labels[type]}
          </h3>
          <p className="text-sm font-bold text-amber-800/70 uppercase tracking-widest leading-relaxed">
             Vous avez atteint le maximum de {limit} {labels[type]} autorisés pour le plan gratuit.
          </p>
        </div>

        <Link 
          href="/dashboard/profile" 
          className="bg-amber-600 hover:bg-amber-700 text-white px-8 h-14 rounded-2xl flex items-center gap-3 shadow-xl shadow-amber-600/20 active:scale-95 transition-all group/btn shrink-0"
        >
          <span className="font-black uppercase tracking-widest text-xs">Passer en PRO</span>
          <Crown size={16} className="text-amber-200 group-hover/btn:rotate-12 transition-transform" />
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-center md:justify-start gap-2 text-[10px] font-black text-amber-800/40 uppercase tracking-[0.2em]">
        <ShieldAlert size={12} />
        <span>Débloquez l'illimité et boostez votre activité d'artisan</span>
      </div>
    </div>
  )
}
