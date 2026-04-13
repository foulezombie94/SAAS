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
  Briefcase
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
  const isPending = quote.status === 'draft' || quote.status === 'sent' || quote.status === 'consulted'

  return (
    <div className="space-y-6 sticky top-8">
      
      {/* COMMAND CENTER */}
      <div className="bg-[#f4f5f7] p-6 lg:p-8 rounded-[24px] space-y-4 shadow-sm border border-slate-100/50">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Command Center</h3>
        
        {/* Espace Signature Artisan (Always on top if missing) */}
        {!quote.artisan_signature_url && quote.status !== 'paid' && (
          <div className="space-y-3 pb-4 mb-4 border-b border-slate-200/60">
            <Button 
              onClick={() => setIsSigPadOpen(true)}
              className={cn(
                "w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-sm",
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
          className="w-full h-14 bg-[#f09a00] hover:bg-[#d88a00] text-slate-900 border-none shadow-sm rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <Send className="w-5 h-5 fill-slate-900" />
          SEND TO CLIENT
        </Button>

        <Button 
          onClick={onCreatePayment}
          disabled={isPaying || isPaid}
          className="w-full h-14 bg-white hover:bg-slate-50 text-[#002878] border border-slate-200 shadow-sm rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
          PAYMENT LINK
        </Button>

        <Button 
          onClick={onCreateInvoice}
          disabled={isGeneratingInvoice || !isAccepted}
          className="w-full h-14 bg-[#002878] hover:bg-[#001f5c] text-white shadow-sm border-none rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          {isGeneratingInvoice ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 fill-white" />}
          CONVERT TO INVOICE
        </Button>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/70 mt-6">
          <Button 
            variant="ghost" 
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-14 bg-slate-200/50 hover:bg-slate-200 rounded-xl text-[#002878] transition-colors"
          >
            {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onDownloadExcel}
            disabled={isGeneratingExcel}
            className="h-14 bg-slate-200/50 hover:bg-slate-200 rounded-xl text-[#002878] transition-colors"
          >
            {isGeneratingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : <TableIcon className="w-5 h-5" />}
          </Button>

          <Button 
            variant="ghost" 
            className="h-14 bg-slate-200/50 hover:bg-red-100 rounded-xl text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* PENDING CLIENT APPROVAL BANNER (if applicable) */}
      {isPending && (
        <div className="bg-[#4d3300] text-[#ffb82e] rounded-[16px] p-5 flex items-center gap-4 shadow-lg shadow-amber-900/10">
          <div className="bg-[#ffb82e] text-[#4d3300] rounded-full p-1.5 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 font-black" strokeWidth={3} />
          </div>
          <span className="font-black text-[13px] tracking-widest uppercase leading-tight">
            Pending Client Approval
          </span>
        </div>
      )}

      {/* PROJECT OVERVIEW */}
      <div className="bg-[#f4f5f7] p-6 lg:p-8 rounded-[24px] space-y-6 shadow-sm border border-slate-100/50">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Project Overview</h3>
        
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#002878]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Estimated Start</span>
            <span className="font-bold text-slate-800 text-sm">{createdDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#002878]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Project Duration</span>
            <span className="font-bold text-slate-800 text-sm">14 Working Days</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-[#002878]" /> 
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Taxable Region</span>
            <span className="font-bold text-slate-800 text-sm">UK Standard (20%)</span>
          </div>
        </div>
      </div>
      
    </div>
  )
}
