import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SignaturePad } from '@/components/SignaturePad'
import { 
  CreditCard, 
  Calendar, 
  Settings2, 
  Mail, 
  CheckCircle2, 
  Clock, 
  FileText,
  Zap,
  Loader2,
  PenTool
} from 'lucide-react'
import { Quote } from '@/types/dashboard'
import { cn } from '@/lib/utils'

interface QuoteActionsPanelProps {
  quote: Quote
  signature: string | null
  isPaying: boolean
  isGeneratingInvoice: boolean
  isSigning: boolean
  onSaveSignature: (data: string) => void
  onCreatePayment: () => void
  onCreateInvoice: () => void
  onOpenEmailModal: () => void
}

export function QuoteActionsPanel({
  quote,
  signature,
  isPaying,
  isGeneratingInvoice,
  isSigning,
  onSaveSignature,
  onCreatePayment,
  onCreateInvoice,
  onOpenEmailModal
}: QuoteActionsPanelProps) {
  const [isSigPadOpen, setIsSigPadOpen] = useState(false)
  
  const isPaid = quote.status === 'paid'
  const isAccepted = ['accepted', 'paid', 'invoiced'].includes(quote.status)

  const handleSaveSignature = (data: string) => {
    onSaveSignature(data)
    setIsSigPadOpen(false)
  }

  return (
    <div className="space-y-6 sticky top-8">
      {/* CARD: COMMAND CENTER */}
      <Card className="border-slate-200/60 shadow-lg shadow-slate-200/20 overflow-hidden ring-1 ring-slate-200/50">
        <div className="bg-slate-900 border-b border-slate-800 py-5 px-6">
          <div className="text-white text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            Command Center
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Espace Signature */}
          {!signature && quote.status !== 'paid' && (
            <div className="space-y-3 pb-2 border-b border-slate-100 mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Validation Interne
              </label>
              
              <Button 
                onClick={() => setIsSigPadOpen(true)}
                className="w-full h-11 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 font-black uppercase tracking-tighter"
                variant="outline"
              >
                <PenTool className="w-4 h-4 mr-2" />
                Signer le devis
              </Button>

              {isSigPadOpen && (
                <SignaturePad 
                  onSave={handleSaveSignature} 
                  onCancel={() => setIsSigPadOpen(false)} 
                  isLoading={isSigning} 
                />
              )}

              <p className="text-[10px] text-slate-400 italic text-center leading-relaxed">
                Utilisez cette zone pour signer vous-même le devis <br/>si le client l'a déjà validé oralement.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm transition-all flex items-center justify-between group px-4 py-2 border"
              variant="outline"
              onClick={onOpenEmailModal}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">Envoyer au client</span>
              </div>
              <Clock className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </Button>

            <Button 
              className={cn(
                "w-full h-11 transition-all flex items-center justify-between px-4 py-2 border shadow-sm group",
                isPaid 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                  : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
              )}
              variant="outline"
              onClick={onCreatePayment}
              disabled={isPaying || isPaid}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-lg transition-transform group-hover:scale-110",
                  isPaid ? "bg-emerald-100 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                )}>
                  {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                </div>
                <span className="font-bold text-sm">{isPaid ? 'Paiement Terminé' : 'Générer Lien Stripe'}</span>
              </div>
              {isPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Zap className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />}
            </Button>

            <Button 
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm transition-all flex items-center justify-between group px-4 py-2 border"
              variant="outline"
              onClick={onCreateInvoice}
              disabled={isGeneratingInvoice || !isAccepted}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-900 rounded-lg text-white group-hover:scale-110 transition-transform">
                  {isGeneratingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                </div>
                <span className="font-bold text-sm">Convertir en Facture</span>
              </div>
              <CheckCircle2 className={cn("w-4 h-4 transition-colors", isAccepted ? "text-emerald-500" : "text-slate-200")} />
            </Button>
          </div>
        </div>
      </Card>

      {/* CARD: STATUT DÉTAILLÉ */}
      <Card className="border-slate-200/60 shadow-md bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Suivi Logiciel</span>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium italic">Consulté le :</span>
            <span className="font-bold text-slate-900">
              {quote.last_viewed_at ? new Date(quote.last_viewed_at).toLocaleDateString('fr-FR') : 'Jamais'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium italic">Signé par :</span>
            <span className="font-bold text-slate-900">{signature ? 'Client / Artisan' : 'En attente'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] leading-relaxed text-slate-400 font-bold uppercase tracking-tight">
              Chaque action est enregistrée avec horodatage pour votre protection juridique.
            </p>
          </div>
        </div>
      </Card>
      
      {/* ACTION: CALENDRIER */}
      <Button variant="outline" className="w-full h-12 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-sm font-bold gap-3 transition-all border">
        <Calendar className="w-5 h-5 text-slate-400" />
        Planifier un RDV Chantier
      </Button>
    </div>
  )
}
