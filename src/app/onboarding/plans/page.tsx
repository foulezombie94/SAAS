'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { setFreePlan, createSubscriptionSession } from '../actions'
import { toast } from 'sonner'
import { 
  CheckCircle2, 
  ChevronRight, 
  Verified, 
  HardHat, 
  XCircle,
  ShieldCheck,
  CalendarDays,
  LayoutDashboard
} from 'lucide-react'

export default function PlansPage() {
  const [isYearly, setIsYearly] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const router = useRouter()

  // Use price IDs from environment variables
  // Price IDs are now handled server-side for enhanced security

  const handleSelectFree = async () => {
    setIsLoading(true)
    setSelectedPlan('free')
    try {
      const response = await setFreePlan()
      if (response?.error) {
        throw new Error(response.error)
      }
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
      const planType = isYearly ? 'yearly' : 'monthly'
      const response = await createSubscriptionSession(planType)
      
      if (response?.error) {
        throw new Error(response.error)
      }
      if (response?.data?.url) {
        window.location.href = response.data.url
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’initialisation du paiement')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-4 md:pt-8 pb-0">
      
      {/* BREADCRUMBS */}
      <div className="max-w-xl mx-auto mb-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-1 w-full bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Compte créé</span>
          </div>
          <div className="w-8 flex justify-center">
            <ChevronRight className="text-primary opacity-50" size={14} />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-1 w-full bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Choix de l'offre</span>
          </div>
          <div className="w-8 flex justify-center">
            <ChevronRight className="text-slate-200" size={14} />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-1 w-full bg-surface-container-highest rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Prêt à travailler</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-primary mb-6">Propulsez votre activité.</h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">Simplifiez votre gestion administrative et concentrez-vous sur ce que vous faites de mieux : bâtir.</p>
        
        {/* Toggle Mensuel / Annuel */}
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
                <CheckCircle2 className="text-primary" size={18} />
                <span className="text-sm font-medium">3 clients maximum</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface">
                <CheckCircle2 className="text-primary" size={18} />
                <span className="text-sm font-medium">3 devis / factures</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface">
                <CheckCircle2 className="text-primary" size={18} />
                <span className="text-sm font-medium">Signature électronique incluise</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface">
                <CheckCircle2 className="text-primary" size={18} />
                <span className="text-sm font-medium">Paiements en ligne</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface opacity-40">
                <XCircle className="text-slate-400" size={18} />
                <span className="text-sm font-medium">Envoi d'email intégré</span>
              </li>
            </ul>
            <Button 
                onClick={handleSelectFree}
                isLoading={isLoading && selectedPlan === 'free'}
                variant="outline"
                className="w-full h-12 border-primary text-primary"
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
              <ShieldCheck className="text-white" size={120} />
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
                  <ShieldCheck className="text-on-tertiary-container" size={18} />
                  <span className="text-sm font-bold">Devis & Factures illimités</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <ShieldCheck className="text-on-tertiary-container" size={18} />
                  <span className="text-sm font-bold">Signatures électroniques</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <ShieldCheck className="text-on-tertiary-container" size={18} />
                  <span className="text-sm font-bold">Paiements Stripe intégrés</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <ShieldCheck className="text-on-tertiary-container" size={18} />
                  <span className="text-sm font-bold">Relances automatiques</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <ShieldCheck className="text-on-tertiary-container" size={18} />
                  <span className="text-sm font-bold">Envoi d'email avec SMTP</span>
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CalendarDays className="text-on-tertiary-container" size={18} />
                  <span className="text-sm font-bold">Agenda Interactif Pro</span>
                </li>
              </ul>
              <Button 
                onClick={handleSelectPro}
                isLoading={isLoading && selectedPlan === 'pro'}
                className="w-full h-14 bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-tertiary shadow-xl hover:brightness-110"
              >
                Passer Pro
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
