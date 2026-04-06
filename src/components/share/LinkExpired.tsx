'use client'

import React from 'react'
import { Clock, ShieldAlert, ArrowLeft, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

export function LinkExpired() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-orange-100/50 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-tl from-slate-200/50 to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-xl w-full">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[48px] p-10 md:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white/50 text-center">
          
          {/* Animated Icon Container */}
          <div className="relative w-28 h-28 mx-auto mb-10">
            <div className="absolute inset-0 bg-orange-100 rounded-[32px] rotate-6 animate-pulse" />
            <div className="absolute inset-0 bg-white rounded-[32px] shadow-sm flex items-center justify-center border border-orange-50/50">
              <Clock className="text-orange-500 w-12 h-12" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#002878] rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
          </div>

          {/* Typography */}
          <h1 className="text-4xl md:text-5xl font-black text-[#002878] tracking-tight leading-[1.1] mb-6">
            Lien de Partage <br/>
            <span className="text-orange-500 uppercase italic text-2xl md:text-3xl tracking-[0.2em] block mt-2">Expiré</span>
          </h1>

          <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed max-w-sm mx-auto">
            Pour garantir la sécurité de vos devis, les liens ArtisanFlow expirent après <span className="text-[#002878] font-bold underline decoration-orange-200 underline-offset-4">1 minute</span>.
          </p>

          {/* Action Area */}
          <div className="space-y-4">
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Comment procéder ?</p>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <Mail className="text-[#002878] w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  Veuillez contacter l'artisan directement pour demander un nouveau lien sécurisé.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-4">
              <Link 
                href="/" 
                className="flex-1 bg-[#002878] text-white font-black py-5 px-8 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,40,120,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                RETOUR À L'ACCUEIL
              </Link>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-slate-100" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">ArstianFlow Security Grade 3</p>
            <div className="h-px w-8 bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  )
}
