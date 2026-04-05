'use client'

import React, { useState, useEffect } from 'react'
import { getProfile, updateProfile, createStripeOnboardingLink, disconnectStripe, getStripeAccountStatus } from './actions'
import { Profile } from '@/types/dashboard'
import { toast } from 'sonner'
import Link from 'next/link'
import { RefreshCw, Mail } from 'lucide-react'

// Mapped SVG or lucide icons to replace material icons
// using material-symbols format as the html requested, but adding standard ones if needed.
// The HTML uses Google Material Symbols Outlined font which is nice.

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({
    company_name: '',
    address: '',
    phone: '',
    siret: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [stripeStatus, setStripeStatus] = useState<{ isReady: boolean; exists: boolean; detailsSubmitted?: boolean }>({ isReady: false, exists: false })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await getProfile()
      if (data) {
        setProfile(data)
        if (data.stripe_account_id) {
          const status = await getStripeAccountStatus()
          setStripeStatus(status)
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement du profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile({
        company_name: profile.company_name || '',
        siret: profile.siret || '',
        address: profile.address || '',
        phone: profile.phone || '',
      })
      toast.success('Paramètres enregistrés avec succès')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setIsLoading(true)
    loadProfile()
  }

  const handleConnectStripe = async () => {
    setIsConnecting(true)
    try {
      const { url } = await createStripeOnboardingLink()
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la connexion Stripe')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectStripe = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter votre compte Stripe ? Vos clients ne pourront plus payer par carte.')) return
    
    setIsConnecting(true)
    try {
      await disconnectStripe()
      toast.success('Compte Stripe déconnecté')
      loadProfile()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la déconnexion')
    } finally {
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[500px]">
        <RefreshCw className="animate-spin text-blue-900 mb-4" size={32} />
        <p className="text-sm font-medium text-slate-500">Chargement des paramètres...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-12 space-y-12">
      {/* Header Section (Asymmetric) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-slate-600 mb-2">Workspace Configuration</p>
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">Contrôles d'Entreprise</h3>
          <p className="text-slate-500 max-w-xl">Configurez votre identité d'entreprise, vos normes légales et le traitement des paiements. Ces paramètres ont un impact direct sur vos documents générés et la facturation client.</p>
        </div>
        <div className="flex items-end justify-start lg:justify-end">
          {/* Job Status Slab */}
          <div className="h-12 flex items-center px-6 bg-amber-100 text-amber-900 rounded-lg">
            <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-[11px] font-bold uppercase tracking-widest">Compte Entreprise Actif</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Company Profile Card */}
        <div className="md:col-span-8 bg-white rounded-xl p-8 shadow-[0px_24px_48px_rgba(0,35,111,0.06)] flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight">Profil de l'Entreprise</h4>
            <span className="material-symbols-outlined text-slate-400">business</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Nom de l'Entreprise</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm" 
                type="text" 
                value={profile.company_name || ''}
                onChange={(e) => setProfile({...profile, company_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">SIRET / TVA</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm" 
                placeholder="123 456 789 00012" 
                type="text"
                value={profile.siret || ''}
                onChange={(e) => setProfile({...profile, siret: e.target.value})}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Adresse de l'Entreprise</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm" 
                type="text" 
                value={profile.address || ''}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Numéro de Téléphone</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm" 
                type="tel" 
                value={profile.phone || ''}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Email de Contact</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm opacity-70 cursor-not-allowed" 
                type="email" 
                value={profile.email || ''}
                disabled
                title="L'adresse email principale est liée à votre compte Auth."
              />
            </div>
          </div>
        </div>

        {/* Subscription & Integrations Section */}
        <div className="md:col-span-4 flex flex-col gap-8">
          {/* Subscription Card */}
          <div className="bg-[#1e3a8a] bg-gradient-to-br from-[#1e3a8a] to-[#00236f] text-white rounded-xl p-8 flex flex-col justify-between flex-1">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-blue-200">Niveau Actuel</p>
                  <h4 className="text-2xl font-black tracking-tight">Plan Pro</h4>
                </div>
                <span className="material-symbols-outlined text-4xl opacity-50 text-amber-300">workspace_premium</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                  Devis & Factures Illimités
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                  Paiement en ligne (Stripe)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                  Support Email Prioritaire
                </li>
              </ul>
            </div>
            <div className="mt-8 space-y-3">
              <button className="w-full h-12 bg-white text-[#00236f] font-bold rounded-lg hover:scale-[0.98] transition-transform">
                Gérer la Facturation
              </button>
            </div>
          </div>
          
          {/* Email Settings Link Card - Specially requested to keep separate but linked */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                 <Mail size={18} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-900">Configuration Email</h4>
                  <p className="text-xs text-slate-500">Serveur SMTP et paramètres d'envoi</p>
               </div>
             </div>
             <Link href="/dashboard/settings/email" className="w-full h-10 mt-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                Gérer les e-mails <span className="material-symbols-outlined text-sm">open_in_new</span>
             </Link>
          </div>
        </div>

        {/* Tax & Legal Card */}
        <div className="md:col-span-6 bg-slate-50 rounded-xl p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight">Conformité Fiscale & Légale</h4>
            <span className="material-symbols-outlined text-slate-400">policy</span>
          </div>
          <div className="space-y-4">
            <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500 block">Taux de TVA par défaut</label>
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-3 rounded-lg bg-[#00236f] text-white font-bold text-sm">20%</button>
              <button className="px-6 py-3 rounded-lg bg-white text-slate-700 font-medium border border-slate-200 text-sm">10%</button>
              <button className="px-6 py-3 rounded-lg bg-white text-slate-700 font-medium border border-slate-200 text-sm">5.5%</button>
              <button className="px-6 py-3 rounded-lg bg-white text-slate-700 font-medium border border-slate-200 text-sm">0% (Exempt)</button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Note: Ce paramètre sera implémenté dans une prochaine version.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Note de bas de page par défaut (Factures)</label>
            <textarea 
              className="w-full bg-white border border-slate-200 rounded-lg focus:border-[#00236f] focus:ring-2 focus:ring-blue-100 p-3 text-sm transition-all resize-none font-medium" 
              placeholder="Saisissez les conditions de paiement, frais de retard, mentions légales..." 
              rows={4}
              defaultValue="Le règlement des factures est attendu à réception. En cas de retard de paiement, une pénalité égale à 3 fois le taux d'intérêt légal sera appliquée. Aucun escompte pour paiement anticipé. Tout litige relève de la compétence du Tribunal de Commerce."
            ></textarea>
          </div>
        </div>

        {/* Payments Section */}
        <div className="md:col-span-6 bg-slate-50 rounded-xl p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight">Passerelles de Paiement</h4>
            <span className="material-symbols-outlined text-slate-400">account_balance_wallet</span>
          </div>
          
          <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-[#635BFF] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.8 14.8C16.8 14.8 15.2 15.8 15.2 17.8C15.2 21.2 20.4 20 20.4 23.4C20.4 24.2 19.6 24.8 18.2 24.8C16.4 24.8 14.2 24.2 12 23.2V27.4C14.2 28.4 16.4 28.8 18.6 28.8C20.8 28.8 22.4 27.8 22.4 25.8C22.4 22.2 17.2 23.4 17.2 20C17.2 19.2 18 18.8 19.4 18.8C20.8 18.8 22.6 19.2 24.4 20V16C22.6 15.2 20.8 14.8 18.8 14.8Z" fill="white"/>
                </svg>
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-900">Paiements Stripe</h5>
                <p className="text-xs text-slate-500">
                  {!stripeStatus.exists ? 'API Non configurée' : (stripeStatus.isReady ? 'Compte Connecté' : 'Configuration incomplète')}
                </p>
              </div>
            </div>
            {!stripeStatus.exists ? (
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                Inactif
              </div>
            ) : stripeStatus.isReady ? (
              <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Activé
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Incomplet
              </div>
            )}
          </div>
          
          <p className="text-sm text-slate-600 leading-relaxed">
            {!stripeStatus.exists 
              ? "Connectez votre compte Stripe pour accepter les paiements par carte bancaire. Les fonds seront versés directement sur votre compte."
              : stripeStatus.isReady 
                ? "Vos paiements sont gérés via votre compte Stripe Connect. Les fonds sont versés directement sur votre compte bancaire."
                : "Votre compte Stripe est créé mais n'est pas encore prêt à recevoir des fonds. Terminez la configuration sur Stripe."}
          </p>
          
          <div className="mt-auto flex flex-col gap-3">
            {!stripeStatus.isReady && stripeStatus.exists && (
              <button 
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="h-14 bg-amber-100 text-amber-900 font-black rounded-lg hover:bg-amber-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <span className="material-symbols-outlined">pending_actions</span>}
                TERMINER LA CONFIGURATION
              </button>
            )}

            {!stripeStatus.exists && (
              <button 
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="h-14 bg-[#635BFF] text-white font-black rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <span className="material-symbols-outlined">add_link</span>}
                CONNECTER MON COMPTE STRIPE
              </button>
            )}

            {stripeStatus.exists && (
              <button 
                onClick={handleDisconnectStripe}
                disabled={isConnecting}
                className="h-14 bg-red-50 text-red-700 font-black rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 text-xs"
              >
                {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <span className="material-symbols-outlined text-sm">link_off</span>}
                DÉCONNECTER LE COMPTE STRIPE
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex justify-end pt-8 pb-16">
        <div className="flex gap-4">
          <button 
            onClick={handleDiscard}
            disabled={isSaving}
            className="px-8 py-4 text-slate-600 font-bold hover:bg-slate-100 transition-colors rounded-lg disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-4 bg-[#00236f] text-white font-bold rounded-lg hover:scale-[0.98] transition-transform shadow-xl shadow-blue-900/20 flex items-center gap-3 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <span className="material-symbols-outlined">save</span>}
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  )
}
