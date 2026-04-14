import React from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Send,
  Link as LinkIcon,
  FileText,
  Download,
  Info,
  Calendar,
  Wallet,
  Loader2,
  PenTool,
  Table as TableIcon,
  Timer
} from 'lucide-react'
import { Quote } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface QuoteActionsPanelProps {
  quote: Quote
  isGeneratingInvoice: boolean
  isSigPadOpen: boolean
  setIsSigPadOpen: (open: boolean) => void
  onSaveSignature: (data: string) => void
  onCopyShareLink: () => void
  onCreateInvoice: () => void
  onOpenEmailModal: () => void
  onDownloadPdf?: () => void
  onDownloadExcel?: () => void
  isGeneratingPdf?: boolean
  isGeneratingExcel?: boolean
  isGeneratingLink?: boolean
}

export function QuoteActionsPanel({
  quote,
  isGeneratingInvoice,
  isSigPadOpen,
  setIsSigPadOpen,
  onCopyShareLink,
  onCreateInvoice,
  onOpenEmailModal,
  onDownloadPdf,
  onDownloadExcel,
  isGeneratingPdf,
  isGeneratingExcel,
  isGeneratingLink
}: QuoteActionsPanelProps) {
  
  const isPaid = quote.status === 'paid'
  const isAccepted = ['accepted', 'paid', 'invoiced'].includes(quote.status)
  
  // Format Date safely
  const createdDate = new Date(quote.created_at || new Date()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  // Pending Status Banner check
  const isPending = ['draft', 'sent'].includes(quote.status) || (quote.status === 'accepted' && !quote.artisan_signature_url && !quote.client_signature_url)

  return (
    <div className="space-y-6 sticky top-8">
      
      {/* COMMAND CENTER */}
      <div className="bg-[#eeedf4] p-6 rounded-xl space-y-4 shadow-md">
        <h3 className="text-[0.6875rem] font-bold tracking-[0.1em] text-slate-500 uppercase mb-4">Command Center</h3>
        
        {/* Espace Signature Artisan (Always on top if missing) */}
        {!quote.artisan_signature_url && quote.status !== 'paid' && (
          <div className="pb-4 border-b border-[#c5c5d3]/30">
            <button 
              onClick={() => setIsSigPadOpen(true)}
              className={cn(
                "w-full p-4 rounded font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all scale-100 active:scale-95 shadow-lg",
                isSigPadOpen 
                  ? "bg-slate-200 text-slate-500 hover:bg-slate-200 shadow-none border-none" 
                  : "bg-[#00236f] text-white border-none"
              )}
              disabled={isSigPadOpen}
            >
              <PenTool className="w-5 h-5 fill-current" />
              {isSigPadOpen ? 'OUVERTURE...' : 'SIGNER (ARTISAN)'}
            </button>
          </div>
        )}

        <button 
          onClick={onOpenEmailModal}
          className="w-full bg-[#ef9900] text-[#2a1700] hover:text-[#2a1700] p-3.5 h-auto rounded font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all scale-100 active:scale-95 shadow-lg border-none text-[13px] tracking-tight uppercase"
        >
          <Send className="w-4 h-4 fill-current" strokeWidth={2.5} />
          ENVOYER AU CLIENT
        </button>

        <button 
          onClick={onCopyShareLink}
          disabled={isGeneratingLink}
          className="w-full bg-white text-[#00236f] hover:text-[#00236f] border border-[#00236f]/20 p-3.5 h-auto rounded font-bold flex items-center justify-center gap-3 hover:bg-[#faf8ff] transition-all scale-100 active:scale-95 disabled:opacity-50 text-[13px] tracking-tight uppercase"
        >
          {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" strokeWidth={2.5} />}
          GÉNÉRER LE LIEN
        </button>

        <button 
          onClick={onCreateInvoice}
          disabled={isGeneratingInvoice || !isAccepted}
          className="w-full bg-[#00236f] text-white hover:text-white p-3.5 h-auto rounded font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all scale-100 active:scale-95 border-none disabled:opacity-50 text-[13px] tracking-tight uppercase"
        >
          {isGeneratingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 fill-current" />}
          <span className="text-center">CONVERTIR EN FACTURE</span>
        </button>

        {/* Action icons bar */}
        <div className="pt-4 mt-4 border-t border-[#c5c5d3]/30 flex justify-between gap-3">
          <button 
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 flex justify-center items-center bg-white p-2.5 h-[2.75rem] rounded-lg text-[#00236f] hover:bg-slate-50 transition-all shadow-sm border border-slate-200 disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" strokeWidth={2.5} />}
          </button>
          
          <button 
            onClick={onDownloadExcel}
            disabled={isGeneratingExcel}
            className="flex-1 flex justify-center items-center bg-white p-2.5 h-[2.75rem] rounded-lg text-[#00236f] hover:bg-slate-50 transition-all shadow-sm border border-slate-200 disabled:opacity-50"
          >
            {isGeneratingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <TableIcon className="w-4 h-4" strokeWidth={2.5} />}
          </button>

        </div>
      </div>

      {/* STATUS BANNER */}
      {isPending && (
        <div className="bg-[#5c3800]/10 text-[#ef9900] h-14 rounded-xl flex items-center px-6 gap-4 border border-[#ef9900]/20">
          <Info className="w-5 h-5 fill-[#ef9900] text-white" strokeWidth={2.5} />
          <span className="font-bold text-sm tracking-wide uppercase">EN ATTENTE DU CLIENT</span>
        </div>
      )}

      {/* PROJECT OVERVIEW */}
      <div className="bg-[#f3f4f8] p-5 rounded-md mt-2">
        <h3 className="text-[10px] font-black uppercase text-[#818c9f] tracking-widest mb-5">PROJECT OVERVIEW</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white rounded-sm shadow-sm flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#072161]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-[#a5aec1] tracking-wider">ESTIMATED START</span>
              <span className="font-black text-[#1a2130] text-[13px]">{createdDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white rounded-sm shadow-sm flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5 text-[#072161] fill-[#072161]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-[#a5aec1] tracking-wider">PROJECT DURATION</span>
              <span className="font-black text-[#1a2130] text-[13px]">14 Working Days</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white rounded-sm shadow-sm flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#072161] fill-[#072161]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-[#a5aec1] tracking-wider">TAXABLE REGION</span>
              <span className="font-black text-[#1a2130] text-[13px]">UK Standard (20%)</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
