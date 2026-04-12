import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Quote } from '@/types/dashboard'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface QuotePreviewProps {
  quote: Quote
  signature: string | null
}

export function QuotePreview({ quote, signature }: QuotePreviewProps) {
  const profile = quote.profiles
  const client = quote.clients

  return (
    <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 relative bg-white min-h-[1000px]">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 rounded-t-lg" />
      
      <CardContent className="p-12 md:p-16">
        {/* EN-TÊTE DOCUMENT */}
        <div className="flex justify-between items-start mb-16">
          <div className="space-y-6">
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-lg inline-block font-black text-2xl tracking-tighter shadow-sm">
              {profile?.company_name?.split(' ')[0] || 'AF'}<span className="text-indigo-400">.</span>FLOW
            </div>
            <div className="space-y-1.5 text-sm">
              <h3 className="font-bold text-slate-900 text-base mb-1">{profile?.company_name}</h3>
              <p className="text-slate-500 whitespace-pre-line leading-relaxed italic">{profile?.address}</p>
              <div className="flex flex-col gap-0.5 pt-2 text-slate-600 font-medium">
                <p>Email: {profile?.email}</p>
                <p>Tel: {profile?.phone}</p>
                {profile?.siret && <p className="text-xs text-slate-400 mt-1">SIRET: {profile?.siret}</p>}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 uppercase">Devis</h2>
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Référence</p>
              <p className="text-xl font-mono font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-md border border-slate-100 inline-block">#{quote.number}</p>
            </div>
            <div className="mt-8 space-y-3">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Date d'émission</p>
                <p className="font-bold text-slate-800">{new Date(quote.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              {quote.valid_until && (
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Valide jusqu'au</p>
                  <p className="font-bold text-indigo-600">{new Date(quote.valid_until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INFOS CLIENT & PROJET */}
        <div className="grid grid-cols-2 gap-12 mb-16 p-8 bg-slate-50/50 rounded-2xl border border-slate-100/80">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Destinataire</p>
            <div className="space-y-1.5">
              <p className="text-lg font-bold text-slate-900">{client?.name}</p>
              <p className="text-slate-600 leading-relaxed italic whitespace-pre-line">{client?.address}{client?.city ? `, ${client?.city}` : ''}</p>
              <p className="text-slate-500 font-medium pt-1 underline decoration-indigo-200 underline-offset-4">{client?.email}</p>
            </div>
          </div>
          <div className="border-l border-slate-200 pl-12">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Objet du projet</p>
            <p className="text-lg font-bold text-slate-800 leading-tight">Installation et mise en service - Chantier Réf. {quote.number}</p>
            <div className="mt-4 flex gap-2">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full">Prestation Artisanale</div>
              <div className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full">TVA {quote.tax_rate}% Incluse</div>
            </div>
          </div>
        </div>

        {/* TABLEAU ARTICLES */}
        <div className="mb-12">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="text-left py-4 px-2 text-xs font-black uppercase tracking-tighter text-slate-900">Description des prestations</th>
                <th className="text-center py-4 px-2 text-xs font-black uppercase tracking-tighter text-slate-900">Qté</th>
                <th className="text-right py-4 px-2 text-xs font-black uppercase tracking-tighter text-slate-900">Prix Unit. HT</th>
                <th className="text-right py-4 px-2 text-xs font-black uppercase tracking-tighter text-slate-900">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.quote_items?.map((item, idx) => (
                <tr key={item.id} className="group transition-colors hover:bg-slate-50/30">
                  <td className="py-6 px-2 align-top">
                    <p className="font-bold text-slate-800 mb-1">{item.description}</p>
                    <p className="text-xs text-slate-400 leading-normal italic line-clamp-2">Prestation détaillée incluant fournitures et pose conforme aux normes vigueur.</p>
                  </td>
                  <td className="py-6 px-2 text-center align-top font-mono font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-6 px-2 text-right align-top font-mono font-bold text-slate-900">{item.unit_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                  <td className="py-6 px-2 text-right align-top font-mono font-black text-slate-900">{item.total_ht?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RÉCAPITULATIF FINANCIER */}
        <div className="flex justify-end mb-16">
          <div className="w-full max-w-xs space-y-4">
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Hors Taxes</span>
                <span className="font-mono font-bold text-slate-900">{quote.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">TVA (Global {quote.tax_rate}%)</span>
                <span className="font-mono font-bold text-slate-900">{(quote.total_ttc - quote.total_ht).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-5 bg-slate-900 rounded-xl shadow-lg ring-4 ring-slate-100">
              <span className="text-white font-black uppercase text-xs tracking-tighter">Net à payer (TTC)</span>
              <span className="text-2xl font-black text-white font-mono tracking-tighter">
                {quote.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>

        {/* SIGNATURE SECTION */}
        <div className="grid grid-cols-2 gap-16 border-t-2 border-slate-100 pt-12">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Cachet de l'entreprise</p>
            <div className="h-40 w-full bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center italic text-slate-300 font-medium"> 
              Signature de l'Artisan
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Bon pour accord (Client)</p>
            <div className="h-40 w-full bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
              {signature ? (
                <div className="flex flex-col items-center gap-2">
                  <Image 
                    src={signature} 
                    alt="Signature" 
                    width={220} 
                    height={100} 
                    className="max-h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" 
                  />
                  <div className="absolute bottom-2 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-tighter">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Signé numériquement le {new Date().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="italic text-slate-300 font-medium">En attente de signature</p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-24 text-[10px] text-slate-400 text-center space-y-2 border-t border-slate-50 pt-8">
          <p className="font-bold text-slate-500 uppercase tracking-[0.2em]">{profile?.company_name} — {profile?.address} — Tel: {profile?.phone}</p>
          <p>Dispensé d'immatriculation au registre du commerce et des sociétés (RCS) et au répertoire des métiers (RM)</p>
          <p className="italic">TVA non applicable, art. 293 B du CGI</p>
        </div>
      </CardContent>
    </Card>
  )
}
