'use client'

import React, { useState, useEffect } from 'react'
import { Quote, QuoteItem } from '@/types/dashboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SignaturePad } from '@/components/SignaturePad'
import { useSearchParams } from 'next/navigation'
import { 
  CheckCircle2, 
  PenTool, 
  FileText,
  Clock,
  Receipt,
  Download,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  ShieldCheck,
  Briefcase,
  CreditCard,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

interface QuotePublicViewProps {
  quote: Quote
  publicToken?: string
}

export function QuotePublicView({ quote, publicToken }: QuotePublicViewProps) {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quote)
  const [isSigning, setIsSigning] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [signature, setSignature] = useState<string | null>(quote.client_signature_url || null)
  const [isDone, setIsDone] = useState(false)
  const searchParams = useSearchParams()

  const [showSuccess, setShowSuccess] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  const fetchLatestQuote = async () => {
    try {
      const response = await fetch('/api/quotes/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id, publicToken })
      })
      const data = await response.json()
      
      if (response.ok && data) {
        setCurrentQuote(prev => ({ 
          ...prev, 
          ...data,
          // Handle profile mapping if needed
          profiles: data.profiles || data.artisan 
        }))
        if (data.client_signature_url) setSignature(data.client_signature_url)
        if (data.invoice_id) setInvoiceId(data.invoice_id)
        return data
      }
    } catch (err) {
      console.error('[FetchLatest] Error:', err)
    }
  }

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      setShowSuccess(true)
      toast.success("Paiement validé !")
      // Force a manual re-fetch to update the 'Paid' status in the UI
      fetchLatestQuote()
    } else if (paymentStatus === 'canceled') {
      toast.error("Le paiement a été annulé.")
    }

    // NEW: Use the secure API to sync initial state and find invoice
    if (quote.status === 'accepted' || quote.status === 'invoiced' || quote.status === 'paid') {
       fetchLatestQuote()
    }
  }, [searchParams, quote.id, quote.status])

  // 🚀 REAL-TIME VIEW RECORDING
  useEffect(() => {
    const recordView = async () => {
      console.log("👀 [View] Tentative d'enregistrement de la consultation...")
      try {
        const response = await fetch('/api/quotes/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            quoteId: quote.id, 
            publicToken 
          })
        })
        if (!response.ok) {
           console.warn('[View] Échec de la vérification (Token invalide ou déjà consulté)')
        } else {
           console.log("✅ [View] Consultation enregistrée avec succès.")
        }
      } catch (err) {
        console.error('[View] Erreur réseau :', err)
      }
    }

    if (quote.id && publicToken) {
      // Small delay to ensure it's not a pre-render/accidental hit
      const timer = setTimeout(recordView, 1500)
      return () => clearTimeout(timer)
    }
  }, [quote.id, publicToken])

  // Real-time synchronization
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`quote-${quote.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `id=eq.${quote.id}` },
        (payload: any) => {
          const updated = payload.new as Quote
          setCurrentQuote(prev => ({ ...prev, ...updated }))
          if (updated.status === 'paid' && currentQuote.status !== 'paid') {
            toast.success("Paiement confirmé en direct !")
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [quote.id, currentQuote.status])

  const handleDownloadPdf = async () => {
    const printElement = document.getElementById('pdf-template')
    if (!printElement) return
    setIsGeneratingPdf(true)
    
    try {
      // Importation dynamique pour réduire le bundle initial (Audit Quick Win)
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      // 🛡️ REFINED CLEANUP: Temporarily sanitize styles without breaking layout
      const allStyles = Array.from(document.querySelectorAll('style'));
      const originalContents = allStyles.map(s => s.innerHTML);
      allStyles.forEach(s => {
        if (s.innerHTML.includes('lab(') || s.innerHTML.includes('oklch(')) {
          s.innerHTML = s.innerHTML
            .replace(/lab\([^)]*\)/g, '#1e293b')
            .replace(/oklch\([^)]*\)/g, '#1e293b');
        }
      });

      const canvas = await html2canvas(printElement, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 🛡️ ULTIMATE SAFETY: Injected styles to force compatibility
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            #pdf-template { font-family: Arial, sans-serif !important; }
            #pdf-template * { border-color: #e2e8f0 !important; }
          `;
          clonedDoc.head.appendChild(style);

          // 1. Sanitize all style tags
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const s = styleTags[i];
            if (s.innerHTML) {
              s.innerHTML = s.innerHTML
                .replace(/lab\([^)]*\)/g, '#1e293b')
                .replace(/oklch\([^)]*\)/g, '#1e293b')
                .replace(/color-mix\([^)]*\)/g, '#1e293b');
            }
          }

          // 2. Comprehensive Computed Style Scan (Safest Method)
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            try {
              const comp = window.getComputedStyle(el);
              if (comp.color?.includes('lab') || comp.color?.includes('oklch')) {
                el.style.color = '#1e293b';
              }
              if (comp.backgroundColor?.includes('lab') || comp.backgroundColor?.includes('oklch')) {
                el.style.backgroundColor = el.tagName === 'DIV' ? '#ffffff' : 'transparent';
              }
              if (comp.borderColor?.includes('lab') || comp.borderColor?.includes('oklch')) {
                el.style.borderColor = '#e2e8f0';
              }
            } catch (e) {}
          }
        }
      })
      
      // 🔄 RESTORE original styles in the real DOM
      allStyles.forEach((s, i) => { s.innerHTML = originalContents[i]; });
      
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      pdf.save(`Devis_${quote.number}.pdf`)
      toast.success("Téléchargement réussi !")
    } catch (e) {
      console.error(e)
      toast.error("Erreur génération PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const [isSavingSignature, setIsSavingSignature] = useState(false)

  const handleSaveSignature = async (dataUrl: string) => {
    setIsSavingSignature(true)
    console.log("✍️ [Signature] Début du processus d'acceptation...")
    try {
      // 1. Send signature to storage & update (via API)
      const response = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quoteId: quote.id, 
          publicToken: publicToken, // 🛡️ SECURITY GRADE 3
          signatureDataUrl: dataUrl,
          isPublic: true
        })
      })

      console.log("📡 [Signature] Réponse brute du serveur :", response.status)
      const result = await response.json()
      
      if (!response.ok) {
        console.error("❌ [Signature] Erreur serveur :", result)
        // En cas d'erreur 403, on affiche le code d'erreur RPC (ex: PUB-404, EXP-403)
        throw new Error(result.error + (result.details ? ` (${result.details})` : ""))
      }
      
      console.log("✅ [Signature] Succès ! Redirection ou mise à jour UI...")
      setSignature(result.signatureUrl)
      if (result.invoiceId) setInvoiceId(result.invoiceId)
      setIsSigning(false)
      setIsDone(true)
      toast.success("Devis signé avec succès !")
    } catch (e: any) {
      console.error('[Signature] Save failed:', e)
      toast.error("Échec : " + e.message)
    } finally {
      setIsSavingSignature(false)
    }
  }

  const handlePayment = async () => {
    // 🚀 NEW: We can now pay a Quote directly, which will auto-generate the invoice!
    const payload = invoiceId ? { invoiceId } : { quoteId: quote.id }

    setIsPaying(true)
    try {
      const response = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Erreur de paiement")
      }
    } catch (e: any) {
      toast.error("Impossible d'initier le paiement : " + e.message)
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* 
        SUCCESS OVERLAY (Congratulations)
      */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="bg-white rounded-[40px] p-12 max-w-lg w-full mx-4 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                 <CheckCircle2 className="text-emerald-600" size={48} />
              </div>
              <h2 className="text-4xl font-black text-[#002878] tracking-tighter mb-4 uppercase">FÉLICITATIONS !</h2>
              <p className="text-xl font-bold text-slate-500 mb-8 leading-relaxed">
                 Votre paiement a été traité avec succès.<br/>
                 Merci de votre confiance.
              </p>
              <div className="space-y-4">
                 <Button 
                    onClick={() => setShowSuccess(false)}
                    className="w-full h-16 bg-[#002878] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-900/20"
                 >
                    Consulter ma facture en ligne
                 </Button>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Référence : {currentQuote.number}</p>
              </div>
           </div>
        </div>
      )}

      {/* 
        Professional PDF Template - Shared Logic
      */}
      {/* 
        PREMIUM RESPONSIVE WEB VIEW 
        This is what the client see on their screen (Desktop/Mobile).
      */}
      <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className={`h-24 ${currentQuote.status === 'paid' ? 'bg-emerald-600' : signature ? 'bg-blue-600' : 'bg-[#002878]'} flex items-center justify-between px-8 text-white transition-colors duration-500`}>
           <div className="flex items-center gap-3">
              <FileText className="opacity-50" size={24} />
              <span className="font-black uppercase tracking-widest text-[10px]">
                 {currentQuote.status === 'paid' ? 'Facture & Reçu d\'Achat' : signature ? 'Devis Accepté & Signé' : 'Devis Officiel'}
              </span>
           </div>
           <div className="flex items-center gap-4">
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all duration-500",
                currentQuote.status === 'paid' ? "bg-emerald-500 shadow-xl" : signature ? "bg-blue-500 shadow-lg" : "bg-white/10"
              )}>
                 {currentQuote.status === 'paid' ? '✓ RÉGLÉ' : signature ? '✓ SIGNÉ' : '⚠ EN ATTENTE'}
              </div>
              <div className="text-right">
                 <p className="text-sm font-black uppercase tracking-tighter">REF: {currentQuote.number}</p>
              </div>
           </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {/* Artisan & Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[#002878]/5 rounded-xl flex items-center justify-center text-[#002878]">
                    <Briefcase size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Artisan</p>
                    <h2 className="text-xl font-black text-[#002878] uppercase">{currentQuote.profiles?.company_name || 'Artisan Professionnel'}</h2>
                    {currentQuote.profiles?.legal_form && <p className="text-[9px] font-black text-[#002878]/60 uppercase tracking-tighter">{currentQuote.profiles.legal_form}</p>}
                 </div>
              </div>
              <div className="pl-14 space-y-1">
                 <p className="text-sm font-bold text-slate-600 flex items-center gap-2"><MapPin size={14} /> {currentQuote.profiles?.address}</p>
                 <div className="pt-2 grid grid-cols-1 gap-1 text-[10px] font-bold text-slate-400">
                    <p>SIRET : <span className="text-slate-600">{currentQuote.profiles?.siret || 'N/A'}</span></p>
                    <p>TVA : <span className="text-slate-600">{currentQuote.profiles?.tva_intra || 'N/A'}</span></p>
                    <p>Tél : <span className="text-slate-600">{currentQuote.profiles?.phone || 'N/A'}</span></p>
                 </div>
              </div>
            </div>
            
            <div className="md:text-right space-y-4">
              <div className="flex items-center md:justify-end gap-3">
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Client</p>
                    <h3 className="text-xl font-black text-slate-900 uppercase">{currentQuote.clients?.name}</h3>
                 </div>
                 <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <User size={20} />
                 </div>
              </div>
              <div className="pr-0 md:pr-14 space-y-1">
                 {/* 🛡️ SECURITY GRADE 3 : Technical vs Commercial expiration
  // Use a 10-minute buffer to match server-side safety logic
  const bufferMs = 10 * 60 * 1000
  const isTokenExpired = currentQuote.public_token_expires_at && 
    (new Date(currentQuote.public_token_expires_at).getTime() + bufferMs) < new Date().getTime() */}
                 <p className="text-sm font-bold text-slate-600 italic leading-relaxed">{currentQuote.clients?.address}, {currentQuote.clients?.city}</p>
              </div>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-slate-50 rounded-3xl border border-slate-100">
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Émission</p>
                <p className="font-bold text-[#002878]">{new Date(currentQuote.created_at).toLocaleDateString()}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Validité</p>
                <p className="font-bold text-[#002878]">{currentQuote.valid_until ? Math.ceil((new Date(currentQuote.valid_until).getTime() - new Date(currentQuote.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 1} Mois</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Début Estimé</p>
                <p className="font-bold text-[#002878]">{currentQuote.estimated_start_date ? new Date(currentQuote.estimated_start_date).toLocaleDateString() : 'À confirmer'}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Durée</p>
                <p className="font-bold text-[#002878]">{currentQuote.estimated_duration || 'Selon devis'}</p>
             </div>
          </div>

          {/* Items List - Mobile Optimized */}
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-4 border-b border-slate-100 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="col-span-6 px-4">Désignation des prestations</div>
              <div className="col-span-2 text-center">Quantité</div>
              <div className="col-span-2 text-right">PU HT</div>
              <div className="col-span-2 text-right px-4">Total HT</div>
            </div>
            {currentQuote.quote_items?.map((item: QuoteItem) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 py-6 border-b border-slate-50 items-center hover:bg-slate-50/50 transition-colors px-4 rounded-xl">
                <div className="col-span-1 md:col-span-6">
                   <p className="font-black text-[#002878] uppercase tracking-tight text-lg leading-tight">{item.description}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic">Qualité Artisanale Certifiée</p>
                </div>
                <div className="col-span-1 md:col-span-2 text-left md:text-center font-bold text-slate-500">
                   <span className="md:hidden text-[9px] uppercase mr-2 font-black text-slate-300">Qté:</span>{item.quantity} Unit
                </div>
                <div className="col-span-1 md:col-span-2 text-left md:text-right font-bold text-slate-500">
                   <span className="md:hidden text-[9px] uppercase mr-2 font-black text-slate-300">PU:</span>{item.unit_price}€
                </div>
                <div className="col-span-1 md:col-span-2 text-right font-black text-[#002878] text-xl">
                   {item.total_price}€
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Dual Signatures */}
          <div className="flex flex-col gap-10 pt-10 border-t-2 border-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Artisan Signature Block */}
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Validation Artisan</p>
                    {currentQuote.artisan_signature_url ? (
                      <img 
                        src={currentQuote.artisan_signature_url} 
                        alt="Artisan Signature" 
                        crossOrigin="anonymous"
                        className="h-24 object-contain mix-blend-multiply" 
                      />
                    ) : (
                      <div className="h-24 flex items-center gap-3 text-slate-300">
                        <Clock size={20} />
                        <span className="text-[10px] font-bold uppercase">En attente signature artisan</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 italic">Certifié par ArtisanFlow SafeSign</p>
               </div>

               {/* Client Signature Block */}
               <div className={cn(
                  "p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden group transition-all",
                  signature ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"
               )}>
                  <div>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest mb-4",
                      signature ? "text-green-600" : "text-orange-600"
                    )}>Votre Signature (Client)</p>
                    {signature ? (
                      <img 
                        src={signature} 
                        alt="Client Signature" 
                        crossOrigin="anonymous"
                        className="h-24 object-contain mix-blend-multiply" 
                      />
                    ) : (
                      <div className="h-24 flex items-center gap-3 text-orange-400/50">
                        <PenTool size={20} />
                        <span className="text-[10px] font-bold uppercase">Signature attendue</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 italic">Document contractuel à valeur juridique</p>
               </div>
            </div>

            <div className="flex flex-col md:flex-row items-end justify-between gap-10">
              <div className="w-full md:flex-1">
                {signature && currentQuote.status !== 'paid' && currentQuote.profiles?.stripe_charges_enabled && (
                    <Button 
                      onClick={handlePayment}
                      disabled={isPaying}
                      className="w-full h-14 rounded-xl bg-[#002878] hover:bg-[#083696] text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {isPaying ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                      Passer au Paiement Sécurisé
                    </Button>
                )}
              </div>

              <div className="w-full md:w-auto space-y-4">
                <div className="flex justify-between md:justify-end gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                   <span>Sous-Total HT</span>
                   <span>{currentQuote.total_ht} €</span>
                </div>
                <div className="flex justify-between md:justify-end gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 pb-4 border-b border-slate-100">
                   <span>TVA (20%)</span>
                   <span>{(currentQuote.total_ttc - currentQuote.total_ht).toFixed(2)} €</span>
                </div>
                <div className="bg-[#002878] text-white p-8 rounded-3xl flex justify-between items-center gap-10 shadow-xl shadow-blue-900/10 scale-105 origin-right">
                   <span className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40 leading-none">Net à Payer TTC</span>
                   <span className="text-4xl font-black tracking-tighter leading-none whitespace-nowrap">{currentQuote.total_ttc} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Footer */}
          <div className="pt-12 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#002878]">Modalités & Règlement</p>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                   Règlement par virement ou carte bancaire. <br/>
                   En cas de retard, une pénalité de 3x le taux légal + 40€ d'indemnité sera appliquée.<br/>
                   Offre valable jusqu'au {currentQuote.valid_until ? new Date(currentQuote.valid_until).toLocaleDateString() : 'N/A'}
                </p>
             </div>
             <div className="md:text-right flex flex-col md:items-end justify-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Certifié Par ArtisanFlow</p>
                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-400">
                   ID TRANSACTION : {currentQuote.id.slice(0, 8).toUpperCase()}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="text-center">
         <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Logiciel de Gestion ArtisanFlow • Sécurisé & Certifié</p>
      </div>

      {/* 
        HIDDEN HIGH-FIDELITY PDF TEMPLATE
        This is captured by html2canvas for the download.
      */}
      <div id="pdf-template" style={{ 
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '1000px', 
        padding: '50px',
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        color: '#1e293b'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
           <div>
              <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#002878', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>{currentQuote.profiles?.company_name || 'Artisan Professionnel'}</h2>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: 0 }}>ArtisanFlow SaaS Integration</p>
           </div>
           <div style={{ 
              backgroundColor: currentQuote.status === 'paid' ? '#10b981' : '#f8fafc',
              color: currentQuote.status === 'paid' ? '#ffffff' : '#64748b',
              padding: '12px 24px',
              borderRadius: '50px',
              fontSize: '12px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              border: currentQuote.status === 'paid' ? 'none' : '2px solid #e2e8f0'
           }}>
              {currentQuote.status === 'paid' ? '✓ DOCUMENT PAYÉ (REÇU)' : '⚠ EN ATTENTE DE RÈGLEMENT'}
           </div>
        </div>

        <div style={{ marginBottom: '4px' }}>
           <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#002878', margin: 0, letterSpacing: '-0.04em' }}>
              {currentQuote.status === 'paid' ? 'Facture' : 'Devis'} #{currentQuote.number}
           </h1>
        </div>
        
        <div style={{ height: '3px', backgroundColor: currentQuote.status === 'paid' ? '#10b981' : '#002878', width: '100%', marginBottom: '40px', marginTop: '20px' }}></div>

        <div style={{ display: 'flex', gap: '80px', marginBottom: '80px' }}>
           <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '11px', fontWeight: '900', color: '#002878', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Facturer à</p>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 16px 0' }}>{currentQuote.clients?.name}</h3>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', margin: '0 0 4px 0' }}>Chantier :</p>
              <p style={{ fontSize: '16px', color: '#334155', fontWeight: '700', margin: 0 }}>{currentQuote.clients?.address}</p>
              <p style={{ fontSize: '16px', color: '#334155', fontWeight: '700', margin: 0 }}>{currentQuote.clients?.city}</p>
           </div>
           <div style={{ width: '350px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignContent: 'start' }}>
              <div>
                 <p style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Date d'émission</p>
                 <p style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{new Date(currentQuote.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                 <p style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Validité</p>
                 <p style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{currentQuote.valid_until ? new Date(currentQuote.valid_until).toLocaleDateString() : '30 Jours'}</p>
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                 <p style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Paiement & Pénalités</p>
                 <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Virement ou Carte Bancaire</p>
                 <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Pénalités de retard : 3x taux légal + 40€ frais recouv.</p>
              </div>
           </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '60px' }}>
           <thead>
              <tr style={{ backgroundColor: '#002878', color: '#ffffff' }}>
                 <th style={{ textAlign: 'left', padding: '20px 30px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', borderRadius: '8px 0 0 0' }}>Désignation des prestations</th>
                 <th style={{ textAlign: 'center', padding: '20px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Qté</th>
                 <th style={{ textAlign: 'right', padding: '20px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>PU HT</th>
                 <th style={{ textAlign: 'right', padding: '20px 30px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', borderRadius: '0 8px 0 0' }}>Total HT</th>
              </tr>
           </thead>
           <tbody>
              {currentQuote.quote_items?.map((item: QuoteItem) => (
                 <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '30px' }}>
                       <p style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>{item.description}</p>
                       <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>Prestation certifiée ArtisanFlow - Finition premium.</p>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: '700', color: '#475569' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#475569' }}>{item.unit_price} €</td>
                    <td style={{ textAlign: 'right', paddingRight: '30px', fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{item.total_price} €</td>
                 </tr>
              ))}
           </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', gap: '30px' }}>
           <div style={{ flex: 1, display: 'flex', gap: '30px', alignItems: 'flex-end' }}>
              {currentQuote.artisan_signature_url && (
                 <div style={{ textAlign: 'left', flex: 1, backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Cachet & Signature Artisan</p>
                    <img 
                      src={currentQuote.artisan_signature_url} 
                      alt="Artisan Signature" 
                      crossOrigin="anonymous"
                      style={{ height: '60px', objectFit: 'contain', display: 'block' }} 
                    />
                 </div>
              )}
              {signature && (
                 <div style={{ textAlign: 'left', flex: 1, backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Bon Pour Accord (Client)</p>
                    <img 
                      src={signature} 
                      alt="Client Signature" 
                      crossOrigin="anonymous"
                      style={{ height: '60px', objectFit: 'contain', display: 'block' }} 
                    />
                 </div>
              )}
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <div style={{ width: '400px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
                 <span>Total Hors Taxes</span>
                 <span>{currentQuote.total_ht} €</span>
              </div>
              <div style={{ width: '400px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#64748b', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
                 <span>TVA (20%)</span>
                 <span>{(currentQuote.total_ht * 0.2).toFixed(2)} €</span>
              </div>
              <div style={{ width: '500px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '16px', fontWeight: '900', color: '#002878', textTransform: 'uppercase' }}>Net à Payer TTC</span>
                 <span style={{ fontSize: '48px', fontWeight: '900', color: '#002878' }}>{currentQuote.total_ttc} €</span>
              </div>
           </div>
        </div>

        <div style={{ marginTop: '80px', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', lineHeight: '1.8' }}>
              <div style={{ flex: 1.5 }}>
                 <p style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Informations Légales</p>
                 <p style={{ margin: 0 }}>{currentQuote.profiles?.company_name} - {currentQuote.profiles?.legal_form}</p>
                 <p style={{ margin: 0 }}>Siège Social : {currentQuote.profiles?.address}</p>
                 <p style={{ margin: 0 }}>SIRET : {currentQuote.profiles?.siret || 'En cours d\'immatriculation'}</p>
                 <p style={{ margin: 0 }}>{currentQuote.tax_rate === 0 ? "TVA non applicable, art. 293 B du CGI" : `N° TVA : ${currentQuote.profiles?.tva_intra || 'Non renseigné'}`}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Règlement</p>
                  <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>Virement ou Carte Bancaire</p>
                  <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>Merci d'indiquer la référence #{currentQuote.number} pour tout virement.</p>
               </div>
           </div>
           <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '9px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Offre valable jusqu'au {currentQuote.valid_until ? new Date(currentQuote.valid_until).toLocaleDateString() : '30 jours'} • Début estimé : {currentQuote.estimated_start_date ? new Date(currentQuote.estimated_start_date).toLocaleDateString() : 'À confirmer'} • Durée : {currentQuote.estimated_duration || 'Selon prestations'}
           </div>
        </div>
      </div>

      {/* 
        BARRE D'ACTIONS PUBLIQUES DYNAMIQUE 
      */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white z-50">
        <Button 
          variant="outline" 
          onClick={handleDownloadPdf} 
          isLoading={isGeneratingPdf}
          className="h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 border-slate-100 hover:bg-slate-50"
        >
          <Download size={20} /> Télécharger
        </Button>

        {/* Payment Button Removed from here as requested */}

        {isDone || signature || currentQuote.status === 'paid' ? (
          <div className="h-16 px-10 bg-green-500/10 border border-green-200 text-green-600 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs animate-in zoom-in duration-300">
            <CheckCircle2 size={24} /> Document Validé
          </div>
        ) : (
          <Button 
            onClick={() => setIsSigning(true)} 
            className="h-16 px-12 rounded-2xl bg-[#002878] hover:bg-slate-900 font-black uppercase tracking-widest text-xs gap-3 shadow-xl"
          >
            <PenTool size={20} /> Signer et Accepter
          </Button>
        )}
      </div>

      {isSigning && (
        <SignaturePad 
          onSave={handleSaveSignature} 
          onCancel={() => setIsSigning(false)} 
          isLoading={isSavingSignature}
        />
      )}
    </div>
  )
}
