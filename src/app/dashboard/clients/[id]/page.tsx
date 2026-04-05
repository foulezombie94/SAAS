import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Plus,
  StickyNote,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Construction
} from 'lucide-react'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return notFound() // This could be a redirect to login but notFound is standard for protected pages if identity isn't verified
  }

  // Fetch client details
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) {
    return notFound()
  }

  // Fetch quotes for this client
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const stats = {
    totalQuotes: quotes?.length || 0,
    totalBilled: quotes?.filter(q => q.status === 'accepted' || q.status === 'invoiced').reduce((acc, q) => acc + Number(q.total_ttc), 0) || 0,
    pendingValue: quotes?.filter(q => q.status === 'sent' || q.status === 'draft').reduce((acc, q) => acc + Number(q.total_ttc), 0) || 0
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header with Navigation */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/clients">
             <button className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:shadow-lg hover:border-slate-100 transition-all border border-transparent bg-slate-50 active:scale-95 group">
                <ArrowLeft className="text-[#00236f] group-hover:-translate-x-1 transition-transform" size={24} />
             </button>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-[#00236f] tracking-tighter uppercase leading-none">{client.name}</h1>
            <div className="flex items-center gap-2 mt-2 opacity-40">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00236f]">Profil Client ArtisanFlow</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href={`/dashboard/quotes/new?clientId=${client.id}`} className="flex-1 md:flex-none">
            <Button className="w-full h-14 px-8 bg-[#00236f] hover:bg-[#001b54] text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl active:scale-95">
              <Plus size={20} /> Nouveau Devis
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        {/* Left Column: Client Identity & Info */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="p-10 bg-white border border-slate-100 shadow-md rounded-3xl relative overflow-hidden">
             <div className="relative z-10 space-y-10">
                <div className="flex flex-col items-center text-center">
                   <div className="w-24 h-24 rounded-full bg-[#00236f]/5 flex items-center justify-center text-[#00236f] text-4xl font-black shadow-inner border border-white mb-6 uppercase">
                      {client.name.charAt(0)}
                   </div>
                   <h3 className="text-xl font-black text-[#00236f] uppercase tracking-tighter">{client.name}</h3>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#00236f]/5 group-hover:text-[#00236f] transition-all">
                        <Mail size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Email</span>
                        <span className="text-sm font-bold text-[#00236f] truncate">{client.email || 'Non renseigné'}</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#00236f]/5 group-hover:text-[#00236f] transition-all">
                        <Phone size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Téléphone</span>
                        <span className="text-sm font-bold text-[#00236f]">{client.phone || 'Non renseigné'}</span>
                      </div>
                   </div>

                   <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#00236f]/5 group-hover:text-[#00236f] transition-all shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Adresse de Facturation</span>
                        <p className="text-sm font-bold text-[#00236f] leading-relaxed">
                           {client.address}<br />
                           {client.postal_code} {client.city}<br />
                           {client.country || 'France'}
                        </p>
                      </div>
                   </div>
                </div>
             </div>
          </Card>

          {/* Chantier & Notes */}
          <Card className="p-8 bg-slate-50 border border-slate-100 shadow-sm rounded-3xl space-y-8">
             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                   <Construction size={18} className="text-[#00236f]" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00236f]">Adresse de Chantier</h4>
                </div>
                <p className="text-sm font-bold text-slate-600 pl-7">
                  {client.site_address || client.address || 'Même que facturation'}
                </p>
             </div>

             <div className="space-y-4 border-t border-slate-200/50 pt-8">
                <div className="flex items-center gap-2 mb-4">
                   <StickyNote size={18} className="text-[#00236f]" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00236f]">Notes Techniques</h4>
                </div>
                <p className="text-sm font-bold text-slate-600 pl-7 leading-relaxed whitespace-pre-wrap italic">
                   {client.notes || 'Aucune note spécifique pour ce client.'}
                </p>
             </div>
          </Card>
        </div>

        {/* Right Column: Key Stats & Project History */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="p-8 bg-[#00236f] text-white border-none shadow-xl flex flex-col justify-between h-40">
                <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60">Total Facturé Client</p>
                <span className="text-4xl font-black tracking-tighter uppercase leading-none">
                   {stats.totalBilled.toLocaleString('fr-FR')} €
                </span>
             </Card>
             <Card className="p-8 bg-white border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-slate-400">Devis En Attente</p>
                <div className="flex items-center justify-between">
                   <span className="text-4xl font-black tracking-tighter text-[#00236f]">
                      {stats.pendingValue.toLocaleString('fr-FR')} €
                   </span>
                   <Clock className="text-orange-400" size={32} />
                </div>
             </Card>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-[#00236f] uppercase tracking-tighter">Historique des Projets</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  {stats.totalQuotes} Devis émis
                </span>
             </div>

             <div className="space-y-4">
                {quotes?.map((quote) => (
                  <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`}>
                    <Card className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#00236f]/30 transition-all cursor-pointer bg-white group hover:scale-[1.01] active:scale-[0.99] rounded-2xl">
                       <div className="col-span-3">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Dossier n°</span>
                             <span className="font-black text-[#00236f] tracking-tighter text-xl uppercase">{quote.number}</span>
                          </div>
                       </div>
                       
                       <div className="col-span-3">
                           <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                              <Calendar size={12} className="text-slate-300" />
                              {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}
                           </div>
                       </div>

                       <div className="col-span-3">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 bg-slate-50 text-slate-500`}>
                             {quote.status === 'accepted' ? 'Accepté' : quote.status === 'sent' ? 'Envoyé' : quote.status === 'draft' ? 'Brouillon' : quote.status}
                          </span>
                       </div>

                       <div className="col-span-3 text-right">
                          <div className="flex flex-col">
                             <span className="font-black text-[#00236f] text-2xl tracking-tighter">
                                {Number(quote.total_ttc).toLocaleString('fr-FR')} €
                             </span>
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Montant TTC</span>
                          </div>
                       </div>
                    </Card>
                  </Link>
                ))}

                {(!quotes || quotes.length === 0) && (
                   <Card className="flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-slate-100 text-center rounded-3xl">
                      <FileText className="text-slate-200 mb-4" size={40} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">
                        Aucun devis n'a encore été créé pour ce client.
                      </p>
                   </Card>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
