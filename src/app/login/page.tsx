import { LoginForm } from '@/components/auth/LoginForm'
import { CookieConsent } from '@/components/auth/CookieConsent'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string; error: string }
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-6 sm:p-12">
      {/* Cookie Consent Popup */}
      <CookieConsent />

      {/* Decorative Background Elements (Subtle Blueprint feeling) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#00236f 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      ></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <Link href="/" className="flex items-center gap-3 text-primary mb-8 px-6 py-2 rounded-full bg-primary/5 border border-primary/10">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
            <span className="font-headline font-black text-xl tracking-tighter uppercase">ArtisanFlow</span>
          </Link>
          
          <h1 className="font-headline font-bold text-4xl tracking-tight text-on-surface mb-3">Bon retour, Chef !</h1>
          <p className="font-body text-on-surface-variant text-base">Connectez-vous pour piloter vos chantiers.</p>
        </div>

        {searchParams?.message && (
          <div className="mb-6 p-4 bg-secondary-container text-on-secondary-container rounded-md text-sm font-bold border border-secondary/10 shadow-sm animate-in fade-in slide-in-from-top-2">
            {searchParams.message}
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-[2rem] shadow-diffused border border-white/50">
          <LoginForm />
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-surface-container-high text-center">
          <p className="text-sm text-on-surface-variant font-medium">
            Nouveau sur ArtisanFlow ?{' '}
            <Link href="/signup" className="font-black text-primary hover:text-primary-container hover:underline transition-all">
              Créer un compte entreprise
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
