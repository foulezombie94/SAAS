import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/admin'
import { QuotePublicView } from './QuotePublicView'
import { Quote } from '@/types/dashboard'
import { Clock, AlertCircle, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function PublicQuotePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams
  const supabase = createAdminClient()

  if (!token) {
    return notFound()
  }

  // 🛡️ SECURITY GRADE 3: Correlation mandatory between id and public_token
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .eq('public_token', token)
    .single()

  if (error || !quote) {
    return notFound()
  }

  // 🛡️ BLOCKER : Expiration Check (Grade 3)
  const isExpired = quote.public_token_expires_at && new Date(quote.public_token_expires_at) < new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-500">
           <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Clock className="text-orange-600 animate-pulse" size={40} />
           </div>
           <h2 className="text-3xl font-black text-[#002878] tracking-tighter uppercase mb-4">Lien Expiré</h2>
           <p className="text-slate-500 font-bold mb-8 leading-relaxed">
              Pour votre sécurité, ce lien de partage a expiré.<br/>
              Les liens ArtisanFlow sont valides 30 jours.
           </p>
           <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 text-left mb-8 border border-slate-100">
              <ShieldAlert className="text-slate-300 shrink-0" size={20} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 Veuillez contacter l'artisan pour obtenir un nouveau lien sécurisé.
              </p>
           </div>
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sécurité Grade 3 • ArtisanFlow</p>
        </div>
      </div>
    )
  }

  // Fetch the Artisan's Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', quote.user_id)
    .single()

  const fullQuote: Quote = {
    ...quote,
    profiles: profile || undefined
  } as any as Quote

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-0">
      <div className="max-w-5xl mx-auto">
        <QuotePublicView quote={fullQuote} publicToken={token} />
      </div>
    </div>
  )
}
