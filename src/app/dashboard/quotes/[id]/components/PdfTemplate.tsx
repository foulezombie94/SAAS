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
    <div id="pdf-template" className="bg-white p-20 text-[#0f172a]" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-20">
        <div className="space-y-8">
          <div className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl inline-block font-black text-3xl uppercase tracking-tighter shadow-xl">
             {profile?.company_name?.split(' ')[0] || 'AF'}.FLOW
          </div>
          <div className="text-sm space-y-2">
            <h3 className="font-black text-[#0f172a] text-xl">{profile?.company_name}</h3>
            <p className="text-[#475569] font-medium whitespace-pre-line leading-relaxed max-w-sm">{profile?.address}</p>
            <div className="pt-4 space-y-1 font-bold text-[#1e293b]">
              <p>Email : {profile?.email}</p>
              <p>Mobile : {profile?.phone}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-6xl font-black mb-4 uppercase text-[#0f172a] tracking-tighter opacity-10">DOCUMENT</h2>
          <h2 className="text-5xl font-black mb-2 uppercase text-[#0f172a] tracking-tight">Devis</h2>
          <p className="text-3xl font-black text-[#4f46e5] bg-[#eef2ff] px-4 py-1 rounded-xl inline-block mt-2">#{quote.number}</p>
          <div className="mt-8 text-xs space-y-2 font-bold uppercase tracking-widest text-[#94a3b8]">
            <p>Date d'émission : {new Date(quote.created_at).toLocaleDateString('fr-FR')}</p>
            {quote.valid_until && (
              <p>Date d'expiration : {new Date(quote.valid_until).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="h-1 bg-[#f1f5f9] w-full mb-16 rounded-full" />

      {/* CLIENT & OBJECT INFO */}
      <div className="grid grid-cols-2 gap-16 mb-20">
        <div className="bg-[#f8fafc] p-10 rounded-[2.5rem] border-2 border-[#f1f5f9]">
          <p className="text-[#94a3b8] text-xs font-black uppercase tracking-[0.2em] mb-6">Destinataire</p>
          <div className="space-y-2">
            <p className="font-black text-2xl text-[#0f172a]">{client?.name}</p>
            <p className="text-[#64748b] text-lg font-medium whitespace-pre-line leading-relaxed">{client?.address}</p>
            <p className="text-[#64748b] text-lg font-medium">{client?.city} {client?.postal_code}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center border-l-[6px] border-[#4f46e5] pl-10">
           <p className="text-[#94a3b8] text-xs font-black uppercase tracking-[0.2em] mb-4">Désignation du projet</p>
           <p className="text-2xl font-black text-[#0f172a] leading-tight mb-2">Prestation de Services & Installation Professionnelle</p>
           <p className="text-lg text-[#4f46e5] font-black italic">Référence Dossier : #{quote.number}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="rounded-[2.5rem] border-2 border-[#f1f5f9] overflow-hidden mb-16">
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
                <td className="py-8 px-10">
                  <p className="font-black text-[#0f172a] text-lg mb-1">{item.description}</p>
                </td>
                <td className="py-8 px-6 text-center font-black text-[#475569] text-lg">{item.quantity}</td>
                <td className="py-8 px-6 text-right font-black text-[#475569] text-lg">{item.unit_price.toLocaleString('fr-FR')} €</td>
                <td className="py-8 px-10 text-right font-black text-[#0f172a] text-xl">{(item.total_ht ?? (item.quantity * item.unit_price)).toLocaleString('fr-FR')} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS SECTION */}
      <div className="flex justify-end mb-24 pr-10">
        <div className="w-96 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[#94a3b8] uppercase text-xs font-black tracking-widest">Total Hors Taxes</span>
            <span className="font-black text-xl text-[#475569]">{quote.total_ht.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between items-center pb-6 border-b-2 border-[#f1f5f9]">
            <span className="text-[#94a3b8] uppercase text-xs font-black tracking-widest">TVA ({quote.tax_rate}%)</span>
            <span className="font-black text-xl text-[#475569]">{(quote.total_ttc - quote.total_ht).toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="font-black uppercase text-xs tracking-[0.2em] text-[#0f172a]">Net à Payer TTC</span>
            <span className="text-5xl font-black text-[#4f46e5]">
              {quote.total_ttc.toLocaleString('fr-FR')} <span className="text-2xl ml-1">€</span>
            </span>
          </div>
        </div>
      </div>

      {/* SIGNATURES - MAXIMUM VISIBILITY */}
      <div className="grid grid-cols-2 gap-20 pt-20 border-t-4 border-dashed border-[#f1f5f9]">
        <div className="space-y-8">
          <p className="text-[#94a3b8] uppercase text-[10px] font-black tracking-[0.3em] text-center mb-4">Cachet & Signature Artisan</p>
          <div className="h-64 bg-[#f8fafc] rounded-[2.5rem] border-4 border-[#e2e8f0] flex items-center justify-center overflow-hidden relative shadow-inner group">
            <div className="absolute top-4 left-6 bg-[#4f46e5]/10 text-[#4f46e5] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Validation Professionnelle</div>
            {quote.artisan_signature_url ? (
               <img src={quote.artisan_signature_url} alt="Signature Artisan" className="max-h-[85%] max-w-[85%] object-contain mix-blend-multiply scale-150 transition-transform duration-500" />
            ) : (
               <div className="flex flex-col items-center gap-3 opacity-20">
                 <div className="w-16 h-16 border-4 border-dashed border-[#cbd5e1] rounded-full" />
                 <span className="italic text-[#cbd5e1] font-bold text-xs uppercase tracking-widest text-center">EN ATTENTE ARTISAN</span>
               </div>
            )}
          </div>
        </div>
        <div className="space-y-8">
          <p className="text-[#94a3b8] uppercase text-[10px] font-black tracking-[0.3em] text-center mb-4">Acceptation Client ("Bon pour accord")</p>
          <div className="h-64 bg-[#f8fafc] rounded-[2.5rem] border-4 border-[#e2e8f0] flex items-center justify-center overflow-hidden relative shadow-inner">
            <div className="absolute top-4 right-6 bg-emerald-100 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Accord Numérique Certifié</div>
            {quote.client_signature_url ? (
               <img src={quote.client_signature_url} alt="Signature Client" className="max-h-[85%] max-w-[85%] object-contain mix-blend-multiply scale-150" />
            ) : (
               <div className="flex flex-col items-center gap-3 opacity-20">
                 <div className="w-16 h-16 border-4 border-dashed border-[#cbd5e1] rounded-full" />
                 <span className="italic text-[#cbd5e1] font-bold text-xs uppercase tracking-widest text-center">EN ATTENTE CLIENT</span>
               </div>
            )}
            <div className="absolute bottom-4 right-8 text-[7px] text-[#cbd5e1] font-black uppercase tracking-[0.2em]">AF-HASH: {quote.id.split('-')[0].toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* FOOTER - LEGAL MENTIONS */}
      <div className="mt-28 pt-10 border-t-2 border-[#f1f5f9] text-center">
         <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-[0.3em] leading-loose">
           ArtisanFlow SaaS - Gestion Professionnelle simplifiée <br/>
           Auto-entrepreneur exonéré de TVA (Art. 293B du CGI) <br/>
           Valable 30 jours à compter de l'émission
         </p>
      </div>
    </div>
  )
}
