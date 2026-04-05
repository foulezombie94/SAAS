import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  Filter
} from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: clients } = await supabase
    .from('clients')
    .select('*, quotes(id, status, total_ttc, created_at)')
    .eq('user_id', user?.id || '')
    .order('created_at', { ascending: false })

  const safeClients = clients || []

  const stats = {
    total: safeClients.length,
    active: safeClients.filter(c => c.quotes && c.quotes.length > 0).length,
    unpaidCount: safeClients.filter(c => c.quotes && c.quotes.some((q: any) => q.status === 'sent')).length
  }

  return (
    <div className="space-y-12">
      {/* Header & Search */}
      <header className="flex flex-col md:flex-row md:items-end justify-between self-stretch gap-8">
        <div className="flex-1">
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none mb-3">Base Clients</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs opacity-60">
            {stats.total} clients enregistrés dans votre base artisanale
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              className="w-full bg-white border-none outline-none focus:ring-2 focus:ring-primary/10 pl-14 pr-6 py-4 rounded-2xl shadow-diffused text-on-surface font-bold placeholder:text-slate-300 transition-all uppercase text-xs tracking-widest" 
              placeholder="Rechercher un client..." 
              type="text"
            />
          </div>
          <Link href="/dashboard/clients/new" className="w-full md:w-auto">
            <Button className="w-full h-14 px-8 font-black uppercase tracking-widest text-xs gap-3 shadow-lg">
              <Plus size={20} /> Nouveau Client
            </Button>
          </Link>
        </div>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-primary text-on-primary border-none shadow-diffused relative overflow-hidden">
          <TrendingUp className="absolute top-4 right-4 opacity-10" size={64} />
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60 mb-8">Chiffre Total Client</p>
          <span className="text-4xl font-black tracking-tighter uppercase leading-none">
            {clients?.reduce((acc, c) => acc + (c.quotes?.reduce((qAcc: number, q: any) => qAcc + Number(q.total_ttc), 0) || 0), 0).toLocaleString('fr-FR')} €
          </span>
        </Card>
        <Card className="p-8 bg-surface-container-low border-none shadow-sm transition-all hover:shadow-md">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-8">Devis en cours</p>
          <span className="text-4xl font-black tracking-tighter text-primary">{stats.unpaidCount}</span>
        </Card>
        <Card className="p-8 bg-tertiary-container text-on-tertiary-container border-none shadow-diffused">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60 mb-8">Clients Actifs</p>
          <span className="text-4xl font-black tracking-tighter">{stats.active}</span>
        </Card>
      </div>

      {/* Client List Layout */}
      <div className="space-y-4">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-6 px-10 py-3 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/30">
          <div className="col-span-2">Client / Entreprise</div>
          <div>Dernière Activité</div>
          <div>Statut Projet</div>
          <div className="text-right">Total Facturé</div>
          <div className="text-right">Détails</div>
        </div>

        {/* Client Slabs */}
        <div className="flex flex-col gap-4">
          {clients?.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="block">
              <Card className="p-6 grid grid-cols-1 md:grid-cols-6 gap-6 items-center border-none shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white group hover:scale-[1.01] active:scale-[0.99]">
                <div className="col-span-2 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-lg group-hover:bg-primary group-hover:text-white transition-all">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-primary uppercase tracking-tighter text-xl">{client.name}</h4>
                    <p className="text-[0.6875rem] font-black text-on-surface-variant/40 uppercase tracking-widest">{client.email || 'Pas d\'email enregistré'}</p>
                  </div>
                </div>
                
                <div className="text-sm font-bold text-on-surface-variant/60 flex items-center gap-2">
                  <Clock size={16} />
                  {client.quotes?.[0]?.created_at ? new Date(client.quotes[0].created_at).toLocaleDateString() : 'N/A'}
                </div>

                <div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    client.quotes?.some((q: any) => q.status === 'sent') 
                      ? 'bg-tertiary-container text-on-tertiary-container' 
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {client.quotes?.some((q: any) => q.status === 'sent') ? 'En cours' : 'Passif'}
                  </span>
                </div>

                <div className="text-right font-black text-primary text-lg tracking-tighter">
                  {(client.quotes?.reduce((acc: number, q: any) => acc + Number(q.total_ttc), 0) || 0).toLocaleString('fr-FR')} €
                </div>

                <div className="flex justify-end pr-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary/30 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {(!clients || clients.length === 0) && (
            <Card className="flex flex-col items-center justify-center p-24 bg-transparent border-2 border-dashed border-outline-variant/30 text-center">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary/30 mb-6">
                <Users size={40} />
              </div>
              <h3 className="text-2xl font-black text-primary uppercase tracking-tighter mb-2">Aucun client pour le moment</h3>
              <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-40 max-w-sm">
                Commencez par ajouter votre premier client pour générer des devis et factures.
              </p>
              <Link href="/dashboard/clients/new" className="mt-8">
                <Button variant="tertiary" className="h-14 px-6 font-black uppercase tracking-widest text-[10px] gap-2">
                  <Filter size={16} /> Filtrer
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
