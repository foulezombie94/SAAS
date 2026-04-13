'use client'

import React from 'react'
import { Quote } from '@/types/dashboard'
import { cn } from '@/lib/utils'

// 🏗️ Sub-components
import { QuoteHeader } from './components/QuoteHeader'
import { QuoteTimeline } from './components/QuoteTimeline'
import { QuotePreview } from './components/QuotePreview'
import { QuoteActionsPanel } from './components/QuoteActionsPanel'
import { EmailModal } from './components/EmailModal'
import { PdfTemplate } from './components/PdfTemplate'
import { SignaturePad } from '@/components/SignaturePad'

// 🎣 Specialized Hooks
import { useQuoteRealtime } from './hooks/useQuoteRealtime'
import { useQuoteActions } from './hooks/useQuoteActions'

interface QuoteClientProps {
  quote: Quote
}

export function QuoteClient({ quote }: QuoteClientProps) {
  
  // 1. Manage State & Realtime
  const { currentQuote, setCurrentQuote } = useQuoteRealtime(quote)

  // 2. Manage Business Actions & Handlers
  const { loading, modals, handlers } = useQuoteActions({ 
    quote: currentQuote, 
    setCurrentQuote
  })

  // 🛡️ SECURITY GRADE 3 : Technical vs Commercial expiration
  const isTokenExpired = currentQuote.public_token_expires_at 
    ? new Date(currentQuote.public_token_expires_at) < new Date() 
    : null

  // Handler for direct signing from preview
  const handleScrollToSign = () => {
    modals.setIsSigPadOpen(true)
    const element = document.getElementById('command-center')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <>
      <div className={cn(
        "min-h-screen bg-slate-50/50 pb-20 transition-all duration-700",
        modals.isSigPadOpen && "blur-sm grayscale-[0.2] opacity-50 scale-[0.98] pointer-events-none"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* HEADER SECTION */}
          <QuoteHeader 
            quote={currentQuote}
            isTokenExpired={isTokenExpired}
          />

          {/* TIMELINE SECTION */}
          <QuoteTimeline 
            status={currentQuote.status} 
            lastViewedAt={currentQuote.last_viewed_at} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* MAIN DOCUMENT PREVIEW (Left) */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <QuotePreview 
                quote={currentQuote} 
                onSignArtisan={handleScrollToSign}
              />
            </div>

            {/* COMMAND CENTER (Right) */}
            <div className="order-1 lg:order-2">
              <QuoteActionsPanel 
                quote={currentQuote}
                isGeneratingInvoice={loading.isGeneratingInvoice}
                isSigPadOpen={modals.isSigPadOpen}
                setIsSigPadOpen={modals.setIsSigPadOpen}
                onSaveSignature={handlers.handleSaveSignature}
                onCopyShareLink={handlers.handleCopyShareLink}
                onCreateInvoice={handlers.handleCreateInvoice}
                onOpenEmailModal={() => modals.setIsEmailModalOpen(true)}
                onDownloadPdf={handlers.handleDownloadPdf}
                onDownloadExcel={handlers.handleDownloadExcel}
                isGeneratingPdf={loading.isGeneratingPdf}
                isGeneratingExcel={loading.isGeneratingExcel}
                isGeneratingLink={loading.isGeneratingLink}
              />
            </div>
          </div>
        </div>

        {/* MODALS & PORTALS */}
        <EmailModal 
          isOpen={modals.isEmailModalOpen}
          onClose={() => modals.setIsEmailModalOpen(false)}
          quote={currentQuote}
        />

        {/* HIDDEN PDF TEMPLATE */}
        <div className="fixed -left-[9999px] top-0">
          <PdfTemplate 
            quote={currentQuote} 
          />
        </div>

        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            #pdf-template { 
              position: static !important; 
              left: 0 !important;
              width: 100% !important;
              padding: 0 !important;
            }
          }
        `}</style>
      </div>

      {/* PORTALS (Always Sharp) */}
      {modals.isSigPadOpen && (
        <SignaturePad 
          onSave={handlers.handleSaveSignature} 
          onCancel={() => modals.setIsSigPadOpen(false)} 
          isLoading={loading.isSigning} 
        />
      )}
    </>
  )
}
