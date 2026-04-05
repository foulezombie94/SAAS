import { LoginForm } from '@/components/auth/LoginForm'
import { Card } from '@/components/ui/Card'
import { HardHat, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string; error: string }
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left Pane - Brand & Value Prop (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=2070" 
            alt="Artisan Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-lg text-on-primary">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-container rounded-md flex items-center justify-center text-on-primary-container shadow-2xl">
              <HardHat size={28} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">ArtisanFlow</span>
          </div>
          
          <h2 className="text-5xl font-black tracking-tight mb-8 leading-tight">
            Maîtrisez votre activité, <br />
            <span className="text-on-primary-container">pas votre paperasse.</span>
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-tertiary-fixed-dim rounded-full p-1">
                <CheckCircle2 size={18} className="text-on-tertiary-fixed" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Devis en 2 minutes</h3>
                <p className="opacity-70 text-sm">Répondez à vos clients plus vite que la concurrence.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-tertiary-fixed-dim rounded-full p-1">
                <Zap size={18} className="text-on-tertiary-fixed" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Suivi des paiements</h3>
                <p className="opacity-70 text-sm">Ne perdez plus aucune facture grâce au tableau de bord intelligent.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-tertiary-fixed-dim rounded-full p-1">
                <ShieldCheck size={18} className="text-on-tertiary-fixed" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sécurité Garantie</h3>
                <p className="opacity-70 text-sm">Vos données et celles de vos clients sont chiffrées et protégées.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary-container rounded-md flex items-center justify-center text-on-primary-container">
              <HardHat size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-primary">ArtisanFlow</span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-primary tracking-tight mb-3">Bon retour parmi nous</h1>
            <p className="text-on-surface-variant font-medium">Saisissez vos identifiants pour accéder à votre espace pro.</p>
          </div>

          {searchParams?.message && (
            <div className="mb-6 p-4 bg-secondary-container text-on-secondary-container rounded-md text-sm font-bold border border-secondary/10">
              {searchParams.message}
            </div>
          )}

          <LoginForm />

            <div className="mt-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-2 justify-center">
              <span className="text-on-surface-variant text-sm font-medium">Nouveau sur ArtisanFlow ?</span>
              <Link href="/signup" className="text-primary font-bold hover:underline">
                Créer un compte gratuitement
              </Link>
            </div>


          <div className="mt-16 pt-8 border-t border-outline-variant/30 text-center">
            <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/50 font-bold">
              Propulsé par la technologie ArtisanFlow Digital ®
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
