import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  FileText, 
  Receipt, 
  Users, 
  ChevronRight, 
  Clock, 
  ArrowLeft,
  CreditCard
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchResultsPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!query || query.trim().length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
           <Search size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Recherche</h1>
          <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest">Saisissez au moins 2 caractères pour lancer une détection...</p>
        </div>
      </div>
    )
  }

  const searchTerm = `%${query}%`

  // 🛡️ RECHERCHE OPTIMISÉE : On ne cherche que les champs pertinents (Grade 3)
  const [quotesResult, invoicesResult, clientsResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, number, status, total_ttc, clients(name)')
      .or(`number.ilike.${searchTerm}`)
      .eq('user_id', user.id)
      .limit(10),
    supabase
      .from('invoices')
      .select('id, number, status, total_ttc, clients(name)')
      .or(`number.ilike.${searchTerm}`)
      .eq('user_id', user.id)
      .limit(10),
    supabase
      .from('clients')
      .select('id, name, email')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .eq('user_id', user.id)
      .limit(10)
  ])

  const quotes = quotesResult.data || []
  const invoices = invoicesResult.data || []
  const clients = clientsResult.data || []

  const totalResults = quotes.length + invoices.length + clients.length

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
             <button className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all border border-slate-100 bg-white shadow-sm active:scale-90">
               <ArrowLeft className="text-primary" size={24} />
             </button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none italic">Résultats</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Found {totalResults} matches for "{query}"</p>
          </div>
        </div>
      </header>

      {totalResults === 0 ? (
        <Card className="p-20 text-center flex flex-col items-center justify-center gap-6 bg-slate-50/50 border-dashed border-2 border-slate-200">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm">
             <Search size={32} />
           </div>
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-md">
             Aucune trace de ce terme dans vos bases artisanales. Essayez un autre mot-clé ou vérifiez l'orthographe.
           </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Section: Clients */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
               <Users className="text-slate-400" size={18} />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Clients ({clients.length})</h3>
            </div>
            <div className="flex flex-col gap-3">
              {clients.map(client => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="group">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 group-hover:border-primary group-hover:shadow-2xl group-hover:shadow-primary/5 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-primary uppercase tracking-tighter">{client.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{client.email || 'Pas d\'email'}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-200 group-hover:text-primary transition-colors" size={16} />
                  </div>
                </Link>
              ))}
              {clients.length === 0 && <p className="p-4 text-[10px] font-bold text-slate-300 uppercase italic">Aucun client trouvé</p>}
            </div>
          </div>

          {/* Section: Devis */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
               <FileText className="text-slate-400" size={18} />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Devis ({quotes.length})</h3>
            </div>
            <div className="flex flex-col gap-3">
              {quotes.map(quote => (
                <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="group">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 group-hover:border-primary group-hover:shadow-2xl group-hover:shadow-primary/5 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-primary uppercase tracking-tighter truncate">{quote.number}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">{quote.clients?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-primary">{quote.total_ttc?.toLocaleString('fr-FR')}€</p>
                       <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                         quote.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {quote.status}
                       </span>
                    </div>
                  </div>
                </Link>
              ))}
              {quotes.length === 0 && <p className="p-4 text-[10px] font-bold text-slate-300 uppercase italic">Aucun devis trouvé</p>}
            </div>
          </div>

          {/* Section: Factures */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
               <Receipt className="text-slate-400" size={18} />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Factures ({invoices.length})</h3>
            </div>
            <div className="flex flex-col gap-3">
              {invoices.map(invoice => (
                <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className="group">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 group-hover:border-primary group-hover:shadow-2xl group-hover:shadow-primary/5 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Receipt size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-primary uppercase tracking-tighter truncate">{invoice.number}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">{invoice.clients?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-primary">{invoice.total_ttc?.toLocaleString('fr-FR')}€</p>
                       <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                         invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {invoice.status}
                       </span>
                    </div>
                  </div>
                </Link>
              ))}
              {invoices.length === 0 && <p className="p-4 text-[10px] font-bold text-slate-300 uppercase italic">Aucune facture trouvée</p>}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
