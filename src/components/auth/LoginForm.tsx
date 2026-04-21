'use client'

import { useActionState, useState } from 'react'
import { login } from '@/app/login/actions'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full flex justify-center py-4 px-8 border border-transparent rounded-lg shadow-sm text-base font-bold text-on-primary blueprint-gradient hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? 'Connexion...' : 'Accéder au tableau de bord'}
      {!pending && (
        <span className="material-symbols-outlined ml-2 text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
      )}
    </button>
  )
}

export function LoginForm() {
  const [state, action] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant" htmlFor="email">
          Email professionnel
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-xl">mail</span>
          </div>
          <input 
            className="form-input-ghost block w-full pl-11 pr-4 py-4 bg-surface-container-lowest text-on-surface rounded-DEFAULT focus:ring-0 sm:text-base border border-outline-variant/20" 
            id="email" 
            name="email" 
            placeholder="artisan@exemple.com" 
            required 
            type="email"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-label text-[0.6875rem] uppercase tracking-[0.05em] font-bold text-on-surface-variant" htmlFor="password">
            Mot de passe
          </label>
          <Link href="#" className="text-sm font-medium text-primary hover:text-primary-container transition-colors">
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-xl">lock</span>
          </div>
          <input 
            className="form-input-ghost block w-full pl-11 pr-12 py-4 bg-surface-container-lowest text-on-surface rounded-DEFAULT focus:ring-0 sm:text-base border border-outline-variant/20" 
            id="password" 
            name="password" 
            placeholder="••••••••" 
            required 
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-outline hover:text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Remember Me */}
      <div className="flex items-center">
        <input 
          className="h-5 w-5 rounded-DEFAULT border-outline-variant text-primary focus:ring-primary focus:ring-2 bg-surface-container-lowest cursor-pointer" 
          id="remember-me" 
          name="remember-me" 
          type="checkbox"
        />
        <label className="ml-3 block text-sm font-medium text-on-surface-variant cursor-pointer" htmlFor="remember-me">
          Se souvenir de moi sur cet appareil
        </label>
      </div>

      {/* SECURITY: Honeypot field (invisible to humans, trapped for bots) */}
      <div className="sr-only opacity-0 absolute -z-10 pointer-events-none" aria-hidden="true">
        <label htmlFor="__af_hpt_trap_91x">Laissez ce champ vide</label>
        <input 
          type="text" 
          id="__af_hpt_trap_91x" 
          name="__af_hpt_trap_91x" 
          tabIndex={-1} 
          autoComplete="one-time-code" 
        />
        <input 
          type="hidden" 
          name="lt_sys" 
          value={Date.now()} 
        />
      </div>

      {state?.error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-md text-sm font-bold border border-error/10 animate-shake">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <SubmitButton />
    </form>
  )
}
