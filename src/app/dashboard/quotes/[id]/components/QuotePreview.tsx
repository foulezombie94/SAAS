import React from 'react'
import { Card } from '@/components/ui/Card'
import { Quote } from '@/types/dashboard'
import { PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuotePreviewProps {
  quote: Quote
  signature: string | null
  onSignArtisan?: () => void
}

export function QuotePreview({ quote, signature, onSignArtisan }: QuotePreviewProps) {
  const profile = quote.profiles
  const client = quote.clients

  return (
    <Card className="border-none shadow-2xl overflow-hidden bg-white ring-1 ring-slate-200/50">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
      <div className="p-12">
        {/* HEADER DU DEVIS */}
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          <div className="space-y-6">
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl inline-block font-black text-xl tracking-tighter shadow-lg shadow-slate-200">
               {profile?.company_name?.split(' ')[0] || 'AF'}.FLOW
            </div>
            <div className="space-y-1 text-sm">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{profile?.company_name}</h3>
                <p className="text-slate-500 font-medium whitespace-pre-line leading-relaxed">{profile?.address}</p>
                <div className="pt-2 text-[11px] font-black uppercase tracking-widest text-slate-400 space-y-1">
                    <p>Contact : {profile?.email}</p>
                    <p>Tél : {profile?.phone}</p>
                </div>
            </div>
          </div>
          
          <div className="text-right flex flex-col justify-between">
            <div>
              <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter opacity-[0.03] absolute top-10 right-10 select-none pointer-events-none">DEVIS</h2>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Devis</h2>
              <p className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">#{quote.number}</p>
            </div>
            <div className="space-y-1 text-sm font-bold text-slate-500 mt-4">
              <p><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Émis le :</span> {new Date(quote.created_at).toLocaleDateString('fr-FR')}</p>
              {quote.valid_until && (
                <p><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Expire le :</span> {new Date(quote.valid_until).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION CLIENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative group transition-all hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50">
             <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                Client Destinataire
             </div>
             <h4 className="text-xl font-black text-slate-900 mb-2">{client?.name}</h4>
             <p className="text-slate-500 font-medium whitespace-pre-line leading-relaxed italic">{client?.address}</p>
             <p className="text-slate-500 font-medium italic">{client?.city} {client?.postal_code}</p>
          </div>
          
          <div className="flex flex-col justify-center p-8 border-l-2 border-dashed border-slate-100 pl-12 text-right">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Objet du chantier</span>
             <p className="text-lg font-bold text-slate-900 leading-tight">Installation & Main d'œuvre professionnelle<br/><span className="text-sm font-medium text-slate-500 italic block mt-1">Chantier référence #{quote.number}</span></p>
          </div>
        </div>

        {/* TABLEAU DES ARTICLES */}
        <div className="mb-16 overflow-hidden rounded-3xl border border-slate-100">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-900 text-white">
                 <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Description de la prestation</th>
                 <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Qté</th>
                 <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Unit. HT</th>
                 <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-right">Total HT</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {quote.quote_items?.map((item) => (
                 <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                   <td className="py-6 px-8">
                      <p className="font-bold text-slate-900 mb-1">{item.description}</p>
                   </td>
                   <td className="py-6 px-4 text-center font-mono font-bold text-slate-600">{item.quantity}</td>
                   <td className="py-6 px-4 text-right font-mono font-bold text-slate-600">{item.unit_price.toLocaleString('fr-FR')} €</td>
                   <td className="py-6 px-8 text-right font-mono font-black text-slate-900">{(item.total_ht ?? (item.quantity * item.unit_price)).toLocaleString('fr-FR')} €</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* TOTALS */}
        <div className="flex flex-col items-end gap-4 mb-20 px-8">
           <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hors Taxes</span>
                <span className="font-mono font-bold text-slate-600">{quote.total_ht.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">TVA ({quote.tax_rate}%)</span>
                <span className="font-mono font-bold text-slate-600">{(quote.total_ttc - quote.total_ht).toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Montant Total TTC</span>
                <span className="text-4xl font-black text-indigo-600 tracking-tighter leading-none font-mono">
                  {quote.total_ttc.toLocaleString('fr-FR')}<span className="text-xl ml-1">€</span>
                </span>
              </div>
           </div>
        </div>

        {/* SIGNATURES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t-2 border-dashed border-slate-100 pt-16 mt-16">
           <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Cachet & Signature de l'Artisan</span>
              <div 
                onClick={onSignArtisan}
                className={cn(
                  "h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden",
                  quote.status === 'accepted' || quote.status === 'paid' 
                    ? "bg-slate-50 border-slate-200 cursor-default" 
                    : "bg-indigo-50/30 border-indigo-200 hover:bg-white hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100"
                )}
              >
                 {quote.status === 'accepted' || quote.status === 'paid' ? (
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <PenLine className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">Devis Signé</span>
                   </div>
                 ) : (
                   <>
                    <PenLine className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 group-hover:text-indigo-600 transition-all" />
                    <span className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-1">Cliquer pour signer</span>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Validation immédiate</span>
                    <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </>
                 )}
              </div>
           </div>
           
           <div className="space-y-4 text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Signature du Client (Précédée de "Bon pour accord")</span>
              <div className="h-48 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center relative group transition-all hover:bg-white hover:border-indigo-100 hover:shadow-lg overflow-hidden">
                 {signature ? (
                   <img 
                    src={signature} 
                    alt="Signature" 
                    className="max-h-[85%] max-w-[85%] object-contain mix-blend-multiply transition-transform group-hover:scale-110" 
                   />
                 ) : (
                   <div className="flex flex-col items-center gap-2 opacity-30">
                     <span className="italic text-slate-400 font-medium text-sm">En attente de signature numérique</span>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* FOOTER MENTIONS */}
        <div className="mt-20 pt-8 border-t border-slate-100 text-center">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
             Auto-entrepreneur exonéré de TVA (Art. 293B du CGI) <br/>
             Devis valable 30 jours à compter de sa date d'émission.
           </p>
        </div>
      </div>
    </Card>
  )
}
