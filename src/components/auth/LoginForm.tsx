'use client'

import { useActionState } from 'react'
import { login } from '@/app/login/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full h-14 mt-2" 
      isLoading={pending}
      disabled={pending}
    >
      {pending ? 'Connexion en cours...' : 'Se connecter'}
    </Button>
  )
}

export function LoginForm() {
  // useActionState (React 19) handles the form action state (error/success)
  // this provides instant feedback without full page reloads for errors
  const [state, action] = useActionState(login, null)

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="space-y-4">
        <Input
          name="email"
          label="Email Professionnel"
          placeholder="nom@entreprise.fr"
          required
          type="email"
          autoComplete="email"
        />
        <Input
          type="password"
          name="password"
          label="Mot de passe"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      {state?.error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-md text-sm font-bold border border-error/10 animate-shake">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  )
}
