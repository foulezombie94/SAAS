import React from 'react'
import { Quote } from '@/types/dashboard'
import Image from 'next/image'

interface PdfTemplateProps {
  quote: Quote
  signature: string | null
}

/**
 * 📄 PDF Template - Optimized for html2canvas
 * Uses simple HEX colors and standard layouts to avoid capture issues.
 */
export function PdfTemplate({ quote, signature }: PdfTemplateProps) {
  const profile = quote.profiles
  const client = quote.clients

  return (
    <div id="pdf-template" className="bg-white p-16 text-[#1e293b]" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-16">
        <div className="space-y-6">
          <div className="bg-[#0f172a] text-white px-6 py-3 rounded-lg inline-block font-bold text-2xl uppercase tracking-tighter">
             {profile?.company_name?.split(' ')[0] || 'AF'}.FLOW
          </div>
          <div className="text-sm space-y-1">
            <h3 className="font-bold text-[#0f172a] text-lg">{profile?.company_name}</h3>
            <p className="text-[#64748b] whitespace-pre-line leading-relaxed">{profile?.address}</p>
            <div className="pt-2 space-y-0.5 font-medium">
              <p>Email: {profile?.email}</p>
              <p>Tél: {profile?.phone}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black mb-4 uppercase text-[#0f172a] tracking-tight">Devis</h2>
          <p className="text-2xl font-bold text-[#4f46e5]">#{quote.number}</p>
          <div className="mt-6 text-sm space-y-1 font-medium">
            <p><span className="text-[#94a3b8] uppercase text-[10px] font-bold tracking-widest mr-2">Émis le :</span> {new Date(quote.created_at).toLocaleDateString('fr-FR')}</p>
            {quote.valid_until && (
              <p><span className="text-[#94a3b8] uppercase text-[10px] font-bold tracking-widest mr-2">Valable jusqu'au :</span> {new Date(quote.valid_until).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e2e8f0] w-full mb-12" />

      {/* CLIENT & OBJECT INFO */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div className="bg-[#f8fafc] p-8 rounded-2xl border border-[#f1f5f9]">
          <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-4">Destinataire</p>
          <div className="space-y-1">
            <p className="font-bold text-lg text-[#0f172a]">{client?.name}</p>
            <p className="text-[#64748b] whitespace-pre-line leading-relaxed">{client?.address}</p>
            <p className="text-[#64748b]">{client?.city} {client?.postal_code}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center border-l-4 border-[#4f46e5] pl-8">
           <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-2">Objet de la prestation</p>
           <p className="text-lg font-bold text-[#0f172a] leading-tight">Installation & Main d'œuvre professionnelle</p>
           <p className="text-sm text-[#4f46e5] font-bold mt-1 italic">Chantier référence #{quote.number}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="bg-[#f8fafc] border-b-2 border-[#0f172a]">
            <th className="py-4 px-4 text-[10px] uppercase font-bold text-[#64748b] text-left tracking-widest">Désignation</th>
            <th className="py-4 px-4 text-[10px] uppercase font-bold text-[#64748b] text-center tracking-widest">Qté</th>
            <th className="py-4 px-4 text-[10px] uppercase font-bold text-[#64748b] text-right tracking-widest">Unit. HT</th>
            <th className="py-4 px-4 text-[10px] uppercase font-bold text-[#64748b] text-right tracking-widest">Total HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {quote.quote_items?.map((item) => (
            <tr key={item.id}>
              <td className="py-6 px-4">
                <p className="font-bold text-[#0f172a]">{item.description}</p>
              </td>
              <td className="py-6 px-4 text-center font-bold text-[#475569]">{item.quantity}</td>
              <td className="py-6 px-4 text-right font-bold text-[#475569]">{item.unit_price.toLocaleString('fr-FR')} €</td>
              <td className="py-6 px-4 text-right font-bold text-[#0f172a]">{(item.total_ht ?? (item.quantity * item.unit_price)).toLocaleString('fr-FR')} €</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="flex justify-end mb-20 px-4">
        <div className="w-80 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#94a3b8] uppercase text-[10px] font-bold tracking-widest">Total Hors Taxes</span>
            <span className="font-bold text-[#475569]">{quote.total_ht.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between items-center text-sm pb-4 border-b border-[#f1f5f9]">
            <span className="text-[#94a3b8] uppercase text-[10px] font-bold tracking-widest">TVA ({quote.tax_rate}%)</span>
            <span className="font-bold text-[#475569]">{(quote.total_ttc - quote.total_ht).toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="font-bold uppercase text-[10px] tracking-widest text-[#0f172a]">Montant Total TTC</span>
            <span className="text-4xl font-black text-[#4f46e5]">
              {quote.total_ttc.toLocaleString('fr-FR')} <span className="text-xl">€</span>
            </span>
          </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="grid grid-cols-2 gap-16 pt-16 border-t-2 border-dashed border-[#e2e8f0]">
        <div className="space-y-6">
          <p className="text-[#94a3b8] uppercase text-[10px] font-bold tracking-widest">Cachet & Signature Artisan</p>
          <div className="h-40 bg-[#f8fafc] rounded-2xl border border-dashed border-[#cbd5e1] flex items-center justify-center italic text-[#cbd5e1]">
             Bon pour accord
          </div>
        </div>
        <div className="space-y-6 text-right">
          <p className="text-[#94a3b8] uppercase text-[10px] font-bold tracking-widest">Signature Client (Bon pour accord)</p>
          <div className="h-40 bg-[#f8fafc] rounded-2xl border border-dashed border-[#cbd5e1] flex items-center justify-center overflow-hidden">
            {signature ? (
               <img src={signature} alt="Signature" className="max-h-[80%] max-w-[80%] object-contain mix-blend-multiply" />
            ) : (
               <span className="italic text-[#cbd5e1]">En attente de signature</span>
            )}
          </div>
        </div>
      </div>

      {/* MENTIONS LEGALES */}
      <div className="mt-24 pt-8 border-t border-[#f1f5f9] text-center">
         <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-[0.2em] leading-relaxed">
           Auto-entrepreneur exonéré de TVA (Art. 293B du CGI) <br/>
           SIRET : {profile?.company_name} - Valable 30 jours
         </p>
      </div>
    </div>
  )
}
