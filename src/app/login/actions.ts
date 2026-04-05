'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=Veuillez remplir tous les champs')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    let errorMessage = error.message
    if (error.message === 'Invalid login credentials') {
      errorMessage = 'Email ou mot de passe incorrect'
    }
    redirect('/login?error=' + encodeURIComponent(errorMessage))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const full_name = (formData.get('full_name') as string)?.trim()

  if (!email || !password || !full_name) {
    redirect('/login?error=' + encodeURIComponent('Tous les champs sont obligatoires'))
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: full_name,
      },
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=' + encodeURIComponent('Vérifiez votre boîte mail pour confirmer votre inscription !'))
}
