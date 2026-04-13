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
  Loader2,
  PenTool,
  Table as TableIcon,
  Timer
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
    <div className="space-y-4 sticky top-8 flex flex-col gap-2">
      
      {/* COMMAND CENTER */}
      <div className="bg-[#f3f4f8] p-5 rounded-md">
        <h3 className="text-[10px] font-black uppercase text-[#818c9f] tracking-widest mb-4">COMMAND CENTER</h3>
        
        {/* Espace Signature Artisan (Always on top if missing) */}
        {!quote.artisan_signature_url && quote.status !== 'paid' && (
          <div className="pb-4 mb-4 border-b border-gray-200">
            <Button 
              onClick={() => setIsSigPadOpen(true)}
              className={cn(
                "w-full h-12 rounded-sm font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]",
                isSigPadOpen 
                  ? "bg-slate-200 text-slate-500 hover:bg-slate-200" 
                  : "bg-[#ea9c00] hover:bg-[#d68e00] text-black border-none"
              )}
              disabled={isSigPadOpen}
            >
              <PenTool className="w-5 h-5 fill-black" />
              {isSigPadOpen ? 'OPENING...' : 'SIGN (ARTISAN)'}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={onOpenEmailModal}
            className="w-full h-12 bg-[#ea9c00] hover:bg-[#d68e00] text-black border-none rounded-sm shadow-sm font-black text-[13px] uppercase tracking-wide flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
          >
            <Send className="w-[18px] h-[18px] fill-black" strokeWidth={2.5} />
            SEND TO CLIENT
          </Button>

          <Button 
            onClick={onCreatePayment}
            disabled={isPaying || isPaid}
            className="w-full h-12 bg-white hover:bg-slate-50 text-[#072161] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-none rounded-sm font-black text-[13px] uppercase tracking-wide flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
          >
            {isPaying ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <LinkIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />}
            PAYMENT LINK
          </Button>

          <Button 
            onClick={onCreateInvoice}
            disabled={isGeneratingInvoice || !isAccepted}
            className="w-full h-14 bg-[#072161] hover:bg-[#051745] text-white shadow-sm border-none rounded-sm font-black text-[11px] leading-tight uppercase tracking-wide flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
          >
            {isGeneratingInvoice ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <FileText className="w-[20px] h-[20px] fill-white" />}
            <span className="text-center pr-2">CONVERT TO<br/>INVOICE</span>
          </Button>
        </div>

        {/* Action icons bar */}
        <div className="flex items-center justify-between gap-2 border-t border-[#e2e4e9] mt-5 pt-5">
          <Button 
            variant="ghost" 
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 h-12 bg-[#e8e9ee] hover:bg-[#d9dbe2] rounded-sm text-[#072161] transition-colors shadow-sm"
          >
            {isGeneratingPdf ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Download className="w-[18px] h-[18px]" strokeWidth={2.5} />}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onDownloadExcel}
            disabled={isGeneratingExcel}
            className="flex-1 h-12 bg-[#e8e9ee] hover:bg-[#d9dbe2] rounded-sm text-[#072161] transition-colors shadow-sm"
          >
            {isGeneratingExcel ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <TableIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />}
          </Button>

          <Button 
            variant="ghost" 
            className="flex-1 h-12 bg-[#e8e9ee] hover:bg-red-100 rounded-sm text-[#c81920] hover:text-red-700 transition-colors shadow-sm"
          >
            <Trash2 className="w-[18px] h-[18px] fill-[#c81920]" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      {/* STATUS BANNER */}
      {isPending && (
        <div className="bg-[#593d05] text-[#ecaf05] rounded-md px-5 py-4 flex items-center justify-start gap-4">
          <div className="bg-[#ecaf05] text-[#593d05] rounded-full p-0.5 shrink-0 flex items-center justify-center">
            <Info className="w-5 h-5 fill-[#ecaf05] text-[#593d05]" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-[12px] tracking-[0.05em] uppercase leading-tight">
            PENDING CLIENT<br/>APPROVAL
          </span>
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
