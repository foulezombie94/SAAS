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
  Printer,
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
  
  // Format Date in French
  const createdDate = new Date(quote.created_at || new Date()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Pending Status Banner check
  const isPending = ['draft', 'sent'].includes(quote.status) || (quote.status === 'accepted' && !quote.artisan_signature_url && !quote.client_signature_url)

  return (
    <div className="space-y-4 sticky top-8 p-1 bg-[#F7F7F9] rounded-lg">
      
      {/* Carte 1 : Centre de commandement */}
      <div className="bg-white p-5 rounded-lg shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
        <h3 className="text-[11px] font-black uppercase text-gray-500 tracking-widest mb-4">CENTRE DE COMMANDE</h3>
        
        {/* Espace Signature Artisan (Always on top if missing) */}
        {!quote.artisan_signature_url && quote.status !== 'paid' && (
          <div className="pb-4 mb-4 border-b border-gray-100">
            <Button 
              onClick={() => setIsSigPadOpen(true)}
              className={cn(
                "w-full h-[3.25rem] rounded-md font-black text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-sm",
                isSigPadOpen 
                  ? "bg-slate-200 text-slate-500 hover:bg-slate-200" 
                  : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white border-none"
              )}
              disabled={isSigPadOpen}
            >
              <PenTool className="w-5 h-5" />
              {isSigPadOpen ? 'OUVERTURE...' : 'SIGNER'}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={onOpenEmailModal}
            className="w-full h-[3.25rem] bg-[#F29900] hover:bg-[#d98900] text-gray-900 border-none shadow-sm rounded-md font-bold text-[13px] uppercase tracking-wide flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
          >
            <Send className="w-[1.25rem] h-[1.25rem] fill-gray-900" strokeWidth={2} />
            ENVOYER AU CLIENT
          </Button>

          <Button 
            onClick={onCreatePayment}
            disabled={isPaying || isPaid}
            className="w-full h-[3.25rem] bg-white hover:bg-gray-50 text-[#002266] border border-gray-200 shadow-sm rounded-md font-bold text-[13px] uppercase tracking-wide flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
          >
            {isPaying ? <Loader2 className="w-[1.25rem] h-[1.25rem] animate-spin" /> : <LinkIcon className="w-[1.25rem] h-[1.25rem]" strokeWidth={2.5} />}
            LIEN DE PAIEMENT
          </Button>

          <Button 
            onClick={onCreateInvoice}
            disabled={isGeneratingInvoice || !isAccepted}
            className="w-full h-[3.25rem] bg-[#002266] hover:bg-[#001540] text-white shadow-sm border-none rounded-md font-bold text-[13px] uppercase tracking-wide flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
          >
            {isGeneratingInvoice ? <Loader2 className="w-[1.25rem] h-[1.25rem] animate-spin" /> : <FileText className="w-[1.25rem] h-[1.25rem] fill-white" />}
            <span>CONVERTIR EN<br/>FACTURE</span>
          </Button>
        </div>

        {/* Barre d'icônes d'action */}
        <div className="flex items-center justify-between gap-3 pt-5 border-t border-gray-100 mt-5">
          <Button 
            variant="ghost" 
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 h-[3.25rem] bg-[#f0f2f5] hover:bg-[#e4e7ec] rounded-md text-[#002266] transition-colors"
          >
            {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" strokeWidth={2} />}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onDownloadExcel}
            disabled={isGeneratingExcel}
            className="flex-1 h-[3.25rem] bg-[#f0f2f5] hover:bg-[#e4e7ec] rounded-md text-[#002266] transition-colors"
          >
            {isGeneratingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" strokeWidth={2} />}
          </Button>

          <Button 
            variant="ghost" 
            className="flex-1 h-[3.25rem] bg-[#f0f2f5] hover:bg-red-100 rounded-md text-[#D32F2F] hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5 fill-[#D32F2F] text-[#D32F2F]" strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Carte 2 : Barre d'état */}
      {isPending && (
        <div className="bg-[#8C5500] text-[#facc15] rounded-md px-5 py-4 flex items-center justify-center gap-3 shadow-md">
          <div className="bg-[#facc15] text-[#8C5500] rounded-full p-0.5 shadow-sm">
            <Info className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-[12px] tracking-wider uppercase">
            EN ATTENTE D'APPROBATION DU CLIENT
          </span>
        </div>
      )}

      {/* Fiche 3 : Aperçu du projet */}
      <div className="bg-white p-5 rounded-lg shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
        <h3 className="text-[11px] font-black uppercase text-gray-500 tracking-widest mb-5">APERÇU DU PROJET</h3>
        
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#f0f2f5] rounded-md shadow-sm flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#002266]" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">DÉBUT ESTIMÉ</span>
              <span className="font-extrabold text-gray-900 text-[14px] capitalize">{createdDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#f0f2f5] rounded-md shadow-sm flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5 text-[#002266]" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">DURÉE DU PROJET</span>
              <span className="font-extrabold text-gray-900 text-[14px]">14 jours ouvrables</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#f0f2f5] rounded-md shadow-sm flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#002266]" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">RÉGION IMPOSABLE</span>
              <span className="font-extrabold text-gray-900 text-[14px]">Royaume-Uni (20 %)</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
