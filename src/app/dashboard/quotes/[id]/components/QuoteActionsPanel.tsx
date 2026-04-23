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
import { PdfIcon } from '@/components/icons/PdfIcon'
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
            <Button 
              onClick={() => setIsSigPadOpen(true)}
              className={cn(
                "w-full h-12 shadow-lg",
                isSigPadOpen 
                  ? "bg-slate-200 text-slate-500 hover:bg-slate-200 shadow-none border-none" 
                  : "bg-[#00236f] text-white border-none"
              )}
              disabled={isSigPadOpen}
            >
              <PenTool className="w-5 h-5 mr-2" />
              {isSigPadOpen ? 'OUVERTURE...' : 'SIGNER (ARTISAN)'}
            </Button>
          </div>
        )}

        <Button 
          onClick={onOpenEmailModal}
          className="w-full bg-[#ef9900] text-[#2a1700] hover:bg-[#ef9900] hover:opacity-90 transition-all shadow-lg border-none h-12"
        >
          <Send className="w-4 h-4 mr-2" strokeWidth={2.5} />
          ENVOYER AU CLIENT
        </Button>

        <Button 
          onClick={onCopyShareLink}
          disabled={isGeneratingLink}
          variant="outline"
          className="w-full text-[#00236f] border border-[#00236f]/20 h-12"
        >
          {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" strokeWidth={2.5} />}
          GÉNÉRER LE LIEN
        </Button>

        <Button 
          onClick={onCreateInvoice}
          disabled={isGeneratingInvoice || !isAccepted}
          className="w-full bg-[#00236f] text-white hover:bg-[#00236f] h-12 border-none disabled:opacity-50"
        >
          {isGeneratingInvoice ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
          CONVERTIR EN FACTURE
        </Button>

        {/* Action icons bar */}
        <div className="pt-4 mt-4 border-t border-[#c5c5d3]/30 flex justify-between gap-3">
          <Button 
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            variant="outline"
            size="icon"
            className="flex-1 h-12"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <PdfIcon className="w-5 h-5" fill="#00236f" />}
          </Button>
          
          <Button 
            onClick={onDownloadExcel}
            disabled={isGeneratingExcel}
            variant="outline"
            size="icon"
            className="flex-1 h-12"
          >
            {isGeneratingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <TableIcon className="w-4 h-4 text-[#00236f]" strokeWidth={2.5} />}
          </Button>
        </div>
      </div>

      {/* STATUS BANNER */}
      {isPending && (
        <div className="bg-[#5c3800]/10 text-[#ef9900] h-14 rounded-xl flex items-center px-6 gap-4 border border-[#ef9900]/20">
          <Info className="w-5 h-5 fill-[#ef9900] text-white" strokeWidth={2.5} />
          <span className="font-bold text-sm tracking-wide uppercase">EN ATTENTE DU CLIENT</span>
        </div>
      )}

      {/* PROJECT METADATA & EMAILS HISTORY */}
      <div className="bg-[#f3f4f8] rounded-xl overflow-hidden shadow-sm border border-[#c5c5d3]/20">
        {/* Project Metadata */}
        <div className="p-5 border-b border-[#c5c5d3]/30">
          <h3 className="text-[10px] font-black uppercase text-[#818c9f] tracking-widest mb-4 flex items-center gap-2">
            <Info size={12} /> Project Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase text-[#a5aec1] tracking-wider">Estimated Start</p>
              <p className="text-[11px] font-black text-[#1a2130] uppercase">
                {quote.estimated_start_date ? new Date(quote.estimated_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'NOT SET'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase text-[#a5aec1] tracking-wider">Project Duration</p>
              <p className="text-[11px] font-black text-[#1a2130] uppercase">{quote.estimated_duration || 'NOT SPECIFIED'}</p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-[8px] font-black uppercase text-[#a5aec1] tracking-wider">Taxable Region</p>
              <p className="text-[11px] font-black text-[#1a2130] uppercase">Standard ({quote.tax_rate}%)</p>
            </div>
          </div>
        </div>

        {/* Emails History */}
        <div className="p-5">
          <h3 className="text-[10px] font-black uppercase text-[#818c9f] tracking-widest mb-4 flex items-center gap-2">
            <Timer size={12} /> Live History
          </h3>
          
          <div className="space-y-4">
            {quote.sent_emails && quote.sent_emails.length > 0 ? (
              quote.sent_emails.map((email) => (
                <div key={email.id} className="flex items-center gap-4 group/email">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-[#c5c5d3]/10 group-hover/email:bg-[#00236f] group-hover/email:text-white transition-all">
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[8px] font-black uppercase text-[#a5aec1] tracking-wider">
                      {new Date(email.created_at).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="font-black text-[#1a2130] text-[11px] truncate">{email.subject}</span>
                    <span className="text-[9px] text-slate-400 font-bold truncate">{email.recipient_email}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center opacity-30">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-[#818c9f]">No emails recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}
