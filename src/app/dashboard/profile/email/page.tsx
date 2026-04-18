'use client'

import React, { useState, useEffect } from 'react'
import { 
  Mail, 
  ShieldCheck, 
  Server, 
  Settings,
  Lock, 
  HelpCircle, 
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function EmailSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [config, setConfig] = useState({
    host: '',
    port: '465',
    user: '',
    pass: '',
    from: ''
  })
  const [hasStoredPass, setHasStoredPass] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/smtp')
      const data = await res.json()
      if (data) {
        setConfig({
          host: data.smtp_host || '',
          port: data.smtp_port?.toString() || '465',
          user: data.smtp_user || '',
          pass: data.has_smtp_pass ? '••••••••' : '',
          from: data.smtp_from || ''
        })
        setHasStoredPass(data.has_smtp_pass)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
     try {
      const submitConfig = { ...config }
      if (submitConfig.pass === '••••••••') {
        delete (submitConfig as any).pass
      }

      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', config: submitConfig })
      })
      if (res.ok) {
        toast.success("Paramètres enregistrés avec succès")
        setHasStoredPass(true)
      } else {
        throw new Error("Erreur lors de l'enregistrement")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!config.host || !config.user || !config.pass) {
      toast.error("Veuillez remplir les champs obligatoires pour tester")
      return
    }
    setIsTesting(true)
    const toastId = toast.loading("Test de connexion en cours...")
    try {
      const testConfig = { ...config }
      if (testConfig.pass === '••••••••') {
        testConfig.pass = '__STORED_PASSWORD__'
      }

      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', config: testConfig })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Test réussi ! Un email a été envoyé.", { id: toastId })
      } else {
        throw new Error(data.error || "Échec du test")
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="animate-spin text-[#00236f]" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialisation SMTP...</p>
      </div>
    )
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-12 flex flex-col gap-12 relative">
      {/* Breadcrumb & Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
        <Link href="/dashboard/profile" className="flex items-center gap-2 text-slate-400 hover:text-[#00236f] font-bold text-[10px] uppercase tracking-widest transition-colors group">
           <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
           Retour au profil
        </Link>
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-[#00236f] rounded-2xl flex items-center justify-center shadow-sm">
              <Mail size={24} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-[#00236f] tracking-tighter font-headline leading-none">Messagerie Pro</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Envoyez vos devis avec votre propre adresse</p>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Config Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 bg-white p-10 rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,35,111,0.04)] border border-slate-100 flex flex-col gap-10"
        >
          <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
             <div className="p-3 bg-blue-50 rounded-2xl">
                <Server size={20} className="text-[#00236f]" />
             </div>
             <h2 className="text-xl font-black text-[#00236f] tracking-tight uppercase italic">Configuration Technique</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Serveur SMTP</label>
              <input 
                type="text" 
                placeholder="smtp.votredomaine.fr"
                value={config.host}
                onChange={(e) => setConfig({...config, host: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f] placeholder:text-slate-200"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Port</label>
              <input 
                type="text" 
                placeholder="465"
                value={config.port}
                onChange={(e) => setConfig({...config, port: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f]"
              />
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email / Identifiant</label>
              <input 
                type="email" 
                placeholder="contact@entreprise.fr"
                value={config.user}
                onChange={(e) => setConfig({...config, user: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f]"
              />
            </div>
            <div className="space-y-3 md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mot de passe</label>
                {hasStoredPass && config.pass === '••••••••' && (
                  <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">🔒 Configuré</span>
                )}
              </div>
              <input 
                type="password" 
                placeholder="••••••••••••"
                value={config.pass}
                onChange={(e) => setConfig({...config, pass: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-[#00236f] px-6 py-4 rounded-2xl transition-all font-bold text-sm text-[#00236f]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 mt-4">
             <button 
               onClick={handleSave}
               disabled={isSaving}
               className="flex-1 bg-[#00236f] hover:bg-[#001b54] text-white font-black uppercase tracking-widest text-[11px] py-5 px-8 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
               Enregistrer Configuration
             </button>
             <button 
               onClick={handleTest}
               disabled={isTesting}
               className="flex-1 bg-white hover:bg-slate-50 text-[#00236f] border-2 border-slate-100 font-black uppercase tracking-widest text-[11px] py-5 px-8 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {isTesting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
               Envoyer un Test
             </button>
          </div>
        </motion.div>

        {/* Support & Tips */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col gap-10"
        >
          {/* Quick Defaults Card */}
          <div className="bg-[#00236f] p-8 rounded-[2rem] shadow-xl shadow-blue-900/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16" />
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                   <HelpCircle className="text-blue-300" size={18} />
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Valeurs Courantes</h3>
                </div>
                <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
                   <div>
                      <p className="text-[9px] font-black text-blue-300 uppercase tracking-tighter mb-1">Outlook / 365</p>
                      <p className="text-[11px] font-bold text-white">smtp.office365.com <br/>Port: 587</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-blue-300 uppercase tracking-tighter mb-1">Gmail / Google</p>
                      <p className="text-[11px] font-bold text-white">smtp.gmail.com <br/>Port: 465</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Guide Card */}
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] space-y-8">
             <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#00236f]" size={18} />
                <h3 className="text-sm font-black text-[#00236f] uppercase italic">Sécurité & Spam</h3>
             </div>
             <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Utilisez toujours un <strong>mot de passe d'application</strong> si vous utilisez Gmail ou Outlook pour éviter les blocages de sécurité.
             </p>
             <div className="space-y-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex gap-4">
                     <span className="shrink-0 w-6 h-6 bg-white border border-slate-200 text-[#00236f] rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                        {step}
                     </span>
                     <p className="text-[11px] font-bold text-slate-600">
                        {step === 1 && "Activez l'authentification double facteur sur votre compte email."}
                        {step === 2 && "Générez un mot de passe d'application dans vos paramètres de sécurité."}
                        {step === 3 && "Collez ce code dans le champ mot de passe ci-contre."}
                     </p>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
