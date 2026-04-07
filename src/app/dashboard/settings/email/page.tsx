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
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
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
      // SÉCURITÉ : N'envoyer le mot de passe que s'il a été modifié (différent des étoiles)
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
      // SÉCURITÉ : Utiliser le mot de passe masqué s'il n'a pas été changé
      const testConfig = { ...config }
      if (testConfig.pass === '••••••••') {
        // Pour le test, on a besoin du vrai mot de passe. 
        // Si l'utilisateur n'a pas changé le champ, l'API 'test' devra 
        // récupérer le mot de passe existant en base (ce qu'elle fait déjà via le profil chargé)
        // Mais ici l'API 'test' s'attend à recevoir la config complète.
        // MODIFICATION : On va passer une action spéciale ou laisser l'API gérer.
        // En fait, if pass is '••••••••', we tell the API to use the stored one.
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
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-0 pb-0">
      {/* Header Section - Even more compact */}
      <section className="pt-0 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 text-[#00236f] rounded-lg border border-slate-100 shadow-sm">
            <Settings size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#00236f] tracking-tight leading-none mb-0.5">PARAMÈTRES</h1>
            <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">Configuration de votre compte artisan</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration & Defaults */}
        <div className="lg:col-span-7 space-y-4">
          {/* Données de base (Défaut) - Moved here and styled as a standalone banner */}
          <div className="bg-[#5c4008] p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="text-[#ffe4bc]" size={14} />
              <p className="text-[10px] font-black text-[#ffe4bc] uppercase tracking-widest">Données de base (Défaut)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-bold text-[#ffe4bc]/60 uppercase mb-0.5">Pour Outlook :</p>
                <p className="text-[9px] font-black text-white">smtp-mail.outlook.com (587)</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-[#ffe4bc]/60 uppercase mb-0.5">Pour Gmail :</p>
                <p className="text-[9px] font-black text-white">smtp.gmail.com (465)</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 text-slate-800">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
              <Mail className="text-[#00236f]" size={20} />
              <h2 className="text-lg font-black tracking-tight uppercase">Configuration SMTP</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Serveur SMTP (Hôte)</label>
                <div className="relative group">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00236f] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="email.votredomaine.com"
                    value={config.host}
                    onChange={(e) => setConfig({...config, host: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-[#00236f] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Port</label>
                <input 
                  type="number" 
                  placeholder="465"
                  value={config.port}
                  onChange={(e) => setConfig({...config, port: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-[#00236f] transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Email / Utilisateur</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00236f] transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="contact@votredomaine.fr"
                    value={config.user}
                    onChange={(e) => setConfig({...config, user: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-[#00236f] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mot de passe (ou mdp d'application)</label>
                  {hasStoredPass && config.pass === '••••••••' && (
                    <div className="bg-amber-50 border-2 border-amber-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm max-w-xs animate-in fade-in slide-in-from-right-4 duration-500">
                       <span className="text-[11px] font-extrabold text-amber-900 leading-tight">
                        🔒 PROTECTION ACTIVE : <br/>
                        <span className="text-[10px] font-bold text-amber-700/80 uppercase tracking-tight italic">
                          Le nombre de caractères est masqué. Votre mot de passe ne fait pas forcément 8 caractères.
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00236f] transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••••••"
                    value={config.pass}
                    onChange={(e) => setConfig({...config, pass: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-[#00236f] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Nom d'expéditeur affiché</label>
                <input 
                  type="text" 
                  placeholder="Jean Dupont Électricité"
                  value={config.from}
                  onChange={(e) => setConfig({...config, from: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-[#00236f] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-3 bg-[#00236f] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-[12px] shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer
              </button>
              <button 
                onClick={handleTest}
                disabled={isTesting}
                className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-[#00236f] text-[#00236f] py-4 rounded-xl font-bold uppercase tracking-wider text-[12px] hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                Tester la connexion
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Instructions & Help */}
        <div className="lg:col-span-5">
          <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-[#00236f]" size={20} />
                <h2 className="text-[13px] font-black tracking-widest uppercase text-slate-700">Sécurité & Spam</h2>
              </div>

              {/* Important Alert Box - Peach/Orange style */}
              <div className="mb-8 p-5 bg-[#ffe4bc] border-l-4 border-[#5c4008] rounded-r-xl shadow-sm">
                <p className="text-[12px] font-black text-[#5c4008] mb-1">Important :</p>
                <p className="text-[11px] leading-relaxed font-bold text-[#5c4008]/80">
                  Assurez-vous que votre serveur SMTP supporte le protocole STARTTLS/SSL pour garantir la confidentialité de vos échanges client.
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-[13px] font-black text-slate-700 mb-5">Aide Gmail / Outlook</h3>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-[#00236f] text-white rounded-full flex items-center justify-center text-[11px] font-black">1</div>
                      <p className="text-[11px] font-bold text-slate-500 leading-tight">Activez la validation en deux étapes sur votre compte email.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-[#00236f] text-white rounded-full flex items-center justify-center text-[11px] font-black">2</div>
                      <p className="text-[11px] font-bold text-slate-500 leading-tight">Générez un "Mot de passe d'application" spécifique pour ArtisanFlow.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-[#00236f] text-white rounded-full flex items-center justify-center text-[11px] font-black">3</div>
                      <p className="text-[11px] font-bold text-slate-500 leading-tight">Utilisez ce code unique dans le champ "Mot de passe" ci-contre.</p>
                    </div>
                  </div>
                </div>

                {/* Video Preview with Styled Overlay */}
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-video group">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    controls
                    className="w-full h-full object-cover"
                  >
                    <source src="/videos/EXPLICATION MDP GOOGLE.MP4.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-slate-100">
                      <p className="text-[9px] font-black text-[#00236f] uppercase tracking-wider">Tutoriel vidéo disponible</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
