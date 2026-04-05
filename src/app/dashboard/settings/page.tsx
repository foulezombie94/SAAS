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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
              <Mail className="text-primary" size={20} />
              <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Configuration SMTP</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Serveur SMTP (Hôte)</label>
                <div className="relative group">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="email.votredomaine.com"
                    value={config.host}
                    onChange={(e) => setConfig({...config, host: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all"
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
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Email / Utilisateur</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="contact@votredomaine.fr"
                    value={config.user}
                    onChange={(e) => setConfig({...config, user: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Mot de passe (ou mdp d'application)</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••••••"
                    value={config.pass}
                    onChange={(e) => setConfig({...config, pass: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all"
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
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer
              </button>
              <button 
                onClick={handleTest}
                disabled={isTesting}
                className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 text-slate-700 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                Tester la connexion
              </button>
            </div>
          </div>
        </div>

        {/* Instructions & Help */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-tertiary-container text-on-tertiary-container rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-secondary" size={24} />
              <h2 className="text-lg font-black tracking-tight uppercase">Sécurité & Spam</h2>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40">
                <h3 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
                  <AlertCircle size={16} /> Gmail / Outlook
                </h3>
                <p className="text-xs leading-relaxed font-bold text-on-tertiary-container/80">
                  Gmail et Outlook bloquent souvent les connexions SMTP directes. Vous devez obligatoirement :
                </p>
                <ol className="mt-3 space-y-2 text-xs font-bold list-decimal list-inside text-on-tertiary-container/90">
                  <li>Activer la validation en deux étapes.</li>
                  <li>Créer un <strong>"Mot de passe d'application"</strong>.</li>
                  <li>Utiliser ce mot de passe unique à la place de votre mot de passe habituel.</li>
                </ol>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <a 
                    href="https://support.google.com/accounts/answer/185833" 
                    target="_blank" 
                    className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest hover:underline"
                  >
                    Aide Gmail <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="p-5 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40">
                <h3 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Éviter les Spams
                </h3>
                <p className="text-xs leading-relaxed font-bold text-on-tertiary-container/80">
                  Pour garantir que vos devis arrivent directement en boîte de réception :
                </p>
                <ul className="mt-3 space-y-2 text-xs font-bold list-disc list-inside text-on-tertiary-container/90">
                  <li>Les emails envoyés via votre propre serveur sont mieux notés.</li>
                  <li>Vérifiez vos enregistrements <strong>SPF et DKIM</strong> sur votre domaine.</li>
                  <li>Évitez les noms d'objets tout en majuscules (ex: DEVIS IMPORTANT).</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-8 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HelpCircle size={18} /> Données de base (Défaut)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between group">
                <span className="text-[11px] font-bold text-slate-400">Pour Outlook :</span>
                <span className="text-[11px] font-black text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-100 group-hover:border-primary transition-all">smtp-mail.outlook.com (587)</span>
              </div>
              <div className="flex items-center justify-between group">
                <span className="text-[11px] font-bold text-slate-400">Pour Gmail :</span>
                <span className="text-[11px] font-black text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-100 group-hover:border-primary transition-all">smtp.gmail.com (465)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
