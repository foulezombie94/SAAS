'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/rate-limit'
import { signupSchema } from '@/lib/validations/secure-inputs'
import { z } from 'zod'

export async function login(prevState: any, formData: FormData) {
  // 1. ANTI-BRUTE FORCE (10 tentatives / minute par IP)
  const limit = await rateLimit('auth-login', 10, 60000)
  if (!limit.success) {
    return { error: limit.message }
  }

  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs' }
  }

  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !user) {
    let errorMessage = error?.message || 'Email ou mot de passe incorrect'
    if (error?.message === 'Invalid login credentials') {
      errorMessage = 'Email ou mot de passe incorrect'
    }
    return { error: errorMessage }
  }

  // 🚀 HARDENED SECURITY: Record fingerprint in app_metadata (Tamper-proof)
  const { headers } = await import('next/headers')
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for') || 'unknown'
  const ua = headerStore.get('user-agent') || 'unknown'

  const supabaseAdmin = createAdminClient()
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { 
      last_login_ip: ip,
      last_login_ua: ua,
      last_login_at: new Date().toISOString()
    }
  })

  // Check if onboarding is completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile?.plan) {
    redirect('/onboarding/transition')
  }

  // Removal of revalidatePath('/', 'layout') to eliminate "micro-delay"
  redirect('/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
  // 1. ANTI-BRUTE Force (5 tentatives / minute par IP pour l'inscription)
  const limit = await rateLimit('auth-signup', 5, 60000)
  if (!limit.success) {
    return { error: limit.message }
  }

  // 2. VALIDATION STRICTE & ANTI-XSS
  const rawData = Object.fromEntries(formData.entries())
  const validatedFields = signupSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { email, password, first_name, last_name, company_name, ...extraData } = validatedFields.data
  const { phone, num_contacts, annual_revenue, preferred_language = 'fr' } = extraData

  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${first_name} ${last_name}`,
        first_name,
        last_name,
        company_name,
        phone,
        num_contacts,
        annual_revenue,
        preferred_language,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (user) {
    redirect('/onboarding/transition')
  }

  redirect('/login?message=' + encodeURIComponent('Vérifiez votre boîte mail pour confirmer votre inscription !'))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
