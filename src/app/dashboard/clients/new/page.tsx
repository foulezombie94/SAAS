'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  ArrowLeft, 
  Contact, 
  Receipt, 
  HardHat, 
  StickyNote, 
  Info,
  Save,
  X,
  Loader,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { createClientAction } from '../actions'
import { getUsageLimits } from '@/app/dashboard/actions'
import { LimitBanner } from '@/components/ui/LimitBanner'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [checkingLimits, setCheckingLimits] = useState(true)
  const [limitStatus, setLimitStatus] = useState({ allowed: true, count: 0, isPro: false })
  const [sameAsBilling, setSameAsBilling] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    site_address: '',
    notes: ''
  })

  // Sync site address with billing address if sameAsBilling is true
  useEffect(() => {
    if (sameAsBilling) {
      setFormData(prev => ({
        ...prev,
        site_address: prev.address ? `${prev.address}, ${prev.postal_code} ${prev.city}` : ''
      }))
    }
  }, [sameAsBilling, formData.address, formData.city, formData.postal_code])

  useEffect(() => {
    async function check() {
      const status = await getUsageLimits('clients')
      setLimitStatus(status)
      setCheckingLimits(false)
    }
    check()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom du client est obligatoire")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      // Limit check
      const ls = await getUsageLimits('clients')
      if (!ls.allowed) throw new Error("Limite de 3 clients atteinte. Passez en PRO !")

      // 🛡️ BASTION DE SÉCURITÉ : Appel de l'action serveur avec validation Zod et Anti-XSS
      const result = await createClientAction({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
        site_address: formData.site_address,
        notes: formData.notes
      })

      if (!result.success) throw new Error("Erreur de sauvegarde")

      toast.success("Client enregistré avec succès !")
      router.push('/dashboard/clients')
      router.refresh()
    } catch (e: any) {
      toast.error("Erreur lors de l'enregistrement : " + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingLimits) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader className="animate-spin text-[#00236f]" size={40} />
        <p className="text-[10px] font-black text-[#00236f] uppercase tracking-[0.2em] animate-pulse text-center">Vérification de vos quotas...</p>
      </div>
    )
  }

  if (!limitStatus.allowed) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <header className="flex items-center gap-6 px-2">
          <Link href="/dashboard/clients">
             <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors border border-slate-100 bg-white shadow-sm">
               <ArrowLeft className="text-[#00236f]" size={20} />
             </button>
          </Link>
          <h1 className="text-3xl font-black text-[#00236f] tracking-tighter uppercase leading-none italic">Quota Atteint</h1>
        </header>
        <LimitBanner type="clients" count={limitStatus.count} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-7xl mx-auto">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/clients">
             <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors border border-slate-100 bg-white shadow-sm active:scale-95">
               <ArrowLeft className="text-[#00236f]" size={20} />
             </button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-[#00236f] tracking-tighter uppercase leading-none">Nouveau Client</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ajout à la base artisanale</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <Link href="/dashboard/clients" className="flex-1 md:flex-none">
              <Button variant="ghost" className="w-full h-14 px-8 font-black uppercase tracking-widest text-xs border border-slate-100 bg-white">
                Annuler
              </Button>
           </Link>
           <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="flex-1 md:flex-none h-14 px-10 bg-[#00236f] hover:bg-[#001b54] text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
           >
             {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
             Enregistrer le Client
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Client Detail Form */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section: Coordonnées de base */}
          <section className="bg-white p-10 rounded-2xl shadow-diffused border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                <Contact size={20} />
              </div>
              <h2 className="text-xl font-black text-[#00236f] uppercase tracking-tighter">Coordonnées de base</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Nom du client ou Entreprise</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="ex: Jean Dupont ou SARL Construction"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Email Professionnel</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="contact@exemple.fr"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Téléphone Mobile</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="+33 6 00 00 00 00"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section: Adresse de Facturation */}
          <section className="bg-white p-10 rounded-2xl shadow-diffused border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                <Receipt size={20} />
              </div>
              <h2 className="text-xl font-black text-[#00236f] uppercase tracking-tighter">Adresse de Facturation</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Rue & Numéro</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="123 Avenue des Artisans"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Ville</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Paris"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Code Postal</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                    placeholder="75000"
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Pays</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Adresse du Chantier */}
          <section className="bg-white p-10 rounded-2xl shadow-diffused border border-outline-variant/10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                  <HardHat size={20} />
                </div>
                <h2 className="text-xl font-black text-[#00236f] uppercase tracking-tighter">Adresse du Chantier</h2>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-4 py-2 rounded-full border border-slate-100 hover:bg-slate-100 transition-all">
                <input 
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                />
                <span className="text-[10px] uppercase font-black tracking-widest text-[#00236f]">Identique à la facturation</span>
              </label>
            </div>

            <div className={`space-y-6 transition-all duration-300 ${sameAsBilling ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">Rue du chantier</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Lieu de l'intervention"
                  type="text"
                  value={formData.site_address}
                  onChange={(e) => handleInputChange('site_address', e.target.value)}
                  disabled={sameAsBilling}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Notes & Aesthetic Context */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
          <section className="bg-white p-10 rounded-2xl shadow-diffused border border-outline-variant/10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                <StickyNote size={20} />
              </div>
              <h2 className="text-xl font-black text-[#00236f] uppercase tracking-tighter">Notes & Détails</h2>
            </div>
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3 block">Spécificités du dossier</label>
            <textarea 
              className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-6 font-black text-[#00236f] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 resize-none min-h-[250px]"
              placeholder="Accès difficile, horaires de travail restreints, présence d'un animal..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            ></textarea>
            
            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-4">
                <Info className="text-[#00236f] shrink-0" size={20} />
                <p className="text-[10px] font-bold text-[#00236f]/70 leading-relaxed uppercase tracking-widest">
                  Ces notes resteront privées et ne seront pas partagées sur les devis officiels avec le client.
                </p>
              </div>
            </div>
          </section>

          {/* Aesthetic Visual Context */}
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-lg">
            <div className="absolute inset-0 bg-[#00236f]/60 mix-blend-multiply z-10 transition-opacity duration-700 group-hover:opacity-40"></div>
            <img 
              alt="Professional architectural site layout" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-1000" 
              src="https://images.unsplash.com/photo-1503387762-592dea58ef21?auto=format&fit=crop&q=80&w=1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00236f] to-transparent z-20 flex flex-col justify-end p-8">
              <span className="text-white font-black text-xl leading-tight uppercase tracking-tighter">Précision et Excellence</span>
              <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em] mt-2">L'engagement ArtisanFlow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
