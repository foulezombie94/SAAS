'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { setFreePlan, createSubscriptionSession } from '../actions'
import { toast } from 'sonner'
import { CheckCircle2, ChevronRight, Verified, HardHat } from 'lucide-react'

export default function PlansPage() {
  const [isYearly, setIsYearly] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const router = useRouter()

  // Use price IDs from environment variables
  const STRIPE_PRO_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || ''
  const STRIPE_PRO_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || ''

  const handleSelectFree = async () => {
    setIsLoading(true)
    setSelectedPlan('free')
    try {
      await setFreePlan()
      toast.success('Bienvenue sur le plan Gratuit !')
      router.push('/dashboard?onboarding=complete')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sélection du plan')
      setIsLoading(false)
    }
  }

  const handleSelectPro = async () => {
    setIsLoading(true)
    setSelectedPlan('pro')
    try {
      const priceId = isYearly ? STRIPE_PRO_YEARLY_PRICE_ID : STRIPE_PRO_MONTHLY_PRICE_ID
      if (!priceId) {
        throw new Error('Les identifiants de prix ne sont pas configurés')
      }
      const { url } = await createSubscriptionSession(priceId)
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’initialisation du paiement')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 min-h-screen">
      {/* Google Material Symbols Link (Required for the provided HTML style) */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      {/* BREADCRUMBS */}
      <div className="max-w-xl mx-auto mb-16 px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-1 w-full bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Compte créé</span>
          </div>
          <div className="w-8 flex justify-center">
            <span className="material-symbols-outlined text-primary scale-75">chevron_right</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-1 w-full bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Choix de l'offre</span>
          </div>
          <div className="w-8 flex justify-center">
            <span className="material-symbols-outlined text-outline-variant scale-75">chevron_right</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-1 w-full bg-surface-container-highest rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Prêt à travailler</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-primary mb-6">Propulsez votre activité.</h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">Simplifiez votre gestion administrative et concentrez-vous sur ce que vous faites de mieux : bâtir.</p>
        
        {/* Toggle Mensuel / Annuel (Added to match previous requirements) */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <span className={`text-sm font-bold uppercase tracking-widest ${!isYearly ? 'text-primary' : 'text-slate-400'}`}>Mensuel</span>
          <button 
            onClick={() => setIsYearly(!isYearly)}
            className="w-16 h-8 bg-slate-100 border border-slate-200 rounded-full relative flex items-center transition-all px-1"
          >
            <div className={`w-6 h-6 bg-primary rounded-full shadow-lg transition-all transform ${isYearly ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold uppercase tracking-widest ${isYearly ? 'text-primary' : 'text-slate-400'}`}>Annuel</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
              -24% 🔥
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
        {/* PRICING CARD 1: FREE */}
        <div className="bg-surface-container-low p-10 rounded-xl relative overflow-hidden group border border-transparent hover:border-primary/10 transition-all">
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-outline mb-2 block">Standard</span>
              <h2 className="text-3xl font-bold text-primary">Gratuit</h2>
            </div>
            <div className="mb-12">
              <div className="text-4xl font-black text-primary mb-1">0€<span className="text-lg text-outline font-medium"> /mois</span></div>
              <p className="text-sm text-secondary">Idéal pour débuter sereinement.</p>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-center gap-3 text-on-surface">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                <span className="text-sm font-medium">3 clients maximum</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                <span className="text-sm font-medium">3 devis / factures</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                <span className="text-sm font-medium">Signature électronique incluise</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface opacity-40">
                <span className="material-symbols-outlined text-slate-400 text-xl">cancel</span>
                <span className="text-sm font-medium">Paiements en ligne</span>
              </li>
            </ul>
            <Button 
                onClick={handleSelectFree}
                isLoading={isLoading && selectedPlan === 'free'}
                className="w-full py-5 text-sm font-bold uppercase tracking-widest text-primary border-2 border-primary rounded-lg bg-transparent hover:bg-primary hover:text-white transition-all duration-300 active:scale-[0.98]"
            >
              Rester Gratuit
            </Button>
          </div>
        </div>

        {/* PRICING CARD 2: PRO */}
        <div className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-tertiary text-on-tertiary-container px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] z-10 shadow-lg">
            Recommandé
          </div>
          <div className="bg-primary-container p-10 rounded-xl shadow-2xl relative overflow-hidden ring-4 ring-primary-container">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[120px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
            </div>
            <div className="flex flex-col h-full relative z-10">
              <div className="mb-8">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-primary-container mb-2 block">Artisan Flow Pro</span>
                <h2 className="text-3xl font-bold text-white">Version Pro</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 mb-12">
                <div className="bg-primary/40 p-6 rounded-lg border border-white/10">
                  <div className="text-4xl font-black text-white mb-1">
                    {isYearly ? '199.99€' : '22.00€'}
                    <span className="text-lg text-on-primary-container font-medium"> /{isYearly ? 'an' : 'mois'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-tertiary-container bg-tertiary px-2 py-0.5 rounded">
                      {isYearly ? 'Économisez 24%' : 'Sans engagement'}
                    </span>
                    {isYearly && <span className="text-xs text-on-primary-container italic">~16€ /mois</span>}
                  </div>
                </div>
              </div>
              <ul className="space-y-4 mb-12 flex-grow">
                <li className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-on-tertiary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-sm font-bold">Devis & Factures illimités</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-on-tertiary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-sm font-bold">Signatures électroniques</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-on-tertiary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-sm font-bold">Paiements Stripe intégrés</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-on-tertiary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-sm font-bold">Relances automatiques</span>
                </li>
              </ul>
              <Button 
                onClick={handleSelectPro}
                isLoading={isLoading && selectedPlan === 'pro'}
                className="w-full py-6 text-base font-black uppercase tracking-[0.25em] bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-tertiary rounded-lg shadow-xl hover:brightness-110 transition-all duration-300 active:scale-[0.98]"
              >
                Passer Pro
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SECTION FROM HTML */}
      <section className="mt-32 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <img 
              alt="Tablette de chantier" 
              className="w-full h-[400px] object-cover rounded-xl shadow-2xl" 
              src="https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80&w=2000" 
            />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-3xl font-black tracking-tight text-primary leading-tight">Conçu par des artisans, pour des artisans.</h3>
            <p className="text-secondary leading-relaxed">ArtisanFlow n'est pas qu'un outil de facturation. C'est votre bras droit sur le chantier et au bureau. Nous avons automatisé tout ce qui vous fait perdre du temps.</p>
            <div className="flex gap-4">
              <div className="p-4 bg-surface-container-high rounded-lg flex-1">
                <div className="text-2xl font-black text-primary mb-1">12h</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-outline">Gagnées par semaine</div>
              </div>
              <div className="p-4 bg-surface-container-high rounded-lg flex-1">
                <div className="text-2xl font-black text-primary mb-1">+30%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-outline">Taux d'acceptation</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
