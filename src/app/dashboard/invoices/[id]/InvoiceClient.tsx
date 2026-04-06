'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  ChevronLeft, 
  Receipt, 
  User, 
  Calendar, 
  ShieldCheck, 
  Download, 
  Send, 
  CreditCard,
  History,
  AlertCircle,
  Copy,
  ExternalLink,
  Ban,
  MapPin,
  TrendingUp,
  FileBadge,
  Loader
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface InvoiceClientProps {
  invoice: any
}

export function InvoiceClient({ invoice }: InvoiceClientProps) {
  const router = useRouter()
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    const printElement = document.getElementById('pdf-template')
    if (!printElement) return
    setIsGeneratingPdf(true)

    try {
      // Importation dynamique pour réduire le bundle initial (Audit Quick Win)
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(printElement, {
        scale: 4,
        useCORS: true,
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
      pdf.save(`ArtisanFlow_Facture_${invoice.number}.pdf`)
      toast.success("Facture PDF générée !")
    } catch (error) {
      console.error(error)
      toast.error("Erreur génération PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="space-y-10 pb-32">
      {/* 
        HIDDEN PDF TEMPLATE 
      */}
      <div id="pdf-template" style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '1000px',
        padding: '80px',
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        color: '#1e293b'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '80px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#002878', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0' }}>ARTISANFLOW</h2>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Document Certifié Professionnel</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '14px', color: '#64748b' }}>
            <p style={{ margin: 0 }}>Référence : {invoice.number}</p>
            <p style={{ margin: 0 }}>Émis le {new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#002878', margin: '0 0 40px 0', letterSpacing: '-0.04em' }}>FACTURE</h1>

        {/* Client Box */}
        <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '60px' }}>
          <p style={{ fontSize: '11px', fontWeight: '900', color: '#002878', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Facturé à</p>
          <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 16px 0' }}>{invoice.clients?.name}</h3>
          <p style={{ fontSize: '16px', color: '#334155', fontWeight: '700', margin: 0 }}>{invoice.clients?.address || 'Non renseigné'}</p>
          <p style={{ fontSize: '16px', color: '#334155', fontWeight: '700', margin: 0 }}>{invoice.clients?.postal_code} {invoice.clients?.city}</p>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '60px' }}>
          <thead>
            <tr style={{ backgroundColor: '#002878', color: '#ffffff' }}>
              <th style={{ textAlign: 'left', padding: '20px 30px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Désignation</th>
              <th style={{ textAlign: 'center', padding: '20px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Qté</th>
              <th style={{ textAlign: 'right', padding: '20px 30px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.invoice_items || []).map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '30px', fontSize: '18px', fontWeight: '800' }}>{item.description}</td>
                <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: '700' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', paddingRight: '30px', fontSize: '18px', fontWeight: '900' }}>{Number(item.total_price).toLocaleString('fr-FR')} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          <div style={{ width: '400px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
            <span>Total Hors Taxes</span>
            <span>{Number(invoice.total_ht).toLocaleString('fr-FR')} €</span>
          </div>
          <div style={{ width: '500px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px', backgroundColor: '#002878', borderRadius: '16px', color: '#ffffff' }}>
            <span style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>Total TTC PAYÉ</span>
            <span style={{ fontSize: '48px', fontWeight: '900' }}>{Number(invoice.total_ttc).toLocaleString('fr-FR')} €</span>
          </div>
        </div>
        
        <p style={{ marginTop: '100px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
          Facture acquittée. Merci de votre confiance.<br/>
          ArtisanFlow - Système de facturation certifié.
        </p>
      </div>

      {/* Main UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/dashboard/invoices" className="flex items-center gap-2 text-[0.6875rem] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors mb-2">
            <ChevronLeft size={14} /> Retour à la liste
          </Link>
          <div className="flex items-center gap-4">
             <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">{invoice.number}</h1>
             <div className={`px-4 py-1.5 h-10 flex items-center rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-emerald-100 text-emerald-700`}>
                ✓ RÉGLÉ & ARCHIVÉ
              </div>
          </div>
          <p className="text-on-surface-variant font-bold mt-2 uppercase tracking-widest text-[10px] opacity-60 flex items-center gap-2">
             <Calendar size={14} /> Émis le {new Date(invoice.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <Button 
            variant="tertiary" 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-14 px-8 font-black uppercase tracking-widest text-xs gap-3 bg-[#002878] text-white hover:bg-slate-900"
           >
              {isGeneratingPdf ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
              Télécharger PDF
           </Button>
           {invoice.profiles?.is_pro && (
             <Button className="h-14 px-10 font-black uppercase tracking-widest text-xs gap-3 shadow-lg">
                <Send size={20} /> Envoyer au client
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-10 border-none shadow-diffused bg-white space-y-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                    <User size={20} />
                 </div>
                 <h3 className="text-xl font-black text-primary uppercase tracking-tighter">Client Destinataire</h3>
              </div>
              <div>
                 <p className="text-2xl font-black text-primary uppercase tracking-tighter">{invoice.clients?.name}</p>
                 <p className="text-sm font-bold text-on-surface-variant flex items-center gap-2 mt-2">
                    <AlertCircle size={16} /> {invoice.clients?.email}
                 </p>
                 <p className="text-sm font-bold text-on-surface-variant flex items-center gap-2 mt-1">
                    <MapPin size={16} /> {invoice.clients?.address || invoice.clients?.city}
                 </p>
              </div>
            </Card>

            <Card className="p-10 border-none shadow-diffused bg-emerald-50/50 border border-emerald-100 space-y-8">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                    <ShieldCheck size={20} />
                 </div>
                 <h3 className="text-xl font-black text-emerald-700 uppercase tracking-tighter">Paiement Sécurisé</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    ✓ TRANSACTION VALIDÉE VIA STRIPE
                 </div>
                 <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    Cette facture a été réglée par carte bancaire. Les fonds sont sécurisés et certifiés.
                 </p>
              </div>
            </Card>
          </div>

          <section className="bg-white p-10 rounded-2xl shadow-diffused border border-outline-variant/10">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter mb-10 flex items-center gap-3">
               <Receipt size={24} /> Détail de la Facture
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-8 pb-4 border-b border-slate-100 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/30 px-4">
                <div className="col-span-8">Prestation</div>
                <div className="col-span-4 text-right">Total HT</div>
              </div>

              {(invoice.invoice_items || []).map((item: any) => (
                <div key={item.id} className="grid grid-cols-12 gap-8 px-4 py-2 items-center">
                  <div className="col-span-8 font-bold text-primary uppercase text-sm">{item.description}</div>
                  <div className="col-span-4 text-right font-black text-primary">{Number(item.total_price).toLocaleString('fr-FR')}€</div>
                </div>
              ))}

              <div className="mt-10 pt-10 border-t-4 border-primary/5 flex flex-col items-end gap-3 px-4">
                 <div className="flex justify-between w-64 text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest">
                    <span>Total Net HT</span>
                    <span>{Number(invoice.total_ht).toLocaleString('fr-FR')} €</span>
                 </div>
                 <div className="flex justify-between w-80 mt-4 bg-[#002878] text-white p-8 rounded-3xl shadow-xl shadow-blue-900/20">
                    <span className="font-black uppercase tracking-widest text-xs opacity-60">Total TTC PAYÉ</span>
                    <span className="text-4xl font-black tracking-tighter leading-none">{Number(invoice.total_ttc).toLocaleString('fr-FR')} €</span>
                 </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-24">
          <Card className="p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 opacity-10">
                <ShieldCheck size={180} />
             </div>
             
             <h4 className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-40 mb-10 relative z-10">Etat de la Facture</h4>
             
             <div className="space-y-6 relative z-10">
                <Button className="w-full h-16 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-emerald-500/20" disabled>
                   <CheckCircle2 size={20} /> Facture Payée
                </Button>
                
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={handleDownloadPdf} className="h-16 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
                      <Download size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
                   </button>
                   <button className="h-16 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
                      <History size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Historique</span>
                   </button>
                </div>
             </div>
          </Card>

          <Card className="p-8 bg-white border-none flex flex-col items-center text-center gap-4 shadow-xl">
             <TrendingUp className="text-primary/20" size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 leading-relaxed">
                Ce document constitue une preuve de paiement certifiée et ne peut plus être modifié.
             </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CheckCircle2({ size, className }: { size: number, className?: string }) {
    return (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
}
