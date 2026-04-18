'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  getProfile, 
  updateProfile, 
  getStripeAccountStatus, 
  updateNotificationPreferences, 
  createStripeOnboardingLink,
  createStripeDashboardLink,
  disconnectStripe
} from './actions'
import { Profile } from '@/types/dashboard'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  RefreshCw, 
  Mail, 
  Award, 
  CheckCircle2, 
  Rocket, 
  ShieldCheck, 
  Edit3, 
  Edit,
  Save, 
  ExternalLink, 
  Bell, 
  Eye, 
  Wallet, 
  Clock,
  User,
  X,
  PlusCircle,
  Building2,
  Phone,
  FileText,
  Languages,
  BadgeCheck,
  CreditCard,
  LogOut,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Users2,
  Globe
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/components/providers/LanguageProvider'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStripeLoading, setIsStripeLoading] = useState(false)
  const [stripeStatus, setStripeStatus] = useState({ isReady: false, exists: false, detailsSubmitted: false, chargesEnabled: false, accountId: '' })
  const { t } = useI18n()
  const router = useRouter()
  const initialized = useRef(false)

  // Local state for modal editing
  const [editData, setEditData] = useState<Partial<Profile>>({})

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await getProfile()
      if (data) {
        setProfile(data)
        setEditData(data)
        if (data.stripe_account_id) {
          const status = await getStripeAccountStatus()
          setStripeStatus(status as any)
        }
      }
    } catch (err) {
      toast.error('Erreur lors du chargement du profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = () => {
    setEditData({ ...profile })
    setIsModalOpen(true)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const result = await updateProfile(editData as any)
      if (result.success) {
        setProfile({ ...editData })
        toast.success('Profil mis à jour avec succès')
        setIsModalOpen(false)
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStripeOnboarding = async () => {
    setIsStripeLoading(true)
    try {
      const result = await createStripeOnboardingLink('/dashboard/profile')
      if (result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.error || 'Erreur Stripe')
      }
    } catch (err) {
      toast.error('Erreur lors du lancement de Stripe')
    } finally {
      setIsStripeLoading(false)
    }
  }

  const handleStripeDashboard = async () => {
    setIsStripeLoading(true)
    try {
      const result = await createStripeDashboardLink()
      if (result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.error || 'Erreur Stripe')
      }
    } catch (err) {
      toast.error('Erreur lors de l’accès au tableau de bord Stripe')
    } finally {
      setIsStripeLoading(false)
    }
  }

  const handleDisconnectStripe = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter votre compte Stripe ?')) return
    setIsStripeLoading(true)
    try {
      await disconnectStripe()
      setStripeStatus({ isReady: false, exists: false, detailsSubmitted: false, chargesEnabled: false, accountId: '' })
      toast.success('Compte Stripe déconnecté')
    } catch (err) {
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setIsStripeLoading(false)
    }
  }

  const togglePref = async (id: string) => {
    const currentPrefs = profile.notification_preferences || {}
    const newPrefs = { ...currentPrefs, [id]: !currentPrefs[id as keyof typeof currentPrefs] }
    
    setProfile(prev => ({ ...prev, notification_preferences: newPrefs }))
    
    try {
      await updateNotificationPreferences(newPrefs)
    } catch (err) {
      toast.error('Erreur de sauvegarde')
      setProfile(prev => ({ ...prev, notification_preferences: currentPrefs }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <RefreshCw className="text-[#00236f]" size={40} />
        </motion.div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Chargement ArtisanFlow...</p>
      </div>
    )
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-6 flex flex-col gap-6 relative">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <div className="flex items-center gap-3 mb-1">
           <div className="w-10 h-10 bg-blue-50 text-[#00236f] rounded-xl flex items-center justify-center shadow-sm">
              <User size={20} />
           </div>
           <div>
              <h1 className="text-3xl font-black text-[#00236f] tracking-tighter font-headline leading-none">Profil & Préférences</h1>
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mt-1.5">Votre identité et centre de contrôle</p>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card Section */}
        <motion.section 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className="lg:col-span-12 bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,35,111,0.03)] border border-slate-100 flex flex-col md:flex-row gap-8 items-center justify-between group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-32 -translate-y-32 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="flex-1 flex flex-col sm:flex-row gap-8 items-center relative z-10 w-full">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-[#00236f] shadow-inner shrink-0 relative">
               <User size={40} />
               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle2 className="text-white" size={10} />
               </div>
            </div>
            <div className="text-center sm:text-left space-y-2">
               <h2 className="text-3xl font-black text-[#00236f] tracking-tight">{profile.first_name} {profile.last_name}</h2>
               <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <Mail size={14} className="text-slate-300" />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <Building2 size={14} className="text-slate-300" />
                    {profile.company_name || 'Échoppe Artisanale'}
                  </div>
               </div>
            </div>
          </div>

          <button 
            onClick={handleOpenModal}
            className="shrink-0 bg-[#00236f] hover:bg-[#001b54] text-white font-black uppercase tracking-widest text-[10px] py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-900/10 flex items-center gap-3 relative z-10"
          >
            <Edit3 size={16} />
            Modifier mes informations
          </button>
        </motion.section>

        {/* Notification Preferences Square Box */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.2 }}
          className="lg:col-span-5 bg-slate-50 p-6 md:p-8 rounded-[2rem] flex flex-col gap-4 border border-slate-100/50 shadow-sm"
        >
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                   <Bell size={20} className="text-[#00236f]" />
                </div>
                <h3 className="text-xl font-black text-[#00236f] tracking-tight leading-none">Centre d&apos;Alertes</h3>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 bg-white/50 py-1.5 px-3 rounded-lg border border-slate-100 shadow-sm">
                💡 <span className="text-blue-600">Note :</span> Cliquez pour <span className="text-rose-500">enlever</span>/activer.
             </p>
          </div>

          <div className="grid grid-cols-2 gap-3 aspect-square">
            {[
              { id: 'quotes_viewed', label: 'Surveillance Devis', icon: <Eye size={24} />, color: 'blue' },
              { id: 'quotes_accepted', label: 'Signatures Reçues', icon: <BadgeCheck size={24} />, color: 'emerald' },
              { id: 'payments_received', label: 'Lien Paiement', icon: <Wallet size={24} />, color: 'indigo' },
              { id: 'quotes_expired', label: 'Fin de validité', icon: <Clock size={24} />, color: 'amber' }
            ].map((item) => {
              const isActive = profile.notification_preferences?.[item.id as keyof typeof profile.notification_preferences] !== false
              return (
                <button
                  key={item.id}
                  onClick={() => togglePref(item.id)}
                  className={`relative flex flex-col items-center justify-center gap-4 rounded-[2rem] border-2 transition-all active:scale-95 group overflow-hidden ${
                    isActive 
                      ? 'bg-white border-blue-100 shadow-[0_8px_20px_rgba(0,35,111,0.04)]' 
                      : 'bg-slate-100/50 border-transparent opacity-60 grayscale'
                  }`}
                >
                   <div className={`p-4 rounded-2xl transition-all ${isActive ? `bg-${item.color}-50 text-${item.color}-600` : 'bg-slate-200 text-slate-400'}`}>
                      {item.icon}
                   </div>
                   <span className={`text-[9px] font-black uppercase tracking-widest text-center px-4 leading-tight ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                      {item.label}
                   </span>
                   {isActive && <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-${item.color}-500 shadow-[0_0_8px_${item.color}-400] animate-pulse`} />}
                </button>
              )
            })}
          </div>
        </motion.section>

        {/* Pro Plan Status Section */}
        <motion.section 
          initial={{ opacity: 0, x: 10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.3 }}
          className="lg:col-span-7 bg-[#00236f] flex flex-col justify-between p-8 md:p-10 rounded-[2rem] overflow-hidden relative shadow-2xl shadow-blue-900/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00236f] to-[#011a5e]" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6 h-full justify-between">
            <div className="space-y-4">
              <div className="inline-flex px-3 py-1.5 bg-white/10 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 shadow-inner">
                Intelligence d&apos;Abonnement
              </div>
              <h3 className="text-4xl font-black text-white font-headline leading-tight tracking-tighter">
                {profile.is_pro ? 'Contrôle Pro Activé' : 'Accès Standard'}
              </h3>
              <p className="text-blue-200 text-sm font-medium leading-relaxed max-w-xl">
                {profile.is_pro 
                  ? "Votre puissance artisanale est à 100%. Profitez de l'envoi illimité."
                  : "Débloquez tout le potentiel d'ArtisanFlow pour automatiser votre croissance."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {profile.is_pro ? (
                <>
                  <div className="flex-1 flex flex-col gap-4">
                     <button 
                       onClick={stripeStatus.exists ? handleStripeDashboard : handleStripeOnboarding}
                       disabled={isStripeLoading}
                       className="w-full bg-white hover:bg-slate-50 text-[#00236f] font-black uppercase tracking-widest text-[11px] py-5 px-10 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isStripeLoading ? <RefreshCw className="animate-spin" size={18} /> : (stripeStatus.isReady ? <CreditCard size={18} /> : <AlertCircle size={18} />)}
                        {stripeStatus.isReady ? 'Gestion Paiements Stripe' : 'Finaliser Configuration Stripe'}
                     </button>
                     {stripeStatus.exists && (
                       <button 
                         onClick={handleDisconnectStripe}
                         title="Déconnecter Stripe"
                         className="text-white/40 hover:text-white/100 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors py-2"
                       >
                         <LogOut size={12} /> Déconnecter Stripe
                       </button>
                     )}
                  </div>
                  <Link href="/dashboard/profile/email" className="flex-1">
                    <button className="w-full h-[64px] bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[11px] py-5 px-10 rounded-2xl transition-all border border-white/10 backdrop-blur-md flex items-center justify-center gap-3">
                       <Mail size={16} /> Paramètres Email
                    </button>
                  </Link>
                </>
              ) : (
                <Link href="/onboarding/plans" className="w-full">
                  <button className="w-full bg-amber-400 hover:bg-amber-300 text-[#00236f] font-black uppercase tracking-widest text-[12px] py-6 px-12 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-4 shadow-2xl shadow-amber-500/30">
                    <Rocket className="w-6 h-6" />
                    ACTIVER L&apos;ACCÈS PRO
                  </button>
                </Link>
              )}
            </div>
          </div>
        </motion.section>
      </div>

      {/* FLOATING MODAL - PREMIUM REDESIGN */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] cursor-pointer"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[5%] left-1/2 -translate-x-1/2 w-[90%] max-w-4xl max-h-[90vh] bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] z-[101] overflow-hidden flex flex-col border border-white/20"
            >
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-100/50 text-[#00236f] rounded-2xl">
                      <Edit size={24} />
                   </div>
                   <div>
                      <h4 className="text-3xl font-black text-[#00236f] tracking-tight leading-none uppercase italic">Modifier votre Identité</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Mise à jour instantanée de vos données artisanales</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 hover:bg-slate-200/50 rounded-2xl transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-white scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                  {/* Personal Info Group */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prénom du Gérant</label>
                    <input 
                      className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f]" 
                      type="text" 
                      value={editData.first_name || ''}
                      onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom du Gérant</label>
                    <input 
                      className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f]" 
                      type="text" 
                      value={editData.last_name || ''}
                      onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                    />
                  </div>

                  {/* Company Info Group */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Enseigne Commerciale</label>
                    <div className="relative group">
                       <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <input 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] focus:ring-0 pl-14 pr-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] placeholder:text-slate-300" 
                         type="text" 
                         placeholder="Nom de l'entreprise"
                         value={editData.company_name || ''}
                         onChange={(e) => setEditData({...editData, company_name: e.target.value})}
                       />
                    </div>
                  </div>

                  {/* Siret */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Numéro SIRET</label>
                    <div className="relative group">
                       <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <input 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] focus:ring-0 pl-14 pr-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] placeholder:text-slate-300" 
                         type="text" 
                         placeholder="14 chiffres"
                         value={editData.siret || ''}
                         onChange={(e) => setEditData({...editData, siret: e.target.value})}
                       />
                    </div>
                  </div>

                  {/* Forme Juridique */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Forme Juridique</label>
                    <div className="relative group">
                       <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <select 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] pl-14 pr-10 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] appearance-none cursor-pointer"
                         value={editData.legal_form || ''}
                         onChange={(e) => setEditData({...editData, legal_form: e.target.value})}
                       >
                         <option value="">Sélectionner...</option>
                         <option value="Auto-entreprise">Auto-entreprise / EI</option>
                         <option value="SAS / SASU">SAS / SASU</option>
                         <option value="SARL / EURL">SARL / EURL</option>
                         <option value="SA">SA</option>
                         <option value="Autre">Autre</option>
                       </select>
                    </div>
                  </div>

                  {/* TVA Intra */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">N° TVA Intracommunautaire</label>
                    <div className="relative group">
                       <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <input 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] focus:ring-0 pl-14 pr-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] placeholder:text-slate-300" 
                         type="text" 
                         placeholder="FR..."
                         value={editData.tva_intra || ''}
                         onChange={(e) => setEditData({...editData, tva_intra: e.target.value})}
                       />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Téléphonique</label>
                    <div className="relative group">
                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <input 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] focus:ring-0 pl-14 pr-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f]" 
                         type="tel" 
                         value={editData.phone || ''}
                         onChange={(e) => setEditData({...editData, phone: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email de Contact</label>
                    <div className="relative group">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors" size={20} />
                       <input 
                         className="w-full bg-slate-100 border-2 border-transparent px-6 py-4 pl-14 rounded-2xl font-bold text-sm text-slate-500 cursor-not-allowed" 
                         type="email" 
                         value={profile.email || ''}
                         readOnly
                       />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Adresse de l&apos;Entreprise</label>
                    <textarea 
                      className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-5 rounded-2xl transition-all font-bold text-sm text-[#00236f] resize-none" 
                      rows={2}
                      placeholder="Adresse complète"
                      value={editData.address || ''}
                      onChange={(e) => setEditData({...editData, address: e.target.value})}
                    />
                  </div>

                  {/* Business Description */}
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description des Services</label>
                    <textarea 
                      className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-5 rounded-2xl transition-all font-bold text-sm text-[#00236f] resize-none" 
                      rows={3}
                      placeholder="Description de vos activités..."
                      value={editData.business_description || ''}
                      onChange={(e) => setEditData({...editData, business_description: e.target.value})}
                    />
                  </div>

                  {/* Statistics & Revenue */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre de Contacts</label>
                    <div className="relative group">
                       <Users2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <select 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] pl-14 pr-10 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] appearance-none cursor-pointer"
                         value={editData.num_contacts || ''}
                         onChange={(e) => setEditData({...editData, num_contacts: e.target.value})}
                       >
                         <option value="">Sélectionner...</option>
                         <option value="1-10">1 - 10</option>
                         <option value="11-50">11 - 50</option>
                         <option value="51-200">51 - 200</option>
                         <option value="200+">200+</option>
                       </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CA Annuel Estimé</label>
                    <div className="relative group">
                       <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <select 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] pl-14 pr-10 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] appearance-none cursor-pointer"
                         value={editData.annual_revenue || ''}
                         onChange={(e) => setEditData({...editData, annual_revenue: e.target.value})}
                       >
                         <option value="">Sélectionner...</option>
                         <option value="0-50k">0 - 50k €</option>
                         <option value="50k-150k">50k - 150k €</option>
                         <option value="150k-500k">150k - 500k €</option>
                         <option value="500k+">500k € +</option>
                       </select>
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Langue Préférée</label>
                    <div className="relative group">
                       <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#00236f] transition-colors" size={20} />
                       <select 
                         className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] pl-14 pr-10 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] appearance-none cursor-pointer"
                         value={editData.preferred_language || 'fr'}
                         onChange={(e) => setEditData({...editData, preferred_language: (e.target.value as 'fr' | 'en' | 'es')})}
                       >
                         <option value="fr">Français</option>
                         <option value="en">English (International)</option>
                         <option value="es">Español</option>
                       </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 px-10 border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95"
                >
                  Annuler l&apos;Édition
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 py-5 px-10 bg-[#00236f] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#001b54] transition-all active:scale-95 shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  Enregistrer les Modifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
