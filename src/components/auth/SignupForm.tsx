'use client'

import { useActionState } from 'react'
import { signup } from '@/app/login/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useFormStatus } from 'react-dom'
import { Globe, Phone, Building2, User, Users, Wallet } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full py-4 text-lg font-black mt-6 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" 
      isLoading={pending}
      disabled={pending}
    >
      {pending ? 'Création en cours...' : 'Créer mon compte professionnel'}
    </Button>
  )
}

export function SignupForm() {
  const [state, action] = useActionState(signup, null)

  return (
    <form action={action} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="space-y-5">
        {/* Basic Auth Info */}
        <div className="space-y-4">
          <Input
            name="email"
            label="Email Professionnel *"
            placeholder="jean@plomberie-dupont.fr"
            required
            type="email"
            autoComplete="email"
            icon={<User size={16} className="text-on-surface-variant/50" />}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-2">
                <Globe size={14} /> Pays
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-sm font-bold text-on-surface-variant/70 italic">FR (+33)</span>
                </div>
                <input 
                   disabled
                   value="France"
                   className="w-full bg-surface-container-low border border-outline-variant/30 rounded-md pl-20 pr-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
            <Input
              name="phone"
              label="Numéro de téléphone *"
              placeholder="06 12 34 56 78"
              required
              type="tel"
              icon={<Phone size={16} className="text-on-surface-variant/50" />}
            />
          </div>
        </div>

        {/* Identity Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="first_name"
            label="Prénom *"
            placeholder="Jean"
            required
          />
          <Input
            name="last_name"
            label="Nom *"
            placeholder="Dupont"
            required
          />
        </div>

        <Input
          name="company_name"
          label="Nom de l'entreprise *"
          placeholder="Plomberie Dupont & Fils"
          required
          icon={<Building2 size={16} className="text-on-surface-variant/50" />}
        />

        {/* Business Scale Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-2">
              <Users size={14} /> Nombre de contacts
            </label>
            <select 
              name="num_contacts" 
              className="w-full bg-white border border-outline-variant/30 rounded-md px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="0-50">0 à 50</option>
              <option value="51-200">51 à 200</option>
              <option value="201-500">201 à 500</option>
              <option value="500+">Plus de 500</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-2">
              <Wallet size={14} /> CA Annuel estimé
            </label>
            <select 
              name="annual_revenue" 
              className="w-full bg-white border border-outline-variant/30 rounded-md px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="< 50k">&lt; 50 000 €</option>
              <option value="50k-100k">50k - 100 000 €</option>
              <option value="100k-250k">100k - 250 000 €</option>
              <option value="250k+">Plus de 250 000 €</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-on-surface-variant flex items-center gap-2">
            <Globe size={14} /> Langue préférée
          </label>
          <select 
            name="preferred_language" 
            className="w-full bg-white border border-outline-variant/30 rounded-md px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
            defaultValue="fr"
          >
            <option value="fr">Français (France)</option>
            <option value="en">English (US)</option>
            <option value="es">Español</option>
          </select>
        </div>

        <Input
          type="password"
          name="password"
          label="Mot de passe *"
          placeholder="Min. 8 caractères"
          required
          autoComplete="new-password"
        />
      </div>

      {state?.error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-md text-sm font-bold border border-error/10 animate-shake">
          {state.error}
        </div>
      )}

      <SubmitButton />
      
      <p className="text-[10px] text-center text-on-surface-variant/60 leading-relaxed mt-2 px-4">
        En créant un compte, vous acceptez nos <span className="underline font-bold cursor-pointer">Conditions d'Utilisation</span> et notre <span className="underline font-bold cursor-pointer">Politique de Confidentialité</span>.
      </p>
    </form>
  )
}
