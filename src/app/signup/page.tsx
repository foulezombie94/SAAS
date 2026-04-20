import { SignupForm } from '@/components/auth/SignupForm'
import { Card } from '@/components/ui/Card'
import { HardHat, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const params = await searchParams
  const message = params.message
  const error = params.error
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left Pane - Brand & Value Prop (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=2069" 
            alt="Artisan at work" 
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
            Prêt à devenir <br />
            <span className="text-on-primary-container">un pro du digital ?</span>
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-tertiary-fixed-dim rounded-full p-1">
                <CheckCircle2 size={18} className="text-on-tertiary-fixed" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Zéro installation</h3>
                <p className="opacity-70 text-sm">Créez votre compte et commencez à facturer immédiatement.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-tertiary-fixed-dim rounded-full p-1">
                <Zap size={18} className="text-on-tertiary-fixed" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Paiement Sécurisé</h3>
                <p className="opacity-70 text-sm">Intégration Stripe native pour recevoir vos fonds rapidement.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-tertiary-fixed-dim rounded-full p-1">
                <ShieldCheck size={18} className="text-on-tertiary-fixed" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Gestion Client simple</h3>
                <p className="opacity-70 text-sm">Tout l'historique de vos chantiers au même endroit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary-container rounded-md flex items-center justify-center text-on-primary-container">
              <HardHat size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-primary">ArtisanFlow</span>
          </div>

          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-4xl font-black text-primary tracking-tight mb-3">Créez votre compte</h1>
            <p className="text-on-surface-variant font-medium">Rejoignez la communauté d'artisans qui gagnent du temps.</p>
          </div>

          <SignupForm />

            <div className="mt-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-2 justify-center">
              <span className="text-on-surface-variant text-sm font-medium">Déjà inscrit ?</span>
              <Link href="/login" className="text-primary font-bold hover:underline">
                Se connecter
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
