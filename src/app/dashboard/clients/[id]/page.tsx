import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProjectHistoryList } from '@/components/dashboard/ProjectHistoryList'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return notFound()
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
    totalBilled: quotes?.filter(q => q.status === 'accepted' || q.status === 'invoiced' || q.status === 'paid').reduce((acc, q) => acc + Number(q.total_ttc), 0) || 0,
    pendingValue: quotes?.filter(q => q.status === 'sent' || q.status === 'draft').reduce((acc, q) => acc + Number(q.total_ttc), 0) || 0
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface mb-1 uppercase">{client.name}</h1>
          <p className="text-on-surface-variant font-body text-xs font-bold uppercase tracking-widest opacity-60">
            Client ID: #{client.id.substring(0, 5).toUpperCase()} • Membre depuis {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : 'N/A'}
          </p>
        </div>
        <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
          <button className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold hover:bg-primary-container transition-transform scale-98 active:scale-95 shadow-[0px_8px_16px_rgba(0,35,111,0.15)] text-sm flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">add</span>
            Nouveau Devis
          </button>
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column (Profile Info Card) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center shadow-sm border border-slate-100/50">
            <div className="w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center mb-6 text-4xl font-black text-primary border-4 border-surface-container-lowest shadow-sm uppercase">
              {client.name.charAt(0)}
            </div>
            <h2 className="font-headline text-xl font-black text-on-surface mb-2 uppercase tracking-tighter">{client.name}</h2>
            <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-8">
              {client.notes?.toLowerCase().includes('pro') ? 'Professionnel' : 'Particulier'}
            </span>
            
            <div className="w-full text-left space-y-6">
              <div>
                <h3 className="font-label text-[0.6875rem] text-on-surface-variant uppercase tracking-[0.05em] mb-4 font-black opacity-40">Contact</h3>
                <div className="flex items-center gap-3 text-on-surface font-bold text-sm mb-4">
                  <span className="material-symbols-outlined text-outline text-lg">mail</span>
                  <span className="truncate">{client.email || 'Pas d\'email'}</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface font-bold text-sm">
                  <span className="material-symbols-outlined text-outline text-lg">phone</span>
                  {client.phone || 'Pas de numéro'}
                </div>
              </div>

              <div className="pt-6 border-t border-surface-container-high">
                <h3 className="font-label text-[0.6875rem] text-on-surface-variant uppercase tracking-[0.05em] mb-4 font-black opacity-40">Adresse de Facturation</h3>
                <p className="text-sm font-bold text-on-surface leading-relaxed uppercase tracking-tight">
                  {client.address}<br/>
                  {client.postal_code} {client.city}<br/>
                  {client.country || 'France'}
                </p>
              </div>

              <div className="pt-6 border-t border-surface-container-high">
                <h3 className="font-label text-[0.6875rem] text-on-surface-variant uppercase tracking-[0.05em] mb-4 font-black opacity-40">Chantier Actif</h3>
                <p className="text-sm font-bold text-on-surface leading-relaxed flex items-start gap-2 uppercase tracking-tight">
                  <span className="material-symbols-outlined text-primary mt-0.5 text-lg">location_on</span>
                  <span>{client.site_address || client.address}<br/>{client.postal_code} {client.city}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {client.notes && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-inner">
               <h3 className="font-label text-[0.6875rem] text-primary uppercase tracking-[0.05em] mb-3 font-black flex items-center gap-2">
                 <span className="material-symbols-outlined text-sm">sticky_note</span> Notes Techniques
               </h3>
               <p className="text-xs font-bold text-slate-500 italic leading-relaxed whitespace-pre-wrap">
                 {client.notes}
               </p>
            </div>
          )}
        </div>

        {/* Right Column (Main Content) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-diffused border-l-4 border-primary">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] font-black">Total Facturé</h3>
                <span className="material-symbols-outlined text-primary">euro</span>
              </div>
              <div className="text-5xl font-headline font-black text-on-surface tracking-tighter leading-none mb-2 italic">
                {stats.totalBilled.toLocaleString('fr-FR')}<span className="text-xl text-on-surface-variant ml-1 not-italic">€</span>
              </div>
              <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Sur {stats.totalQuotes} dossiers émis</p>
            </div>
            
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-diffused border-l-4 border-tertiary-fixed-dim">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.1em] font-black">Encours Devis</h3>
                <span className="material-symbols-outlined text-tertiary-fixed-dim">schedule</span>
              </div>
              <div className="text-5xl font-headline font-black text-on-surface tracking-tighter leading-none mb-2 italic">
                {stats.pendingValue.toLocaleString('fr-FR')}<span className="text-xl text-on-surface-variant ml-1 not-italic">€</span>
              </div>
              <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                {stats.pendingValue > 0 ? 'Relance conseillée' : 'Aucun devis en attente'}
              </p>
            </div>
          </div>

          {/* Project History */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-slate-100/50">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-headline text-xl font-black text-on-surface tracking-tighter uppercase italic">Historique des Dossiers</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {quotes?.length || 0} Projets
              </span>
            </div>
            
            <ProjectHistoryList quotes={quotes || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
