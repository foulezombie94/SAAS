'use client'

import React, { useEffect } from 'react'
import { X, Download, Printer, Share2 } from 'lucide-react'
import { QuotePreview } from './QuotePreview'
import { Quote } from '@/types/dashboard'
import { Button } from '@/components/ui/Button'

interface FullPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  quote: Quote
  onDownloadPdf?: () => void
}

export function FullPreviewModal({ isOpen, onClose, quote, onDownloadPdf }: FullPreviewModalProps) {
  
  // ⌨️ Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* 🌫️ BACKDROP */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* 📄 MODAL CONTENT */}
      <div className="relative w-full max-w-5xl max-h-screen flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* 🛠️ TOP ACTIONS BAR */}
        <div className="flex items-center justify-between gap-4 mb-4 px-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur text-white flex items-center justify-center">
                <FileText size={20} />
             </div>
             <div>
                <h2 className="text-white font-black tracking-tight leading-none uppercase text-lg">Aperçu Complet</h2>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Devis #{quote.number}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
              title="Imprimer"
            >
              <Printer size={18} />
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white hover:bg-white/90 text-primary flex items-center justify-center shadow-xl transition-all hover:rotate-90"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* 📑 SCROLLABLE DOCUMENT VIEW */}
        <div className="flex-1 overflow-y-auto rounded-[2.5rem] bg-slate-100/50 p-4 md:p-8 no-scrollbar scroll-smooth shadow-2xl">
          <div className="mx-auto max-w-[210mm] shadow-2xl origin-top transition-transform">
             <QuotePreview quote={quote} />
          </div>
        </div>

        {/* 📥 BOTTOM STICKY ACTIONS */}
        <div className="mt-4 flex justify-center pb-4 lg:hidden">
           <Button 
            className="rounded-full px-8 py-6 font-black uppercase tracking-widest text-xs btn-primary shadow-2xl"
            onClick={onDownloadPdf}
           >
             <Download className="mr-2" size={16} /> Télecharger le PDF
           </Button>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

import { FileText } from 'lucide-react'
