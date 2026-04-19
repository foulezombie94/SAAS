import Link from 'next/link'
import { ShieldAlert, Clock, Mail } from 'lucide-react'

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-[#00123a] flex items-center justify-center p-6 lg:p-12 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-error/40 via-transparent to-transparent"></div>
        <div 
          className="w-full h-full" 
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        ></div>
      </div>

      <div className="max-w-2xl w-full relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-error/10 border border-error/20 mb-8 animate-pulse">
          <ShieldAlert size={48} className="text-error" />
        </div>

        <h1 className="font-headline font-black text-4xl md:text-5xl text-white mb-6 uppercase tracking-tighter">
          Accès Verrouillé
        </h1>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-2xl mb-10">
          <p className="font-body text-white/70 text-lg leading-relaxed mb-10">
            Par mesure de sécurité, l'accès à votre compte a été suspendu suite à des activités suspectes (tentatives multiples erronées ou comportement automatisé).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 text-left p-6 bg-white/5 rounded-2xl border border-white/5">
              <Clock className="text-[#ef9900] shrink-0" size={24} />
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Délai de Sécurité</h3>
                <p className="text-white/40 text-[12px]">L'accès sera automatiquement rétabli dans <strong>72 heures</strong>.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left p-6 bg-white/5 rounded-2xl border border-white/5">
              <Mail className="text-[#ef9900] shrink-0" size={24} />
              <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Assistance</h3>
                <p className="text-white/40 text-[12px]">Si vous pensez qu'il s'agit d'une erreur, contactez notre support technique.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/"
            className="w-full sm:w-auto px-10 py-4 bg-white text-[#00123a] rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#ef9900] hover:text-white transition-all active:scale-95"
          >
            Retour à l'accueil
          </Link>
          <button className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
            Consulter la politique de sécurité
          </button>
        </div>
      </div>
    </div>
  )
}
