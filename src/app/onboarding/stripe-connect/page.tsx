'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { createStripeAccount, createStripeOnboardingLink, getStripeAccountStatus } from '@/app/dashboard/settings/actions'
import { toast } from 'sonner'
import { CheckCircle2, ChevronRight, Landmark, RefreshCw } from 'lucide-react'

export default function StripeConnectOnboarding() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [status, setStatus] = useState<{ isReady: boolean; exists: boolean }>({ isReady: false, exists: false })
  const router = useRouter()

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const data = await getStripeAccountStatus()
      setStatus(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOnboarding = async () => {
    setIsRedirecting(true)
    try {
      // 1. Ensure account exists
      if (!status.exists) {
        await createStripeAccount()
      }
      
      // 2. Get onboarding link
      const result = await createStripeOnboardingLink('/onboarding/stripe-connect')
      if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error('Impossible de générer le lien Stripe')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la connexion Stripe')
      setIsRedirecting(false)
    }
  }

  const handleNext = () => {
    if (status.isReady) {
      router.push('/onboarding/plans')
    } else {
      toast.error('Veuillez finaliser la connexion Stripe Connect avant de continuer.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-xl mx-auto mb-16 px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-1 w-full bg-primary rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Compte créé</span>
          </div>
          <div className="w-8 flex justify-center">
            <ChevronRight className="text-primary opacity-20" size={16} />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1 opacity-40">
            <div className="h-1 w-full bg-slate-200 rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Choix de l'offre</span>
          </div>
          <div className="w-8 flex justify-center">
            <ChevronRight className="text-primary opacity-20" size={16} />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1 opacity-40">
            <div className="h-1 w-full bg-slate-200 rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Prêt à travailler</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 text-primary shadow-inner">
          <Landmark size={32} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-primary mb-6">
          Sécurisez vos revenus avec Stripe Connect
        </h1>
        
        <p className="text-lg text-slate-500 mb-12 leading-relaxed">
          Pour recevoir les paiements de vos chantiers directement sur votre compte bancaire, vous devez activer votre porte-monnaie professionnel.
        </p>

        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50 mb-10">
          {status.isReady ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Coordonnées bancaires validées</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Votre compte est prêt à recevoir des fonds</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-left space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-1">1</div>
                  <p className="text-sm text-slate-600 font-medium">Configurez votre compte de virement sécurisé.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-1">2</div>
                  <p className="text-sm text-slate-600 font-medium">Ajoutez vos informations bancaires (IBAN).</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-1">3</div>
                  <p className="text-sm text-slate-600 font-medium">Recevez vos paiements sous 48h après validation.</p>
                </div>
              </div>

              <Button 
                onClick={handleStartOnboarding}
                isLoading={isRedirecting}
                className="w-full h-16 rounded-2xl bg-[#635BFF] hover:bg-[#534be5] text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-indigo-200"
              >
                Activer mon compte de paiement
              </Button>
            </div>
          )}
        </div>

        <Button 
          onClick={handleNext}
          disabled={!status.isReady}
          variant={status.isReady ? 'primary' : 'outline'}
          className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all ${status.isReady ? 'bg-primary text-white hover:scale-[1.02]' : 'opacity-50 grayscale'}`}
        >
          {status.isReady ? 'Suivant : Choisir mon offre' : 'En attente de validation bancaire...'}
          {status.isReady && <ChevronRight size={20} className="ml-2" />}
        </Button>
        
        {!status.isReady && status.exists && (
           <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={checkStatus}>
              Actualiser le statut de ma connexion
           </p>
        )}
      </div>
    </div>
  )
}
