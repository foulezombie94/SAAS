'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Quote, QuoteItem } from '@/types/dashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SignaturePad } from '@/components/SignaturePad'
import {
  Download,
  Send,
  CheckCircle2,
  CreditCard,
  PenTool,
  FileText,
  User,
  MapPin,
  Calendar,
  Clock,
  Loader,
  Receipt,
  FileBadge,
  TrendingUp,
  ArrowRight,
  Printer,
  Table as TableIcon,
  Share2,
  Mail,
  X
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface QuoteClientProps {
  quote: Quote
}

export function QuoteClient({ quote }: QuoteClientProps) {
  const router = useRouter()
  const [currentQuote, setCurrentQuote] = useState<Quote>(quote)
  const [isSigning, setIsSigning] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const [signature, setSignature] = useState<string | null>(quote.signature_url || null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({
    subject: `Votre Devis ${quote.number} - ${quote.profiles?.company_name || 'ArtisanFlow'}`,
    message: `Bonjour ${quote.clients?.name},\n\nVeuillez trouver ci-joint notre proposition commerciale concernant votre projet.\n\nVous pouvez consulter, signer et payer ce devis directement en ligne via le bouton sécurisé ci-dessous.\n\nRestant à votre disposition pour toute question.`
  })
  const quoteRef = useRef<HTMLDivElement>(null)

  // Real-time synchronization for the artisan
  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`quote-dashboard-${quote.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `id=eq.${quote.id}` },
        (payload: any) => {
          const updated = payload.new as Quote
          setCurrentQuote(prev => ({ ...prev, ...updated }))
          if (updated.status === 'paid') {
             toast.success("Le client vient de payer !")
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [quote.id])

  const supabase = createClient()

  const handleDownloadPdf = async () => {
    const printElement = document.getElementById('pdf-template')
    if (!printElement) return
    setIsGeneratingPdf(true)

    try {
      const canvas = await html2canvas(printElement, {
        scale: 2, // Optimized for high-quality A4 without crashing mobile RAM
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      pdf.save(`ArtisanFlow_Devis_${quote.number}.pdf`)
      toast.success("PDF généré avec succès !")
    } catch (error) {
      console.error('PDF Error:', error)
      toast.error("Erreur de génération PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleDownloadExcel = () => {
    try {
      const headers = ['Description', 'Quantite', 'Prix Unitaire HT', 'Total HT']
      const escapeCSV = (str: string | number | null | undefined) => {
        const val = str === null || str === undefined ? '' : String(str)
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }

      const rows = (quote.quote_items || []).map((item: QuoteItem) => [
        escapeCSV(item.description),
        escapeCSV(item.quantity),
        escapeCSV(item.unit_price),
        escapeCSV(item.total_price)
      ])

      rows.push(['', '', '', ''])
      rows.push(['TOTAL HT', '', '', escapeCSV(quote.total_ht)])
      rows.push(['TOTAL TTC', '', '', escapeCSV(quote.total_ttc)])

      const csvContent = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.body.appendChild(document.createElement('a'))
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = `ArtisanFlow_Devis_${quote.number}.csv`
      link.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(link)
      toast.success("Export Excel réussi !")
    } catch (e) {
      toast.error("Erreur lors de l'export Excel")
    }
  }

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/share/quotes/${quote.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Lien de signature copié !", {
      description: "Vous pouvez l'envoyer par SMS ou Email à votre client."
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveSignature = async (dataUrl: string) => {
    try {
      // 1. Storage Fix (Faille 1): Convert DataURL to Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      // 2. Upload to Supabase Storage - High Security path
      const fileName = `${quote.user_id}/${quote.id}_${Date.now()}.png`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, { contentType: 'image/png' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName)

      // 3. Security Fix (Faille 3): Call secure backend route
      const acceptResponse = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          signatureUrl: publicUrl
        })
      })

      if (!acceptResponse.ok) throw new Error("Backend error")

      setSignature(publicUrl)
      setIsSigning(false)
      toast.success("Devis signé et approuvé !")
      router.refresh()
    } catch (e: any) {
      toast.error("Échec de la signature : " + e.message)
    }
  }

  const handleCreatePayment = async () => {
    setIsPaying(true)
    try {
      // Pour l'artisan, "Activer Paiement" signifie maintenant copier le lien pour le client
      const shareUrl = `${window.location.origin}/share/quotes/${quote.id}`
      await navigator.clipboard.writeText(shareUrl)

      toast.success("Lien de paiement copié !", {
        description: "Envoyez ce lien à votre client pour qu'il puisse payer par carte."
      })
    } catch (e: any) {
      toast.error("Impossible de copier le lien : " + e.message)
    } finally {
      setIsPaying(false)
    }
  }

  const handleCreateInvoice = async () => {
    setIsGeneratingInvoice(true)
    try {
      const response = await fetch('/api/invoices/create-from-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id })
      })
      const data = await response.json()
      if (data.invoiceId) {
        toast.success("Facture prête !")
        router.push(`/dashboard/invoices/${data.invoiceId}`)
      } else throw new Error(data.error)
    } catch (e: any) {
      toast.error("Échec génération facture : " + e.message)
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    const toastId = toast.loading("Envoi de l'email en cours...")
    try {
      const response = await fetch('/api/quotes/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          subject: emailForm.subject,
          message: emailForm.message
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erreur d'envoi")

      toast.success("Email envoyé avec succès !", { id: toastId })
      setIsEmailModalOpen(false)
      if (currentQuote.status === 'draft') {
        setCurrentQuote(prev => ({ ...prev, status: 'sent' }))
      }
    } catch (e: any) {
      toast.error(e.message, { id: toastId })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Real-time synchronization for the email modal message
  React.useEffect(() => {
    if (isEmailModalOpen) {
      setEmailForm(prev => ({
        ...prev,
        subject: `Votre Devis ${currentQuote.number} - ${currentQuote.profiles?.company_name || 'ArtisanFlow'}`,
        message: `Bonjour ${currentQuote.clients?.name || 'Client'},\n\nVeuillez trouver ci-joint notre proposition commerciale concernant votre projet.\n\nVous pouvez consulter, signer et payer ce devis directement en ligne via le bouton sécurisé ci-dessous.\n\nRestant à votre disposition pour toute question.`
      }))
    }
  }, [isEmailModalOpen, currentQuote.clients?.name, currentQuote.number, currentQuote.profiles?.company_name])

  return (
    <div className="flex flex-col gap-10 pb-32">
      {/* 
        HIGH-FIDELITY PDF TEMPLATE (V4.1 Restore)
        Designed for pixel-perfection based on industry standards.
        Uses hardcoded styles for html2canvas reliability across all browsers.
      */}
      <div id="pdf-template" style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '1000px', // Large canvas for ultra-sharp rendering
        padding: '80px',
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        color: '#1e293b'
      }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '80px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#002878', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>{quote.profiles?.company_name || 'Professional Systems'}</h2>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: 0 }}>ArtisanFlow SaaS Integration</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
            <p style={{ margin: 0 }}>{quote.profiles?.address || 'Adresse non renseignée'}</p>
            <p style={{ margin: 0 }}>France</p>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#10172a' }}>{quote.profiles?.phone || quote.profiles?.email}</p>
          </div>
        </div>

        {/* Title & Ref */}
        <div style={{ marginBottom: '4px' }}>
          <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#002878', margin: 0, letterSpacing: '-0.04em' }}>
            {quote.status === 'paid' ? 'Facture' : 'Devis'} #{quote.number}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#64748b', margin: 0 }}>
              Référence Projet : Rénovation Loft - {quote.clients?.city}
            </p>
            <div style={{
              backgroundColor: '#fef3c7',
              color: '#d97706',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderLeft: '4px solid #f59e0b'
            }}>
              Statut : {quote.status === 'accepted' ? 'Validé' : 'En Attente'}
            </div>
          </div>
        </div>

        <div style={{ height: '4px', backgroundColor: '#002878', width: '100%', marginBottom: '80px', marginTop: '30px' }}></div>

        {/* Info Grid */}
        <div style={{ display: 'flex', gap: '80px', marginBottom: '80px' }}>
          {/* Client Box */}
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: '900', color: '#002878', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Destinataire</p>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 16px 0' }}>{quote.clients?.name}</h3>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', margin: '0 0 4px 0' }}>Adresse de chantier :</p>
            <p style={{ fontSize: '16px', color: '#334155', fontWeight: '700', margin: 0 }}>{quote.clients?.site_address || quote.clients?.address || '42 Quai de Saône'}</p>
            <p style={{ fontSize: '16px', color: '#334155', fontWeight: '700', margin: 0 }}>{quote.clients?.postal_code} {quote.clients?.city}</p>
          </div>

          {/* Details block */}
          <div style={{ width: '350px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignContent: 'start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Date d'émission</p>
              <p style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{new Date(quote.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Date de validité</p>
              <p style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>30 jours</p>
            </div>
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Mode de règlement</p>
              <p style={{ fontSize: '16px', fontWeight: '800', color: '#10172a', margin: 0 }}>Paiement par Carte Bancaire</p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '60px' }}>
          <thead>
            <tr style={{ backgroundColor: '#002878', color: '#ffffff' }}>
              <th style={{ textAlign: 'left', padding: '20px 30px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '8px 0 0 0' }}>Désignation des prestations</th>
              <th style={{ textAlign: 'center', padding: '20px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Qté</th>
              <th style={{ textAlign: 'center', padding: '20px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unité</th>
              <th style={{ textAlign: 'right', padding: '20px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PU HT</th>
              <th style={{ textAlign: 'right', padding: '20px 30px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '0 8px 0 0' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.quote_items?.map((item: QuoteItem) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '30px' }}>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>{item.description}</p>
                  <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>Prestation certifiée ArtisanFlow - Finition premium.</p>
                </td>
                <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: '700', color: '#475569' }}>{item.quantity?.toFixed(2)}</td>
                <td style={{ textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#475569' }}>Unit</td>
                <td style={{ textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#475569' }}>{item.unit_price?.toLocaleString('fr-FR')} €</td>
                <td style={{ textAlign: 'right', paddingRight: '30px', fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{item.total_price?.toLocaleString('fr-FR')} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Signature Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
          {/* Left side: Signature */}
          <div style={{ flex: 1 }}>
            {signature && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Approuvé par le client</p>
                <img src={signature} alt="Client Signature" style={{ height: '100px', mixBlendMode: 'multiply' }} />
                <p style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '5px', color: '#94a3b8' }}>Document signé numériquement le {new Date().toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Right side: Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ width: '400px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
              <span>Total Hors Taxes</span>
              <span>{quote.total_ht?.toLocaleString('fr-FR')} €</span>
            </div>
            <div style={{ width: '400px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#64748b', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
              <span>TVA (20%)</span>
              <span>{(quote.total_ht * 0.2).toLocaleString('fr-FR')} €</span>
            </div>
            <div style={{ width: '500px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#002878', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Net à Payer TTC</span>
              <span style={{ fontSize: '48px', fontWeight: '900', color: '#002878', letterSpacing: '-0.04em' }}>{quote.total_ttc?.toLocaleString('fr-FR')} €</span>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div style={{ marginTop: '100px', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', lineHeight: '1.8' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Informations Légales</p>
              <p style={{ margin: 0 }}>SIRET : {quote.profiles?.siret || 'En cours d\'immatriculation'}</p>
              <p style={{ margin: 0 }}>ID Artisan : {quote.profiles?.id.split('-')[0].toUpperCase()}</p>
              <p style={{ margin: 0 }}>Document généré par ArtisanFlow SaaS.</p>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Règlement</p>
              {quote.status === 'paid' ? (
                <p style={{ margin: 0, color: '#059669', fontWeight: '900' }}>PAIEMENT PAR CARTE BANCAIRE (ENCAISSÉ)</p>
              ) : (
                <>
                  <p style={{ margin: 0 }}>Paiement par Carte Bancaire</p>
                  {quote.profiles?.iban && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '10px', opacity: 0.8 }}>
                      IBAN : {quote.profiles.iban}<br />
                      Bank : {quote.profiles.bank_name || 'Standard'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>


          <div style={{ marginTop: '80px', textAlign: 'center', fontSize: '10px', color: '#cbd5e1', fontWeight: '600' }}>
            © {new Date().getFullYear()} ArtisanFlow Professional Systems. Édité via ArtisanFlow SaaS. Document certifié conforme.
          </div>
        </div>
      </div>

      {isSigning && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <SignaturePad
            onSave={handleSaveSignature}
            onCancel={() => setIsSigning(false)}
          />
        </div>
      )}

      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-primary p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Envoyer Devis</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Expédition via SMTP sécurisé</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Destinataire</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <User size={18} className="text-slate-400" />
                  <span className="font-black text-primary uppercase">{quote.clients?.name}</span>
                  <span className="text-slate-400 font-bold ml-auto text-xs">{quote.clients?.email || 'Pas d\'email renseigné'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sujet de l'email</label>
                <input 
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contenu du message</label>
                <textarea 
                  rows={6}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none"
                />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic pt-2">
                  * Les liens de consultation et de paiement seront ajoutés automatiquement.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={() => setIsEmailModalOpen(false)}
                  variant="outline"
                  className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] border-slate-100"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  isLoading={isSendingEmail}
                  disabled={!quote.clients?.email || isSendingEmail}
                  className="flex-[2] h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] gap-3 bg-primary text-white shadow-lg shadow-primary/20"
                >
                  <Send size={18} /> Envoyer Maintenant
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Gestion Devis</h1>
          <div className="flex items-center gap-3">
            <span className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60">Référence : {quote.number}</span>
            <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                quote.status === 'paid' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                quote.status === 'accepted' ? 'bg-amber-400 text-white shadow-amber-100' :
                quote.status === 'invoiced' ? 'bg-slate-900 text-white' :
                'bg-slate-100 text-slate-500'
              }`}>
              {quote.status === 'paid' ? 'PAYÉ' : quote.status}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="hidden md:flex h-14 px-6 font-black uppercase tracking-widest text-[10px] gap-3 border-slate-100 bg-white hover:bg-slate-50 shadow-sm"
          >
            <Printer size={18} /> Imprimer
          </Button>

          <Button
            variant="tertiary"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 md:flex-none h-14 px-8 font-black uppercase tracking-widest text-[10px] gap-3 bg-[#00236f] text-white hover:bg-[#001b54] shadow-lg shadow-blue-900/10"
          >
            {isGeneratingPdf ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
            Format PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyShareLink}
            className="flex-1 md:flex-none h-14 px-8 font-black uppercase tracking-widest text-[10px] gap-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm"
          >
            <Share2 size={20} /> Lien Client
          </Button>

          {currentQuote.status === 'paid' && (
            <Button
              onClick={handleCreateInvoice}
              isLoading={isGeneratingInvoice}
              className="flex-1 md:flex-none h-14 px-10 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-emerald-900/10"
            >
              <Receipt size={20} /> Convertir en Facture BDD
            </Button>
          )}

          {currentQuote.status === 'invoiced' && (
            <Button
              onClick={() => router.push('/dashboard/invoices')}
              className="flex-1 md:flex-none h-14 px-8 bg-slate-900 font-black uppercase tracking-widest text-[10px] gap-3"
            >
              <ArrowRight size={20} /> Accéder à la Facture
            </Button>
          )}

          {!signature && currentQuote.status !== 'invoiced' && currentQuote.status !== 'paid' && (
            <Button onClick={() => setIsSigning(true)} className="flex-1 md:flex-none h-14 px-10 font-black uppercase tracking-widest text-xs gap-3 shadow-diffused">
              <PenTool size={20} /> Signer Devis
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-10">
          {/* Document Preview Area (Display only) */}
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-outline-variant/5">
            {/* Header Stripe */}
            <div className="h-32 bg-slate-900 flex items-center justify-between px-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp size={120} />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl">
                  <FileBadge size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">ArtisanFlow</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Plateforme Artisanale</p>
                </div>
              </div>
              <div className="text-right relative z-10">
                <p className="text-4xl font-black uppercase tracking-tighter">DEVIS</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">REF: {quote.number}</p>
              </div>
            </div>

            <div className="p-16 space-y-16">
              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30">Facturer à</h4>
                  <div>
                    <p className="text-2xl font-black text-primary uppercase tracking-tighter">{quote.clients?.name}</p>
                    <p className="text-sm font-bold text-on-surface-variant flex items-center gap-2 mt-2">
                      <MapPin size={16} /> {quote.clients?.city}, France
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30">Détails</h4>
                  <div>
                    <p className="text-sm font-bold text-primary uppercase tracking-widest">Le {new Date(quote.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mt-1">Validité 30 jours</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-12 gap-8 pb-4 border-b-2 border-primary/10 text-[0.6875rem] font-black uppercase tracking-[0.3em] text-primary/40 px-6">
                  <div className="col-span-6">Description des prestations</div>
                  <div className="col-span-2 text-center">Quantité</div>
                  <div className="col-span-2 text-right">Prix</div>
                  <div className="col-span-2 text-right">Total HT</div>
                </div>
                {quote.quote_items?.map((item: QuoteItem) => (
                  <div key={item.id} className="grid grid-cols-12 gap-8 px-6 py-2 items-center">
                    <div className="col-span-6 font-black text-primary uppercase tracking-tight text-lg">{item.description}</div>
                    <div className="col-span-2 text-center font-bold text-on-surface-variant">{item.quantity}</div>
                    <div className="col-span-2 text-right font-bold text-on-surface-variant">{item.unit_price}€</div>
                    <div className="col-span-2 text-right font-black text-primary text-xl tracking-tighter">{item.total_price}€</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-row items-end justify-between pt-10 border-t-4 border-primary/5 px-6">
                <div className="flex-1">
                  {signature && (
                    <div className="w-72">
                      <img src={signature} alt="Client Signature" className="h-24 object-contain mix-blend-multiply opacity-80" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-4 text-left">Bond Electronique - Signé le {new Date().toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex justify-between w-64 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                    <span>Total Hors Taxes</span>
                    <span>{quote.total_ht} €</span>
                  </div>
                  <div className="flex justify-between w-64 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 border-b border-slate-100 pb-3">
                    <span>TVA (20%)</span>
                    <span>{(quote.total_ht * 0.2).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between w-96 mt-4 bg-primary text-on-primary p-8 rounded-3xl shadow-2xl shadow-primary/20">
                    <span className="font-black uppercase tracking-[0.2em] text-xs opacity-60">NET À PAYER TTC</span>
                    <span className="text-4xl font-black tracking-tighter leading-none">{quote.total_ttc} €</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Action Panel: Command Center */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
          <Card className="p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Send size={150} />
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-10 relative z-10">Command Center</h3>

            <div className="space-y-6 relative z-10">
              <Button
                onClick={handleCreatePayment}
                isLoading={isPaying}
                disabled={quote.status === 'paid' || quote.status === 'invoiced'}
                className="w-full h-16 bg-white text-primary hover:bg-slate-100 font-black uppercase tracking-widest text-xs gap-3"
              >
                <CreditCard size={20} /> Activer Paiement
              </Button>

              {!quote.profiles?.stripe_charges_enabled && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Paiement par carte inactif</p>
                  <p className="text-[9px] font-bold text-amber-500/70 mb-3 uppercase leading-relaxed">Votre compte Stripe n'est pas encore prêt à recevoir des paiements.</p>
                  <Link href="/dashboard/settings" className="text-[9px] font-black text-amber-500 underline uppercase tracking-widest">Finaliser la configuration</Link>
                </div>
              )}

              {quote.status === 'accepted' && (
                <Link href={`/dashboard/calendar?quote_id=${quote.id}&client_id=${quote.client_id}&title=Intervention : ${quote.number} - ${quote.clients?.name}`}>
                  <Button
                    className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs gap-3 border border-white/10 mb-4"
                  >
                    <Calendar size={20} /> Planifier l'Intervention
                  </Button>
                </Link>
              )}

              {quote.status === 'accepted' && (
                <Button
                  onClick={handleCreateInvoice}
                  isLoading={isGeneratingInvoice}
                  className="w-full h-16 bg-primary text-white font-black uppercase tracking-widest text-xs gap-3 border border-white/10"
                >
                  <Receipt size={20} /> Clôturer & Facturer
                </Button>
              )}

              {quote.profiles?.is_pro && (
                <Button
                  onClick={() => setIsEmailModalOpen(true)}
                  disabled={quote.status === 'paid' || quote.status === 'invoiced'}
                  className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-emerald-500/20"
                >
                  <Mail size={20} /> Envoyer par Email
                </Button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={handleDownloadExcel}
                  className="h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] gap-2"
                >
                  <TableIcon size={16} /> Excel (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] gap-2"
                >
                  <Share2 size={16} /> Partager
                </Button>
              </div>

              <div className="pt-6 border-t border-white/10 mt-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 leading-relaxed">
                  Accédez au suivi d'exécution en temps réel des prestations facturées.
                </p>
                <button className="flex items-center gap-3 text-white font-black text-[10px] uppercase tracking-widest hover:gap-5 transition-all">
                  Historique complet <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-surface-container-low border-none flex flex-col items-center text-center gap-4">
            <Clock className="text-primary/20" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 leading-relaxed uppercase">
              Ce document est certifié conforme aux normes de facturation en vigueur en France.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

