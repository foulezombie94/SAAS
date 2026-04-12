'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { 
  Plus, 
  Trash2, 
  Save, 
  UserPlus, 
  ChevronLeft, 
  Loader,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Users, 
  FileText,
  PersonStanding,
  ListPlus,
  Clock,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Client {
  id: string
  name: string
  email: string | null
}

import { getUsageLimits } from '@/app/dashboard/actions'
import { getClientsAction } from '@/app/dashboard/clients/actions'
import { LimitBanner } from '@/components/ui/LimitBanner'
import { createQuoteAction } from '../actions'

export default function NewQuotePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [checkingLimits, setCheckingLimits] = useState(true)
  const [limitStatus, setLimitStatus] = useState({ allowed: true, count: 0, isPro: false })
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [number, setNumber] = useState('D-XXXX-XXX')
  const [taxRate, setTaxRate] = useState(20)
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  const [estimatedStartDate, setEstimatedStartDate] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [validityMonths, setValidityMonths] = useState(1)

  // Stats
  const [totalHt, setTotalHt] = useState(0)
  const [totalTtc, setTotalTtc] = useState(0)

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
       try {
         // Check limits via Server Action (qui est déjà sécurisée)
         const status = await getUsageLimits('quotes')
         setLimitStatus(status)

         if (status.allowed) {
           const clientsData = await getClientsAction()
           setClients(clientsData)
           setNumber(`DEV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`)
         }
       } catch (err) {
         console.error("Erreur init devis:", err)
         // On ne bloque pas l'utilisateur, les actions serveur échoueront si vraiment non auth
       } finally {
         setCheckingLimits(false)
       }
    }
    init()
  }, [])

  useEffect(() => {
    const ht = items.reduce((sum, item) => sum + item.total, 0)
    setTotalHt(ht)
    setTotalTtc(ht * (1 + taxRate / 100))
  }, [items, taxRate])

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let finalValue = value
        if (field === 'quantity' || field === 'unit_price') {
          finalValue = Math.max(0, Number(value) || 0)
        }
        
        const updatedItem = { ...item, [field]: finalValue }
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unit_price)
        }
        return updatedItem
      }
      return item
    }))
  }

  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (!selectedClientId) return toast.error('Veuillez sélectionner un client')
    setLoading(true)

    try {
      const payload = {
        client_id: selectedClientId,
        status,
        total_ht: totalHt,
        tax_rate: taxRate,
        total_ttc: totalTtc,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total,
          tax_rate: taxRate,
          total_ht: item.total,
          total_ttc: item.total * (1 + taxRate / 100)
        })),
        description: "", // Added to satisfy validation
        terms: "",
        notes: "",
        estimated_start_date: estimatedStartDate ? new Date(estimatedStartDate).toISOString() : null,
        estimated_duration: estimatedDuration || "",
        valid_until: (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + validityMonths);
          return d.toISOString();
        })(),
        payment_method: "Virement ou Carte Bancaire"
      };

      const result = await createQuoteAction(payload);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(status === 'draft' ? "Brouillon enregistré" : "Devis créé et sécurisé par Zod !")
      router.push('/dashboard')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingLimits) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader className="animate-spin text-primary" size={40} />
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Vérification de votre compte...</p>
      </div>
    )
  }

  if (!limitStatus.allowed) {
    return (
      <div className="flex flex-col gap-10">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 text-[0.6875rem] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors mb-2">
            <ChevronLeft size={14} /> Retour au Dashboard
          </Link>
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none italic">Accès limité</h1>
        </div>
        <LimitBanner type="devis" count={limitStatus.count} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 text-[0.6875rem] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors mb-2">
            <ChevronLeft size={14} /> Retour au Dashboard
          </Link>
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Nouvelle Édition</h1>
          <p className="text-on-surface-variant font-bold mt-2 uppercase tracking-widest text-xs">Référence de travail : {number}</p>
        </div>
        <div className="flex items-center px-6 h-12 bg-tertiary-container text-on-tertiary-container rounded-lg font-black text-xs uppercase tracking-widest shadow-sm">
          BROUILLON EN COURS
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Main Editor */}
        <div className="lg:col-span-8 space-y-10">
          {/* Section: Infos Client */}
          <section className="bg-white p-10 rounded-2xl shadow-diffused border border-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                  <Plus size={20} />
                </div>
                <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Informations Client</h2>
              </div>
              <Link href="/dashboard/clients/new">
                <Button size="sm" variant="ghost" className="text-primary font-black uppercase tracking-widest text-xs">
                  <UserPlus size={16} className="mr-2" /> Nouveau Client
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col gap-6">
               <label className="text-[0.6875rem] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">Destinataire du Devis</label>
               <select 
                 value={selectedClientId}
                 onChange={(e) => setSelectedClientId(e.target.value)}
                 className="w-full h-16 bg-surface-container-low border-none rounded-xl px-6 font-black text-primary uppercase tracking-tighter focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
               >
                  <option value="">-- Sélectionner un client enregistré --</option>
                  {clients.map(c => (
                     <option key={c.id} value={c.id}>{c.name} ({c.email || 'Pas d\'email'})</option>
                  ))}
               </select>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[0.6875rem] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">Date de début estimée</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
                    <input 
                      type="date"
                      value={estimatedStartDate}
                      onChange={(e) => setEstimatedStartDate(e.target.value)}
                      className="w-full h-16 bg-surface-container-low border-none rounded-xl pl-16 pr-6 font-black text-primary uppercase tracking-tighter focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[0.6875rem] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">Durée estimée des travaux</label>
                  <div className="relative">
                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
                    <input 
                      type="text"
                      placeholder="Ex: 5 jours, 2 semaines..."
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      className="w-full h-16 bg-surface-container-low border-none rounded-xl pl-16 pr-6 font-black text-primary uppercase tracking-tighter focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
               </div>
            </div>
          </section>

          {/* Section: Tableau des Prix */}
          <section className="bg-white p-10 rounded-2xl shadow-diffused border border-outline-variant/10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                  <ListPlus size={20} />
                </div>
                <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Détail des Prestations</h2>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-primary/10 text-[0.6875rem] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                <div className="col-span-6">Désignation des travaux</div>
                <div className="col-span-2 text-center">Qté</div>
                <div className="col-span-2 text-right">Prix HT</div>
                <div className="col-span-2 text-right">Total HT</div>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center group py-2">
                  <div className="col-span-6">
                    <input 
                      className="w-full bg-surface-container-low/50 border-none rounded-xl px-4 py-3 font-bold text-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Description de la prestation..."
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number"
                      min="0"
                      className="w-full bg-surface-container-low/50 border-none rounded-xl px-4 py-3 font-bold text-center focus:ring-2 focus:ring-primary/20"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number"
                      min="0"
                      className="w-full bg-surface-container-low/50 border-none rounded-xl px-4 py-3 font-bold text-right focus:ring-2 focus:ring-primary/20"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                    <span className="font-black text-primary">{item.total.toFixed(2)}€</span>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-on-surface-variant/20 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={addItem}
                className="mt-6 w-full border-2 border-dashed border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 transition-all py-6 rounded-2xl flex items-center justify-center gap-3 text-on-surface-variant/40 hover:text-primary font-black uppercase tracking-widest text-xs"
              >
                <Plus size={20} /> Ajouter une prestation
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar Summary */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
          <section className="bg-primary text-on-primary p-10 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <TrendingUp size={120} />
            </div>
            <h2 className="text-[0.6875rem] font-black uppercase tracking-[0.2em] mb-10 opacity-60">Récapitulatif Financier</h2>
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Total HT</span>
                <span className="text-2xl font-black tracking-tighter">{totalHt.toLocaleString('fr-FR')} €</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm font-bold opacity-70 uppercase tracking-widest">TVA</span>
                <div className="flex items-center gap-3">
                  <select 
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="bg-white/10 border-none rounded-lg px-3 py-1 font-black text-xs appearance-none cursor-pointer focus:ring-0"
                  >
                    <option value="20" className="text-primary">20%</option>
                    <option value="10" className="text-primary">10%</option>
                    <option value="5.5" className="text-primary">5.5%</option>
                  </select>
                  <span className="font-bold text-sm">{(totalHt * (taxRate / 100)).toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total TTC</p>
                <div className="text-[3.5rem] font-black leading-none tracking-tighter">
                  {totalTtc.toLocaleString('fr-FR')} €
                </div>
              </div>
            </div>
          </section>

          <Card className="p-8 bg-white rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <Clock className="text-primary/40" size={20} />
              <h3 className="text-sm font-black text-primary uppercase tracking-tighter">Validité & Paiement</h3>
            </div>
            
            <div className="space-y-4 text-left">
              <label className="text-[0.6875rem] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">Durée de validité</label>
              <select 
                value={validityMonths}
                onChange={(e) => setValidityMonths(Number(e.target.value))}
                className="w-full h-12 bg-surface-container-low border-none rounded-xl px-4 font-black text-primary uppercase tracking-tighter focus:ring-2 focus:ring-primary/20"
              >
                <option value={1}>1 Mois</option>
                <option value={2}>2 Mois</option>
                <option value={3}>3 Mois</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-relaxed text-center">
                Mode de règlement accepté :<br/>
                <span className="text-primary">Virement ou Carte Bancaire</span>
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Action Bar */}
      <footer className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100/50 z-50 px-10 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full md:w-auto">
            <Button 
              variant="tertiary" 
              className="flex-1 md:flex-none h-16 px-10 font-black uppercase tracking-widest text-xs gap-3"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
            >
              <Save size={20} /> Sauvegarder Brouillon
            </Button>
          </div>
          <Button 
            onClick={() => handleSubmit('sent')}
            disabled={loading}
            className="h-16 px-12 bg-primary font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <FileText size={20} />}
            Générer Devis Officiel
          </Button>
        </div>
      </footer>
    </div>
  )
}
