import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Send, Loader2, AlertCircle } from 'lucide-react'
import { Quote } from '@/types/dashboard'
import { toast } from 'sonner'
import { sendQuoteEmailAction } from '@/app/dashboard/quotes/actions'

interface EmailModalProps {
  quote: Quote
  isOpen: boolean
  onClose: () => void
}

export function EmailModal({ quote, isOpen, onClose }: EmailModalProps) {
  const [isSending, setIsSending] = useState(false)
  const [emailForm, setEmailForm] = useState({
    to: quote.clients?.email || '',
    subject: `Votre devis #${quote.number} - ${quote.profiles?.company_name || 'ArtisanFlow'}`,
    message: `Bonjour ${quote.clients?.name},\n\nVeuillez trouver ci-joint notre proposition commerciale concernant votre projet.\n\nVous pouvez consulter, signer et payer ce devis directement en ligne via le bouton sécurisé ci-dessous.\n\nRestant à votre disposition pour toute question.`
  })

  // Start with client email if available
  useEffect(() => {
    if (isOpen) {
      setEmailForm(prev => ({
        ...prev,
        to: quote.clients?.email || prev.to
      }))
    }
  }, [isOpen, quote.clients?.email])

  const handleSendEmail = async () => {
    try {
      if (!emailForm.to) {
        toast.error("L'adresse email du destinataire est requise.")
        return
      }

      setIsSending(true)
      const result = await sendQuoteEmailAction({
        quoteId: quote.id,
        ...emailForm
      })

      if (result.success) {
        toast.success("Email envoyé avec succès !")
        onClose()
      } else {
        throw new Error(result.error)
      }
    } catch (e: any) {
      toast.error("Erreur l'envoi : " + e.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-[550px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
      
      {/* Header */}
      <div className="p-8 pb-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
          <Mail className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Envoyer le devis</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">
          Personnalisez le message pour votre client avant l'envoi.
        </p>
      </div>

      {/* Body */}
      <div className="px-8 py-6 border-t border-slate-100 flex flex-col gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Destinataire</label>
          <Input 
            placeholder="email@exemple.com" 
            value={emailForm.to}
            onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
            className="h-11 border-slate-200 focus:ring-indigo-500 rounded-lg shadow-sm font-medium"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Objet du mail</label>
          <Input 
            placeholder="Objet de l'email" 
            value={emailForm.subject}
            onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
            className="h-11 border-slate-200 focus:ring-indigo-500 rounded-lg shadow-sm font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Message</label>
          <textarea 
            placeholder="Écrivez votre message ici..." 
            rows={6}
            value={emailForm.message}
            onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
            className="w-full p-4 border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-lg shadow-sm resize-none font-medium text-slate-700 outline-none transition-all text-sm"
          />
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed font-bold uppercase tracking-tight">
            Un bouton sécurisé permettant au client de consulter, signer et payer sera automatiquement ajouté.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 p-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isSending} className="font-bold text-slate-500">
          Annuler
        </Button>
        <Button 
          onClick={handleSendEmail} 
          disabled={isSending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 font-black uppercase tracking-tighter shadow-lg shadow-indigo-100 h-11"
        >
          {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {isSending ? "Envoi..." : "Envoyer le devis"}
        </Button>
      </div>
    </Modal>
  )
}
