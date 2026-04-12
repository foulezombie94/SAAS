import React from 'react'
import { Quote } from '@/types/dashboard'
import Image from 'next/image'

interface PdfTemplateProps {
  quote: Quote
  signature: string | null
}

export function PdfTemplate({ quote, signature }: PdfTemplateProps) {
  const profile = quote.profiles
  const client = quote.clients

  return (
    <div id="pdf-template" className="bg-white p-12 text-slate-900" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-4">
          <div className="bg-slate-900 text-white px-4 py-2 rounded inline-block font-bold text-xl">
             {profile?.company_name?.split(' ')[0] || 'AF'}.FLOW
          </div>
          <div className="text-sm space-y-1">
            <h3 className="font-bold">{profile?.company_name}</h3>
            <p className="text-slate-500 whitespace-pre-line">{profile?.address}</p>
            <p>Email: {profile?.email}</p>
            <p>Tel: {profile?.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold mb-4 uppercase">Devis</h2>
          <p className="font-mono text-lg font-bold">#{quote.number}</p>
          <div className="mt-4 text-sm">
            <p><span className="text-slate-400 uppercase text-[10px]">Date :</span> {new Date(quote.created_at).toLocaleDateString('fr-FR')}</p>
            {quote.valid_until && (
              <p><span className="text-slate-400 uppercase text-[10px]">Valide jusqu'au :</span> {new Date(quote.valid_until).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>
      </div>

      {/* CLIENT INFO */}
      <div className="bg-slate-50 p-6 rounded-lg mb-12 border border-slate-100 flex justify-between">
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Destinataire</p>
          <p className="font-bold">{client?.name}</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{client?.address}{client?.city ? `, ${client?.city}` : ''}</p>
        </div>
        <div className="text-right">
           <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Objet</p>
           <p className="text-sm font-bold">Installation - Chantier #{quote.number}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-slate-900 text-[10px] uppercase font-bold text-slate-400 text-left">
            <th className="py-2">Prestation</th>
            <th className="py-2 text-center">Qté</th>
            <th className="py-2 text-right">Unit. HT</th>
            <th className="py-2 text-right">Total HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {quote.quote_items?.map((item) => (
            <tr key={item.id} className="text-sm">
              <td className="py-4 pr-4">
                <p className="font-bold">{item.description}</p>
              </td>
              <td className="py-4 text-center font-mono">{item.quantity}</td>
              <td className="py-4 text-right font-mono">{item.unit_price.toLocaleString('fr-FR')} €</td>
              <td className="py-4 text-right font-mono font-bold">{item.total_ht?.toLocaleString('fr-FR')} €</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 uppercase text-[10px]">Total HT</span>
            <span className="font-mono">{quote.total_ht.toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 uppercase text-[10px]">TVA ({quote.tax_rate}%)</span>
            <span className="font-mono">{(quote.total_ttc - quote.total_ht).toLocaleString('fr-FR')} €</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-900">
            <span className="font-bold uppercase text-[10px]">Total TTC</span>
            <span className="text-xl font-bold font-mono">{quote.total_ttc.toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-100 mt-12">
        <div className="space-y-4">
          <p className="text-slate-400 uppercase text-[10px] font-bold">L'Artisan</p>
          <div className="h-24 bg-slate-50 rounded border border-dashed border-slate-200"></div>
        </div>
        <div className="space-y-4 text-right">
          <p className="text-slate-400 uppercase text-[10px] font-bold">Le Client</p>
          <div className="h-24 bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center">
            {signature && (
               <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
