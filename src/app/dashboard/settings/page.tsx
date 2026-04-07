'use client'

import React, { useState, useEffect } from 'react'
import { getProfile, updateProfile, createStripeOnboardingLink, disconnectStripe, getStripeAccountStatus, updateNotificationPreferences, createStripeDashboardLink } from './actions'
import { Profile } from '@/types/dashboard'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { RefreshCw, Mail, Verified, Building2, Award, CheckCircle2, Rocket, ShieldCheck, Wallet, Clock, Link2, Unlink, Save, ExternalLink, Bell, Eye, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({
    company_name: '',
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    siret: '',
    email: '',
    num_contacts: undefined,
    annual_revenue: undefined,
    preferred_language: 'fr',
    notification_preferences: {
      quotes_viewed: true,
      quotes_accepted: true,
      payments_received: true,
      quotes_expired: true
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [stripeStatus, setStripeStatus] = useState<{ isReady: boolean; exists: boolean; detailsSubmitted?: boolean; chargesEnabled?: boolean }>({ isReady: false, exists: false })
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    loadProfile()
    
    // 🛡️ Gestion des retours Stripe (Succès / Refresh)
    const stripeParam = searchParams.get('stripe')
    if (stripeParam === 'success') {
      toast.success('Profil Stripe mis à jour avec succès !', {
        icon: <CheckCircle2 className="text-green-500" />
      })
      // Clear the param to avoid repeated toasts on refresh
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    } else if (stripeParam === 'refresh') {
      toast.warning('La session a expiré. Un nouveau lien sera généré au clic.', {
        icon: <RefreshCw className="text-amber-500" />
      })
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

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
      const result = await updateProfile({
        company_name: profile.company_name || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        siret: profile.siret || '',
        address: profile.address || '',
        phone: profile.phone || '',
        num_contacts: profile.num_contacts || null,
        annual_revenue: profile.annual_revenue || null,
        preferred_language: (profile.preferred_language as 'fr' | 'en' | 'es') || 'fr',
      })
      if (result.success) {
        toast.success('Paramètres enregistrés avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err: any) {
      toast.error('Erreur lors de la sauvegarde')
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
      const result = await createStripeOnboardingLink()
      if (result.url) {
        window.location.href = result.url
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (err: any) {
      toast.error('Erreur lors de la connexion Stripe')
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

  const handleManageStripe = async () => {
    setIsConnecting(true)
    try {
      const result = await createStripeDashboardLink()
      if (result.url) {
        window.open(result.url, '_blank')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (err) {
      toast.error('Erreur lors de l’accès au dashboard Stripe')
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
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-slate-600 mb-2">Workspace Configuration</p>
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">Contrôles d'Entreprise</h3>
          <p className="text-slate-500 max-w-xl">Configurez votre identité d'entreprise, vos normes légales et le traitement des paiements. Ces paramètres ont un impact direct sur vos documents générés et la facturation client.</p>
        </div>
        <div className="flex items-end justify-start lg:justify-end">
          <div className="h-12 flex items-center px-6 bg-amber-100 text-amber-900 rounded-lg">
            <Verified className="mr-2" size={18} />
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
            <Building2 className="text-slate-400" size={20} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Prénom</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm" 
                type="text" 
                value={profile.first_name || ''}
                onChange={(e) => setProfile({...profile, first_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Nom</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm" 
                type="text" 
                value={profile.last_name || ''}
                onChange={(e) => setProfile({...profile, last_name: e.target.value})}
              />
            </div>
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
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Nombre de contacts</label>
              <select 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm outline-none"
                value={profile.num_contacts || ''}
                onChange={(e) => setProfile({...profile, num_contacts: e.target.value})}
              >
                <option value="">Sélectionnez...</option>
                <option value="range_0_50">0 à 50</option>
                <option value="range_51_200">51 à 200</option>
                <option value="range_201_500">201 à 500</option>
                <option value="range_501_plus">Plus de 500</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">CA Annuel estimé</label>
              <select 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm outline-none"
                value={profile.annual_revenue || ''}
                onChange={(e) => setProfile({...profile, annual_revenue: e.target.value})}
              >
                <option value="">Sélectionnez...</option>
                <option value="range_under_50k">&lt; 50 000 €</option>
                <option value="range_50k_100k">50k - 100 000 €</option>
                <option value="range_100k_250k">100k - 250 000 €</option>
                <option value="range_250k_plus">Plus de 250 000 €</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">Langue préférée</label>
              <select 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#00236f] focus:ring-0 px-0 py-2 transition-all font-medium text-sm outline-none"
                value={profile.preferred_language || 'fr'}
                onChange={(e) => setProfile({...profile, preferred_language: (e.target.value as 'fr' | 'en' | 'es')})}
              >
                <option value="fr">Français (France)</option>
                <option value="en">English (US)</option>
                <option value="es">Español</option>
              </select>
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
                  <h4 className="text-2xl font-black tracking-tight">{profile.is_pro ? 'Plan Pro' : 'Plan Gratuit'}</h4>
                </div>
                <Award className="text-4xl opacity-30 text-amber-300" size={48} />
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="text-emerald-400" size={16} />
                  {profile.is_pro ? 'Devis & Factures Illimités' : 'Limite de 3 Devis / Factures'}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="text-emerald-400" size={16} />
                  Paiement en ligne (Stripe)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="text-emerald-400" size={16} />
                  {profile.is_pro ? 'Signatures électroniques illimitées' : 'Support Standard'}
                </li>
              </ul>
            </div>
            <div className="mt-8 space-y-3">
              {profile.is_pro ? (
                <button className="w-full h-12 bg-white text-[#00236f] font-bold rounded-lg hover:scale-[0.98] transition-transform">
                  Gérer la Facturation
                </button>
              ) : (
                <Link href="/onboarding/plans" className="block">
                  <button className="w-full h-12 bg-amber-400 text-blue-900 font-bold rounded-lg hover:bg-amber-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95">
                    <Rocket className="w-4 h-4" />
                    PASSER AU PLAN PRO
                  </button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Email Settings Card */}
          {profile.is_pro && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Configuration Email</h4>
                    <p className="text-xs text-slate-500">Serveur SMTP</p>
                  </div>
               </div>
               <Link href="/dashboard/settings/email" className="w-full h-10 mt-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                  Gérer les e-mails <ExternalLink className="w-3.5 h-3.5" />
               </Link>
            </div>
          )}
        </div>

        {/* Notification Preferences Card */}
        <div className="md:col-span-12 bg-white rounded-xl p-8 shadow-[0px_24px_48px_rgba(0,35,111,0.06)] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight">Préférences de Notifications</h4>
            <Bell className="text-slate-400" size={20} />
          </div>
          
          <p className="text-sm text-slate-500 -mt-2">Paramétrez vos alertes visuelles et sonores pour votre tableau de bord.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              { id: 'quotes_viewed', label: 'Devis Ouvert', desc: 'Consultation client', icon: <Eye size={16} /> },
              { id: 'quotes_accepted', label: 'Devis Signé', desc: 'Signature reçue', icon: <CheckCircle2 size={16} /> },
              { id: 'payments_received', label: 'Paiement Reçu', desc: 'Règlement Stripe', icon: <Wallet size={16} /> },
              { id: 'quotes_expired', label: 'Lien Expiré', desc: 'Fin de validité', icon: <Clock size={16} /> }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-900 border border-slate-100">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const currentPrefs = profile.notification_preferences || {}
                    const newPrefs = { ...currentPrefs, [item.id]: !currentPrefs[item.id as keyof typeof currentPrefs] }
                    setProfile({ ...profile, notification_preferences: newPrefs })
                    updateNotificationPreferences(newPrefs).catch(() => toast.error('Erreur de sauvegarde'))
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  profile.notification_preferences?.[item.id as keyof typeof profile.notification_preferences] !== false ? 'bg-[#00236f]' : 'bg-slate-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.notification_preferences?.[item.id as keyof typeof profile.notification_preferences] !== false ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tax & Legal Card */}
        <div className="md:col-span-6 bg-slate-50 rounded-xl p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight">Conformité Fiscale & Légale</h4>
            <ShieldCheck className="text-slate-400" size={20} />
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
              placeholder="Conditions de paiement..." 
              rows={4}
              defaultValue="Le règlement des factures est attendu à réception."
            ></textarea>
          </div>
        </div>

        {/* Payments Section */}
        <div className="md:col-span-6 bg-slate-50 rounded-xl p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold tracking-tight">Passerelles de Paiement</h4>
            <Wallet className="text-slate-400" size={20} />
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
                  {stripeStatus.isReady ? 'Compte Connecté' : 'Non configuré'}
                </p>
              </div>
            </div>
            {stripeStatus.isReady ? (
              <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Activé
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                Inactif
              </div>
            )}
          </div>
          
          <div className="mt-auto flex flex-col gap-3">
            {!stripeStatus.exists ? (
              <button 
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="h-14 bg-[#635BFF] text-white font-black rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <Link2 className="w-5 h-5" />}
                CONNECTER STRIPE
              </button>
            ) : !stripeStatus.isReady ? (
              <div className="space-y-3">
                <button 
                  onClick={handleConnectStripe}
                  disabled={isConnecting}
                  className="w-full h-14 bg-amber-500 text-white font-black rounded-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <AlertCircle className="w-5 h-5" />}
                  COMPLÉTER MON PROFIL STRIPE
                </button>
                <button 
                  onClick={handleDisconnectStripe}
                  disabled={isConnecting}
                  className="w-full h-10 text-slate-400 font-bold text-xs hover:text-red-500 transition-colors"
                >
                  DÉCONNECTER STRIPE (ANNULER)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={handleManageStripe}
                  disabled={isConnecting}
                  className="w-full h-14 bg-[#635BFF] text-white font-black rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck className="w-5 h-5" />}
                  GÉRER MON COMPTE STRIPE
                </button>
                <button 
                  onClick={handleDisconnectStripe}
                  disabled={isConnecting}
                  className="w-full h-10 text-slate-400 font-bold text-xs hover:text-red-500 transition-colors"
                >
                  DÉCONNECTER STRIPE
                </button>
              </div>
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
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save className="w-5 h-5" />}
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  )
}
