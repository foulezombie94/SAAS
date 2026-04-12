import React from 'react'
import { Quote } from '@/types/dashboard'

interface PdfTemplateProps {
  quote: Quote
}

/**
 * 📄 PDF Template - Optimized for high-visibility and capture
 * Dual Signature Version
 */
export function PdfTemplate({ quote }: PdfTemplateProps) {
  const profile = quote.profiles
  const client = quote.clients

  return (
    <div id="pdf-template" className="bg-white p-8 text-[#0f172a]" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-8">
          <div className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl inline-block font-black text-3xl uppercase tracking-tighter shadow-xl">
             {profile?.company_name?.split(' ')[0] || 'AF'}.FLOW
          </div>
          <div className="text-sm space-y-2">
            <h3 className="font-black text-[#0f172a] text-xl">{profile?.company_name}</h3>
            <p className="text-[#475569] font-medium whitespace-pre-line leading-relaxed max-w-sm">
              {profile?.legal_form && <span className="font-black text-[#0f172a] block">{profile.legal_form}</span>}
              {profile?.address}
            </p>
            <div className="pt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-bold text-[#475569] text-xs">
              <p>SIRET : <span className="text-[#0f172a]">{profile?.siret || 'Non renseigné'}</span></p>
              <p>TVA : <span className="text-[#0f172a]">{profile?.tva_intra || 'Non renseigné'}</span></p>
              <p>Email : <span className="text-[#0f172a]">{profile?.email}</span></p>
              <p>Tél : <span className="text-[#0f172a]">{profile?.phone}</span></p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black mb-2 uppercase text-[#0f172a] tracking-tighter opacity-10">DOCUMENT</h2>
          <h2 className="text-4xl font-black mb-1 uppercase text-[#0f172a] tracking-tight">Devis</h2>
          <p className="text-2xl font-black text-[#4f46e5] bg-[#eef2ff] px-3 py-1 rounded-xl inline-block mt-1">#{quote.number}</p>
          <div className="mt-8 text-xs space-y-2 font-bold uppercase tracking-widest text-[#94a3b8]">
            <p>Date d'émission : {new Date(quote.created_at).toLocaleDateString('fr-FR')}</p>
            {quote.valid_until && (
              <p>Date d'expiration : {new Date(quote.valid_until).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="h-1 bg-[#f1f5f9] w-full mb-10 rounded-full" />

      {/* CLIENT & OBJECT INFO */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-[#f8fafc] p-5 rounded-[1rem] border-2 border-[#f1f5f9]">
          <p className="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.2em] mb-4">Destinataire</p>
          <div className="space-y-1">
            <p className="font-black text-xl text-[#0f172a]">{client?.name}</p>
            <p className="text-[#64748b] text-md font-medium leading-tight">{client?.address}</p>
            <p className="text-[#64748b] text-md font-medium">{client?.city} {client?.postal_code}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center border-l-[4px] border-[#4f46e5] pl-6">
           <p className="text-[#94a3b8] text-[9px] font-black uppercase tracking-[0.2em] mb-1">Votre Prestataire</p>
           <p className="text-lg font-black text-[#0f172a] leading-tight mb-1">{profile?.company_name || 'Artisan Flow'}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="rounded-[1.5rem] border-2 border-[#f1f5f9] overflow-hidden mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0f172a]">
              <th className="py-6 px-10 text-xs uppercase font-black text-[#94a3b8] text-left tracking-[0.2em]">Description</th>
              <th className="py-6 px-6 text-xs uppercase font-black text-[#94a3b8] text-center tracking-[0.2em]">Qté</th>
              <th className="py-6 px-6 text-xs uppercase font-black text-[#94a3b8] text-right tracking-[0.2em]">P.U HT</th>
              <th className="py-6 px-10 text-xs uppercase font-black text-[#94a3b8] text-right tracking-[0.2em]">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#f1f5f9]">
            {quote.quote_items?.map((item) => (
              <tr key={item.id} className="bg-white">
                <td className="py-4 px-8">
                  <p className="font-black text-[#0f172a] text-md mb-0.5">{item.description}</p>
                </td>
                <td className="py-4 px-6 text-center font-black text-[#475569] text-md">{item.quantity}</td>
                <td className="py-4 px-6 text-right font-black text-[#475569] text-md">{item.unit_price.toLocaleString('fr-FR')} €</td>
                <td className="py-4 px-8 text-right font-black text-[#0f172a] text-lg">{(item.total_ht ?? (item.quantity * item.unit_price)).toLocaleString('fr-FR')} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS & PAYMENT SECTION */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="bg-[#f8fafc] p-6 rounded-[1.5rem] border-2 border-[#f1f5f9] flex flex-col justify-center">
          <p className="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.2em] mb-4">Coordonnées Bancaires (Règlement)</p>
          {profile?.iban ? (
            <div className="space-y-2">
              <p className="text-xs font-black text-[#0f172a] uppercase tracking-wider">{profile.bank_name || 'RIB / SWIFT'}</p>
              <p className="font-mono text-[10px] text-[#475569] bg-white p-2 rounded-lg border border-[#e2e8f0] break-all">{profile.iban}</p>
              <p className="text-[10px] font-bold text-[#64748b]">BIC : {profile.bic || 'N/A'}</p>
            </div>
          ) : (
             <p className="text-[10px] font-bold text-[#ef4444]">Aucune coordonnée bancaire renseignée dans les réglages.</p>
          )}
          <p className="mt-4 text-[9px] font-bold text-[#64748b] italic">ⓘ Veuillez indiquer le numéro de devis #{quote.number} dans l'objet de votre virement.</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[#94a3b8] uppercase text-xs font-black tracking-widest">Total HT</span>
            <span className="font-black text-xl text-[#475569]">{quote.total_ht.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between items-center pb-6 border-b-2 border-[#f1f5f9]">
            <span className="text-[#94a3b8] uppercase text-xs font-black tracking-widest">TVA ({quote.tax_rate}%)</span>
            <span className="font-black text-xl text-[#475569]">{(quote.total_ttc - quote.total_ht).toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-black uppercase text-xs tracking-[0.2em] text-[#0f172a]">Net à Payer TTC</span>
            <span className="text-5xl font-black text-[#4f46e5]">
              {quote.total_ttc.toLocaleString('fr-FR')} <span className="text-2xl ml-1">€</span>
            </span>
          </div>
        </div>
      </div>

      {/* SIGNATURES - MAXIMUM VISIBILITY */}
      <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-dashed border-[#f1f5f9]">
        <div className="space-y-3">
          <p className="text-[#94a3b8] uppercase text-[8px] font-black tracking-[0.2em] text-center mb-1">Signature Artisan</p>
          <div className="h-32 bg-[#f8fafc] rounded-[1rem] border-2 border-[#e2e8f0] flex items-center justify-center overflow-hidden relative">
            <div className="absolute top-2 left-4 bg-[#4f46e5]/10 text-[#4f46e5] text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Certifié</div>
            {quote.artisan_signature_url ? (
               <img 
                 src={quote.artisan_signature_url} 
                 alt="Signature Artisan" 
                 crossOrigin="anonymous"
                 className="max-h-[85%] max-w-[85%] object-contain" 
               />
            ) : (
               <div className="flex flex-col items-center gap-1 opacity-20">
                 <div className="w-8 h-8 border-2 border-dashed border-[#cbd5e1] rounded-full" />
                 <span className="text-[#cbd5e1] font-bold text-[8px]">ATTENTE</span>
               </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[#94a3b8] uppercase text-[8px] font-black tracking-[0.2em] text-center mb-1">Signature Client</p>
          <div className="h-32 bg-[#f8fafc] rounded-[1rem] border-2 border-[#e2e8f0] flex items-center justify-center overflow-hidden relative">
            <div className="absolute top-2 right-4 bg-emerald-100 text-emerald-600 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Accord</div>
            {quote.client_signature_url ? (
               <img 
                 src={quote.client_signature_url} 
                 alt="Signature Client" 
                 crossOrigin="anonymous"
                 className="max-h-[85%] max-w-[85%] object-contain" 
               />
            ) : (
               <div className="flex flex-col items-center gap-1 opacity-20">
                 <div className="w-8 h-8 border-2 border-dashed border-[#cbd5e1] rounded-full" />
                 <span className="text-[#cbd5e1] font-bold text-[8px]">ATTENTE</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER - LEGAL MENTIONS */}
      <div className="mt-20 pt-8 border-t-2 border-[#f1f5f9] text-center">
         <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-[0.2em] leading-loose">
           {profile?.company_name} - {profile?.legal_form} au capital de [Capital] - SIRET : {profile?.siret} <br/>
           {quote.tax_rate === 0 ? "TVA non applicable, art. 293 B du CGI" : `N° TVA Intracommunautaire : ${profile?.tva_intra || 'Non renseigné'}`} <br/>
           Offre valable pendant 30 jours à compter de la date d'émission.
         </p>
      </div>
    </div>
  )
}
