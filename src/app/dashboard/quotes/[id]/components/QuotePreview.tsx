'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Quote } from '@/types/dashboard'
import { PenLine, Landmark, Check, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuotePreviewProps {
  quote: Quote
  onSignArtisan?: () => void
  isForPdf?: boolean
}

/**
 * 📄 QuotePreview - ArtisanFlow Professional Systems Template
 * High-fidelity A4 document based on the requested professional layout.
 */
export function QuotePreview({ quote, onSignArtisan, isForPdf }: QuotePreviewProps) {
  const profile = quote.profiles
  const client = quote.clients

  // Status mapping to French with specific contrast colors
  const STATUS_MAP: Record<string, { label: string, color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-600' },
    sent: { label: 'En attente', color: 'bg-orange-50 text-orange-700' },
    accepted: { label: 'Accepté / Signé', color: 'bg-emerald-50 text-emerald-700' },
    paid: { label: 'Payé', color: 'bg-indigo-50 text-indigo-700' },
    declined: { label: 'Refusé', color: 'bg-rose-50 text-rose-700' }
  }

  const statusInfo = STATUS_MAP[quote.status || 'draft']

  return (
    <Card className={cn(
      "border-none overflow-hidden bg-white flex flex-col min-h-[297mm]",
      isForPdf ? "shadow-none" : "shadow-2xl"
    )}>
      {/* 🔵 TOP ACCENT LINE */}
      <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
      
      <div className="p-12 md:p-16 flex flex-col flex-1">
        {/* 🏢 HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                <Landmark className="text-white" size={24} />
              </div>
              <span className="text-3xl font-black text-primary tracking-tighter uppercase italic">
                ArtisanFlow
              </span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 pl-16">
              Professional Systems
            </div>
          </div>

          <div className="text-right space-y-1">
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{profile?.company_name || 'Votre Entreprise'}</h3>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest space-y-0.5">
               <p>SIRET : {profile?.siret || '842 153 967 00012'}</p>
               <p className="whitespace-pre-line leading-relaxed">{profile?.address || '14 Rue de la Forge, 69002 Lyon'}</p>
               <p className="text-primary pt-1 font-black">{profile?.phone || '+33 4 72 41 00 00'}</p>
            </div>
          </div>
        </header>

        {/* 📋 DOCUMENT CATEGORY & STATUS */}
        <div className="mb-14 flex flex-col md:flex-row justify-between items-end border-b-4 border-primary pb-6">
          <div>
            <h1 className="text-5xl font-black text-primary tracking-tighter uppercase italic">
              Devis <span className="text-slate-200">/</span> #{quote.number}
            </h1>
            <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">
              Référence : {`PROJET-${quote.id.substring(0, 4).toUpperCase()}`}
            </p>
          </div>
          <div className={cn(
             "px-6 py-2.5 rounded-2xl border-l-4 font-black text-xs uppercase tracking-[0.2em]",
             statusInfo.color,
             "border-current shadow-sm"
          )}>
            Statut : {statusInfo.label}
          </div>
        </div>

        {/* 👥 DESTINATION & DATES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">
              Destinataire du document
            </span>
            <h4 className="font-black text-2xl text-slate-900 tracking-tight">{client?.name || 'Nom du Client'}</h4>
            <div className="text-sm text-slate-500 font-medium leading-relaxed italic">
               <p>{client?.address || 'Adresse de chantier'}</p>
               <p>{client?.postal_code} {client?.city}</p>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-5 px-8">
            <div className="flex justify-between items-baseline border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date d'émission</span>
              <span className="text-sm font-black text-slate-900 tracking-tight">{new Date(quote.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date de validité</span>
              <span className="text-sm font-black text-slate-900 tracking-tight">
                {quote.valid_until 
                  ? new Date(quote.valid_until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '30 Jours'
                }
              </span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paiement</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Virement bancaire</span>
            </div>
          </div>
        </div>

        {/* 🏗️ ITEMS TABLE */}
        <div className="flex-1 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-tl-2xl">Désignation des prestations</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Qté</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Unité</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Unit. HT</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right rounded-tr-2xl">Total HT</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {quote.quote_items?.map((item, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="font-black text-slate-900 text-base mb-1 tracking-tight">{item.description}</p>
                    <p className="text-xs text-slate-400 italic font-medium">Prestation de service certifiée ArtisanFlow.</p>
                  </td>
                  <td className="px-4 py-5 text-center font-black text-slate-600 font-mono italic">{(item.quantity ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-5 text-center font-bold text-slate-400 uppercase text-[10px] tracking-widest">Pce</td>
                  <td className="px-4 py-5 text-right font-bold text-slate-600 font-mono italic">{(item.unit_price ?? 0).toLocaleString('fr-FR')} €</td>
                  <td className="px-6 py-5 text-right font-black text-slate-900 font-mono text-base italic">{(item.total_price ?? 0).toLocaleString('fr-FR')} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 💰 TOTALS SECTION */}
        <div className="flex justify-end mt-12 pb-16">
          <div className="w-80 space-y-4 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
              <span>Total HT</span>
              <span className="font-mono text-sm text-slate-900">{(quote.total_ht ?? 0).toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
              <span>TVA (20%)</span>
              <span className="font-mono text-sm text-slate-900">{((quote.total_ttc ?? 0) - (quote.total_ht ?? 0)).toLocaleString('fr-FR')} €</span>
            </div>
            <div className="pt-4 border-t-2 border-primary flex justify-between items-center">
              <span className="text-sm font-black uppercase tracking-tighter text-primary">Net à Payer</span>
              <span className="text-3xl font-black text-primary tracking-tighter font-mono italic">
                {(quote.total_ttc ?? 0).toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
        </div>

        {/* ✍️ SIGNATURES (Integrated for Professional workflow) */}
        <div className="grid grid-cols-2 gap-16 border-t-2 border-dashed border-slate-200 pt-12 mt-auto">
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center">
                   <Check size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Validation de l'Artisan</span>
             </div>
             <div 
              onClick={quote.artisan_signature_url ? undefined : onSignArtisan}
              className={cn(
                "h-44 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all group relative overflow-hidden",
                quote.artisan_signature_url 
                  ? "bg-slate-50/50 border-slate-200" 
                  : "bg-primary/5 border-primary/20 hover:bg-white hover:border-primary/40 cursor-pointer"
              )}
             >
                {quote.artisan_signature_url ? (
                  <img src={quote.artisan_signature_url} alt="Sign Artisan" className="max-h-[80%] max-w-[80%] mix-blend-multiply transition-transform group-hover:scale-110" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-primary opacity-40">
                    <PenLine size={24} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Cliquer pour signer</span>
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-4 text-right">
             <div className="flex items-center gap-2 mb-2 justify-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bon pour accord : Signé par le client</span>
                <div className="w-6 h-6 bg-slate-100 text-slate-400 rounded flex items-center justify-center">
                   <User size={14} />
                </div>
             </div>
             <div className="h-44 rounded-3xl border-2 border-slate-50 bg-slate-50/30 flex items-center justify-center transition-all overflow-hidden">
                {quote.client_signature_url ? (
                  <img src={quote.client_signature_url} alt="Sign Client" className="max-h-[80%] max-w-[80%] mix-blend-multiply transition-transform hover:scale-110" />
                ) : (
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Attente Signature Client</span>
                )}
             </div>
          </div>
        </div>

        {/* 🏦 FOOTER LEGAL INFO */}
        <footer className="mt-16 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-12 text-[10px] uppercase font-bold tracking-widest text-slate-400 leading-normal">
            <div>
               <p className="text-primary font-black mb-1 leading-none">Informations Légales</p>
               <p>Assurance Décennale : AXA n°1029384756.</p>
               <p>
                 {quote.tax_rate === 0 
                   ? "TVA non applicable, art. 293 B du CGI" 
                   : `N° TVA Intracommunautaire : ${profile?.tva_intra || 'FR842153967'}`
                 }
               </p>
            </div>
            <div className="text-right">
               <p className="text-primary font-black mb-1 leading-none">Coordonnées Bancaires</p>
               <p>IBAN : FR76 3000 2005 5512 3456 7890 123</p>
               <p>BIC : AGRIFRPPXXX</p>
            </div>
          </div>
        </footer>
      </div>
    </Card>
  )
}
