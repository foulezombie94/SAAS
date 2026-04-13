import React from 'react'
import { Button } from '@/components/ui/Button'
import { 
  Send,
  Link as LinkIcon,
  FileText,
  Download,
  Trash2,
  Info,
  Calendar,
  Wallet,
  Zap,
  Loader2,
  PenTool,
  Table as TableIcon,
  Clock,
  BookMarked
} from 'lucide-react'
import { Quote } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface QuoteActionsPanelProps {
  quote: Quote
  isPaying: boolean
  isGeneratingInvoice: boolean
  isSigning: boolean
  isSigPadOpen: boolean
  setIsSigPadOpen: (open: boolean) => void
  onSaveSignature: (data: string) => void
  onCreatePayment: () => void
  onCreateInvoice: () => void
  onOpenEmailModal: () => void
  onDownloadPdf?: () => void
  onDownloadExcel?: () => void
  isGeneratingPdf?: boolean
  isGeneratingExcel?: boolean
}

export function QuoteActionsPanel({
  quote,
  isPaying,
  isGeneratingInvoice,
  isSigPadOpen,
  setIsSigPadOpen,
  onCreatePayment,
  onCreateInvoice,
  onOpenEmailModal,
  onDownloadPdf,
  onDownloadExcel,
  isGeneratingPdf,
  isGeneratingExcel
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
    <div className="space-y-4 sticky top-8">
      
      {/* COMMAND CENTER */}
      <div className="bg-[#f2f4f7] p-5 rounded-lg space-y-4">
        <h3 className="text-[11px] font-black uppercase text-[#7b8a9d] tracking-widest mb-2">Command Center</h3>
        
        {/* Espace Signature Artisan (Always on top if missing) */}
        {!quote.artisan_signature_url && quote.status !== 'paid' && (
          <div className="space-y-3 pb-3 mb-3 border-b border-slate-200/60">
            <Button 
              onClick={() => setIsSigPadOpen(true)}
              className={cn(
                "w-full h-12 rounded font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-sm",
                isSigPadOpen 
                  ? "bg-slate-200 text-slate-500 hover:bg-slate-200" 
                  : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white border-none"
              )}
              disabled={isSigPadOpen}
            >
              <PenTool className="w-5 h-5" />
              {isSigPadOpen ? 'OUVERTURE SIGNATURE...' : 'SIGNER (ARTISAN)'}
            </Button>
          </div>
        )}

        <Button 
          onClick={onOpenEmailModal}
          className="w-full h-[3.25rem] bg-[#eea400] hover:bg-[#d89400] text-[#111] border-none shadow-sm rounded-md font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <Send className="w-[1.125rem] h-[1.125rem] fill-[#111]" strokeWidth={2.5} />
          SEND TO CLIENT
        </Button>

        <Button 
          onClick={onCreatePayment}
          disabled={isPaying || isPaid}
          className="w-full h-[3.25rem] bg-white hover:bg-slate-50 text-[#001e5c] border border-slate-200 shadow-sm rounded-md font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          {isPaying ? <Loader2 className="w-[1.125rem] h-[1.125rem] animate-spin" /> : <LinkIcon className="w-[1.125rem] h-[1.125rem]" strokeWidth={2.5} />}
          PAYMENT LINK
        </Button>

        <Button 
          onClick={onCreateInvoice}
          disabled={isGeneratingInvoice || !isAccepted}
          className="w-full h-[3.25rem] bg-[#002266] hover:bg-[#001a4d] text-white shadow-sm border-none rounded-md font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          {isGeneratingInvoice ? <Loader2 className="w-[1.125rem] h-[1.125rem] animate-spin" /> : <FileText className="w-[1.125rem] h-[1.125rem] fill-white" />}
          CONVERT TO INVOICE
        </Button>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/70 mt-3">
          <Button 
            variant="ghost" 
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-12 bg-[#e9ebef] hover:bg-[#dde0e5] rounded-md text-[#001e5c] transition-colors"
          >
            {isGeneratingPdf ? <Loader2 className="w-[1.125rem] h-[1.125rem] animate-spin" /> : <Download className="w-[1.125rem] h-[1.125rem]" strokeWidth={2.5} />}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onDownloadExcel}
            disabled={isGeneratingExcel}
            className="h-12 bg-[#e9ebef] hover:bg-[#dde0e5] rounded-md text-[#001e5c] transition-colors"
          >
            {isGeneratingExcel ? <Loader2 className="w-[1.125rem] h-[1.125rem] animate-spin" /> : <TableIcon className="w-[1.125rem] h-[1.125rem]" strokeWidth={2.5} />}
          </Button>

          <Button 
            variant="ghost" 
            className="h-12 bg-[#e9ebef] hover:bg-red-100 rounded-md text-[#cc0000] hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-[1.125rem] h-[1.125rem]" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      {/* PENDING CLIENT APPROVAL BANNER (if applicable) */}
      {isPending && (
        <div className="bg-[#523600] text-[#ffac1c] rounded-md px-5 py-4 flex items-center justify-start gap-4 shadow-md">
          <Info className="w-6 h-6 fill-[#ffac1c] text-[#523600] shrink-0" />
          <span className="font-extrabold text-[12px] tracking-widest uppercase leading-tight">
            PENDING CLIENT<br/>APPROVAL
          </span>
        </div>
      )}

      {/* PROJECT OVERVIEW */}
      <div className="bg-[#f0f2f5] p-5 rounded-lg shadow-sm">
        <h3 className="text-[10px] font-black uppercase text-[#8896aa] tracking-[0.15em] mb-5">Project Overview</h3>
        
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-md shadow-sm flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#002f87]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-[#8896aa] tracking-[0.1em]">Estimated Start</span>
              <span className="font-extrabold text-[#111] text-[14px]">{createdDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-md shadow-sm flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#002f87]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-[#8896aa] tracking-[0.1em]">Project Duration</span>
              <span className="font-extrabold text-[#111] text-[14px]">14 Working Days</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-md shadow-sm flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5 text-[#002f87]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-[#8896aa] tracking-[0.1em]">Taxable Region</span>
              <span className="font-extrabold text-[#111] text-[14px]">UK Standard (20%)</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
