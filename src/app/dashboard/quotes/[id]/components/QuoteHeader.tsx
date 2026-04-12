import React from 'react'
import { Button } from '@/components/ui/Button'
import { Quote } from '@/types/dashboard'
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  ArrowLeft,
  Loader2,
  FileCheck
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuoteHeaderProps {
  quote: Quote
  isGeneratingPdf: boolean
  isGeneratingLink: boolean
  isGeneratingInvoice: boolean
  isTokenExpired: boolean | null
  onPrint: () => void
  onDownloadPdf: () => void
  onCopyShareLink: () => void
  onCreateInvoice: () => void
}

export function QuoteHeader({
  quote,
  isGeneratingPdf,
  isGeneratingLink,
  isGeneratingInvoice,
  isTokenExpired,
  onPrint,
  onDownloadPdf,
  onCopyShareLink,
  onCreateInvoice
}: QuoteHeaderProps) {
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { label: 'Brouillon', class: 'bg-slate-100 text-slate-700 border-slate-200' }
      case 'sent': return { label: 'Envoyé', class: 'bg-blue-100 text-blue-700 border-blue-200' }
      case 'accepted': return { label: 'Validé', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      case 'rejected': return { label: 'Refusé', class: 'bg-rose-100 text-rose-700 border-rose-200' }
      case 'paid': return { label: 'Payé', class: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
      case 'expired': return { label: 'Expiré', class: 'bg-amber-100 text-amber-700 border-amber-200' }
      default: return { label: status, class: 'bg-slate-100 text-slate-700' }
    }
  }

  const statusConfig = getStatusConfig(quote.status)

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex flex-col gap-2">
        <Link 
          href="/dashboard/quotes" 
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors group mb-1"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour aux devis
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 ring-1 ring-white">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1.5 flex items-center gap-2">
              Devis {quote.number}
            </h1>
            <div className="flex items-center gap-2">
              {/* Fallback for missing Badge component */}
              <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", statusConfig.class)}>
                {statusConfig.label}
              </div>
              {isTokenExpired && (
                <div className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-sm">
                  Lien public expiré
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onPrint}
          className="h-10 px-4 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimer
        </Button>
        <Button 
          variant="outline" 
          disabled={isGeneratingPdf}
          onClick={onDownloadPdf}
          className="h-10 px-4 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
        >
          {isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          PDF
        </Button>
        <Button 
          variant="outline" 
          disabled={isGeneratingLink}
          onClick={onCopyShareLink}
          className="h-10 px-4 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
        >
          {isGeneratingLink ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
          Lien de partage
        </Button>

        {quote.status === 'accepted' && (
          <Button 
            disabled={isGeneratingInvoice}
            onClick={onCreateInvoice}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all ml-2"
          >
            {isGeneratingInvoice ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
            Générer Facture
          </Button>
        )}
      </div>
    </div>
  )
}
