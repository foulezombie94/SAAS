'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Landmark, FileText } from 'lucide-react'
import { QuotePreview } from './QuotePreview'
import { Quote } from '@/types/dashboard'
import { Button } from '@/components/ui/Button'
import { PdfIcon } from '@/components/icons/PdfIcon'

interface FullPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  quote: Quote
  onDownloadPdf?: () => void
}

export function FullPreviewModal({ isOpen, onClose, quote, onDownloadPdf }: FullPreviewModalProps) {
  
  // ⌨️ Close on Escape & 🔒 Body Scroll Lock
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    // Lock scroll
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    window.addEventListener('keydown', handleEsc)
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = originalStyle
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 lg:p-12">
      {/* 🌫️ PREMIUM BACKDROP (Dark Glassmorphism) */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity duration-700 animate-in fade-in fill-mode-both"
        onClick={onClose}
      />

      {/* 📄 MODAL / PAGE CONTAINER */}
      <div className="relative w-full max-w-6xl max-h-full flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-700 ease-out-quint fill-mode-both">
        
        {/* 🛠️ TOP COMMAND CENTER (Glassmorphism) */}
        <div className="flex items-center justify-between gap-4 mb-6 px-4 py-3 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Landmark size={24} />
             </div>
             <div>
                <h2 className="text-white font-black tracking-tight leading-none uppercase text-xl">Aperçu Professionnel</h2>
                <div className="flex items-center gap-2 mt-1.5">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em]">Document HD : Devis #{quote.number}</p>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onDownloadPdf}
              className="hidden md:flex h-11 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white items-center gap-2 transition-all border border-white/5 hover:border-white/10 font-bold text-xs uppercase tracking-widest"
            >
              <PdfIcon size={16} /> PDF
            </button>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white hover:bg-white/90 text-primary flex items-center justify-center shadow-2xl transition-all hover:rotate-90 group"
            >
              <X size={24} strokeWidth={3} className="transition-transform group-active:scale-90" />
            </button>
          </div>
        </div>

        {/* 📑 SCROLLABLE DOCUMENT CANVAS */}
        <div className="flex-1 overflow-y-auto rounded-[3rem] bg-slate-100/40 p-6 md:p-10 lg:p-16 no-scrollbar scroll-smooth shadow-[0_0_100px_rgba(0,35,111,0.2)] border border-white/10 ring-1 ring-white/5">
          <div className="mx-auto max-w-[210mm] shadow-[0_40px_80px_rgba(0,0,0,0.15)] origin-top transition-transform hover:scale-[1.002]">
             <QuotePreview quote={quote} />
          </div>
          
          {/* Subtle footer breadcrumb inside the scroll area */}
          <div className="max-w-[210mm] mx-auto mt-12 flex justify-center opacity-30">
             <span className="text-[10px] font-black uppercase text-white tracking-[0.5em]">Fin du document HD</span>
          </div>
        </div>

        {/* 📥 BOTTOM ACTIONS (Mobile Floating) */}
        <div className="mt-6 flex justify-center pb-4 lg:hidden">
           <Button 
            className="rounded-full px-10 py-7 font-black uppercase tracking-widest text-xs btn-primary shadow-3xl hover:scale-105 active:scale-95 transition-transform"
            onClick={onDownloadPdf}
           >
             <PdfIcon className="mr-3" size={18} /> Télécharger le PDF
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
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in-from-bottom-8 {
          from { transform: translateY(2rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ease-out-quint {
          transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
        }
      `}</style>
    </div>
  )

  // Use portal to attach to body
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
