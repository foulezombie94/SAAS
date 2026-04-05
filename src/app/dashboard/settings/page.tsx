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
          pass: data.smtp_pass || '',
          from: data.smtp_from || ''
        })
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
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', config })
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
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', config })
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
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <section>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#00236f] tracking-tight">PARAMÈTRES</h1>
            <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Configuration de votre compte artisan</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Instructions & Help - Moved up */}
        <div className="lg:col-span-5 space-y-6 lg:order-2">
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

            {/* Bottom Status/Defaults Banner - Brown style */}
            <div className="bg-[#5c4008] p-5">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="text-[#ffe4bc]" size={16} />
                <p className="text-[11px] font-black text-[#ffe4bc] uppercase tracking-widest">Données de base (Défaut)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-[#ffe4bc]/60 uppercase mb-1">Pour Outlook :</p>
                  <p className="text-[10px] font-black text-white">smtp-mail.outlook.com (587)</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#ffe4bc]/60 uppercase mb-1">Pour Gmail :</p>
                  <p className="text-[10px] font-black text-white">smtp.gmail.com (465)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Configuration Form - Moved down logically but using order-1 on desktop if needed */}
        <div className="lg:col-span-7 space-y-6 lg:order-1">
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
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Mot de passe (ou mdp d'application)</label>
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
      </div>
    </div>
  )
}
