import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string; error: string }
}) {
  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-surface">
      {/* Left Side: Immersive Image / Blueprint */}
      <div className="hidden md:flex md:w-1/2 relative blueprint-gradient overflow-hidden items-center justify-center">
        {/* Decorative Elements */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        ></div>
        
        <div className="absolute top-12 left-12 z-20">
          <Link href="/" className="flex items-center gap-3 text-on-primary">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
            <span className="font-headline font-black text-2xl tracking-tighter uppercase">ArtisanFlow</span>
          </Link>
        </div>

        <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
          <img 
            alt="Artisan working with precision" 
            className="object-cover w-full h-full rounded-xl opacity-80 mix-blend-overlay shadow-[0px_24px_48px_rgba(0,35,111,0.2)]" 
            src="/images/keke.png" 
          />
          {/* Overlay Content */}
          <div className="absolute bottom-24 left-16 max-w-lg text-on-primary">
            <h2 className="font-headline font-bold text-[2.5rem] leading-tight tracking-tight mb-4">
              L'excellence<br/>du métier.
            </h2>
            <p className="font-body text-lg opacity-80">
              La plateforme de référence pour les artisans exigeants. Gérez, planifiez et exécutez avec la précision d'un plan d'architecte.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-surface relative">
        {/* Mobile Logo */}
        <div className="md:hidden absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
            <span className="font-headline font-black text-xl tracking-tighter uppercase">ArtisanFlow</span>
          </Link>
        </div>

        <div className="w-full max-w-md mt-16 md:mt-0">
          {/* Header */}
          <div className="mb-10">
            <h1 className="font-headline font-bold text-[1.75rem] tracking-tight text-on-surface mb-2">Bon retour, Chef !</h1>
            <p className="font-body text-on-surface-variant text-base">Connectez-vous pour gérer vos chantiers avec précision.</p>
          </div>

          {searchParams?.message && (
            <div className="mb-6 p-4 bg-secondary-container text-on-secondary-container rounded-md text-sm font-bold border border-secondary/10">
              {searchParams.message}
            </div>
          )}

          <LoginForm />

          {/* Footer Links */}
          <div className="mt-10 pt-6 border-t border-surface-container-high text-center">
            <p className="text-sm text-on-surface-variant font-medium">
              Nouveau sur ArtisanFlow ?{' '}
              <Link href="/signup" className="font-black text-primary hover:text-primary-container hover:underline transition-all">
                Créer un compte entreprise
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
