'use client'

import React, { useState, useMemo } from 'react'
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
  TrendingUp,
  Clock,
  Users,
  Filter,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { ClientWithQuotes } from '@/types/dashboard'
import { useCallback, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useSyncCache } from '@/lib/hooks/useSyncCache'
import { createClient } from '@/utils/supabase/client'

interface ClientsClientProps {
  initialClients: ClientWithQuotes[]
  userId: string
}

export function ClientsClient({ initialClients, userId }: ClientsClientProps) {
  const supabase = createClient()

  // 0. Fetcher pour la synchronisation (Source de Vérité)
  const fetcher = useCallback(async () => {
    if (!userId) return []
    
    const { data, error } = await supabase
      .from('clients')
      .select('*, quotes(*)')
      .eq('user_id', userId)
    
    if (error) throw error
    return data as ClientWithQuotes[]
  }, [supabase, userId])

  const { data: clients, isSyncing, revalidate } = useSyncCache<ClientWithQuotes[]>(
    `clients-${userId}`, 
    initialClients, 
    fetcher,
    { ttl: 1000 * 60 * 30, refreshInterval: 1000 * 60 * 5 }
  )

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 200)

  // 1. Filtrage instantané (God Tier)
  const filteredClients = useMemo(() => {
    if (!debouncedSearch) return clients
    if (!Array.isArray(clients)) return []
    const lowerSearch = debouncedSearch.toLowerCase()
    return clients.filter(c => 
      (c.name || '').toLowerCase().includes(lowerSearch) || 
      (c.email || '').toLowerCase().includes(lowerSearch) ||
      (c.city || '').toLowerCase().includes(lowerSearch)
    )
  }, [clients, debouncedSearch])

  // 2. Stats calculées (useMemo)
  const stats = useMemo(() => {
    const active = filteredClients.filter(c => c.quotes && c.quotes.length > 0).length
    const unpaidCount = filteredClients.filter(c => c.quotes && c.quotes.some((q: any) => q.status === 'sent')).length
    const totalRevenue = filteredClients.reduce((acc, c) => acc + (c.quotes?.reduce((qAcc: number, q: any) => qAcc + Number(q.total_ttc), 0) || 0), 0)
    
    return {
      total: filteredClients.length,
      active,
      unpaidCount,
      totalRevenue
    }
  }, [filteredClients])

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between self-stretch gap-8">
        <div className="flex-1">
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none mb-3 italic">Portefeuille Clients</h2>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] opacity-60 flex items-center gap-2">
            {stats.total} contacts {searchTerm ? 'filtrés' : 'enregistrés'} • 
            {isSyncing ? (
              <span className="flex items-center gap-1.5 text-primary animate-pulse">
                <Loader2 size={10} className="animate-spin" /> Synchronisation...
              </span>
            ) : (
              <span className="text-emerald-500">Base à jour</span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              className="w-full bg-white border-2 border-slate-50 outline-none focus:ring-4 focus:ring-primary/5 pl-14 pr-6 py-4 rounded-3xl shadow-sm text-primary font-black placeholder:text-slate-300 transition-all uppercase text-[10px] tracking-widest" 
              placeholder="Nom, email, ville..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href="/dashboard/clients/new" className="w-full md:w-auto">
            <Button className="w-full h-14 px-8 bg-primary hover:bg-primary-container text-on-primary font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl active:scale-95 transition-all rounded-3xl">
              <Plus size={20} /> Nouveau Client
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-primary text-on-primary border-none shadow-2xl relative overflow-hidden rounded-3xl group">
          <TrendingUp className="absolute top-4 right-4 opacity-5 group-hover:scale-110 transition-transform" size={100} />
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60 mb-8">CA Cumulé Clientèle</p>
          <span className="text-4xl font-black tracking-tighter uppercase leading-none">
            {stats.totalRevenue.toLocaleString('fr-FR')} €
          </span>
        </Card>
        
        <Card className="p-8 bg-white border-2 border-slate-50 shadow-sm transition-all hover:border-primary/20 rounded-3xl flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-8">
            <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Devis en cours</p>
            <div className="flex items-center gap-2">
              {isSyncing && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 animate-pulse">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sinc. en cours...</span>
                </div>
              )}
              <button 
                onClick={() => revalidate()}
                className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary transition-all active:scale-95 ${isSyncing ? 'animate-spin border-primary text-primary' : ''}`}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-4xl font-black tracking-tighter text-primary group-hover:scale-110 transition-transform">{stats.unpaidCount}</span>
             <Clock className="text-primary/20" size={24} />
          </div>
        </Card>

        <Card className="p-8 bg-primary/5 border-none shadow-diffused rounded-3xl flex flex-col justify-between group hover:bg-primary/10 transition-all">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-primary/60 mb-8">Clients Actifs</p>
          <span className="text-4xl font-black tracking-tighter text-primary group-hover:scale-110 transition-transform">{stats.active}</span>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="hidden md:grid grid-cols-6 px-12 py-4 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/30">
          <div className="col-span-2">Client / Entreprise</div>
          <div>Dernière Activité</div>
          <div>Statut Projet</div>
          <div className="text-right">Volume Global</div>
          <div className="text-right">Fiche</div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredClients?.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="block group">
              <Card className="p-8 grid grid-cols-1 md:grid-cols-6 gap-8 items-center border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group-hover:scale-[1.01] active:scale-[0.99] rounded-3xl">
                <div className="col-span-2 flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-2xl group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-primary uppercase tracking-tighter text-xl group-hover:text-primary-container transition-colors">{client.name}</h4>
                    <p className="text-[0.6875rem] font-black text-on-surface-variant/40 uppercase tracking-widest mt-1 italic">{client.email || 'Pas d\'email enregistré'}</p>
                  </div>
                </div>
                
                <div className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <Clock size={16} className="opacity-20" />
                  {client.quotes?.[0]?.created_at ? new Date(client.quotes[0].created_at).toLocaleDateString() : 'N/A'}
                </div>

                <div>
                  <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border transition-all ${
                    client.quotes?.some((q: any) => q.status === 'sent') 
                      ? 'bg-amber-50 text-amber-700 border-amber-100' 
                      : 'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {client.quotes?.some((q: any) => q.status === 'sent') ? 'En cours' : 'Passif'}
                  </span>
                </div>

                <div className="text-right font-black text-primary text-2xl tracking-tighter">
                  {(client.quotes?.reduce((acc: number, q: any) => acc + Number(q.total_ttc), 0) || 0).toLocaleString('fr-FR')} €
                </div>

                <div className="flex justify-end pr-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-primary/10 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {filteredClients.length === 0 && (
            <Card className="flex flex-col items-center justify-center p-32 bg-slate-50/20 border-2 border-dashed border-slate-100 text-center rounded-3xl shadow-inner">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary/5 mb-8 shadow-sm">
                <Users size={48} />
              </div>
              <h3 className="text-3xl font-black text-primary uppercase tracking-tighter opacity-40 mb-4">Client non référencé</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-sm">
                Aucune correspondance trouvée. Vérifiez l'orthographe ou ajoutez un nouveau profil.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
