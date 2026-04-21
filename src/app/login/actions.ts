'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/rate-limit'
import { signupSchema } from '@/lib/validations/secure-inputs'
import { z } from 'zod'
import { reportSecurityEvent, getSecurityReputation, resetSecurityReputation } from '@/lib/security'

export async function login(prevState: any, formData: FormData) {
  // 0. SECURITY REPUTATION CHECK
  const security = await getSecurityReputation()
  if (security.status === 'BLOCKED') {
    redirect('/blocked')
  }

  // 1. HONEYPOT CHECK (Bot Detection)
  const honeypot = formData.get('__af_hpt_trap_91x') as string
  if (honeypot) {
    console.warn('🚨 Bot detected via Honeypot!')
    // We only fail instead of permanently blocking, because password managers often trigger this.
    await reportSecurityEvent('FAIL')
    return { error: 'Votre navigateur a pré-rempli un champ caché. Veuillez vérifier vos extensions d\'auto-remplissage et réessayer.' }
  }



  // 3. ANTI-BRUTE FORCE (10 tentatives / minute par IP)
  const limit = await rateLimit('auth-login', 10, 60000)
  if (!limit.success) {
    await reportSecurityEvent('FAIL')
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
    await reportSecurityEvent('FAIL')
    let errorMessage = error?.message || 'Email ou mot de passe incorrect'
    if (error?.message === 'Invalid login credentials') {
      errorMessage = 'Email ou mot de passe incorrect'
    } else if (error?.message?.toLowerCase().includes('ban')) {
      errorMessage = 'Votre compte est temporairement suspendu.'
      
      // Attempt to fetch the unban date directly from Redis using the email mapping
      try {
        const { redis } = await import('@/lib/rate-limit')
        if (redis && email) {
          const normalizedEmail = email.trim().toLowerCase()
          
          // 2 requêtes (très rapides sur Redis) pour récupérer d'abord l'ID, puis le ban
          let mappedUserId = await redis.get(`artisan-flow:email-to-user:${normalizedEmail}`)
          
          // FALLBACK DB : si le mapping a expiré (ex: inactif > 7j) ou webhook perdu
          if (!mappedUserId || typeof mappedUserId !== 'string' || mappedUserId.length === 0) {
            const { requireAdminClient } = await import('@/lib/supabase/admin')
            const adminSupabase = requireAdminClient()
            if (adminSupabase) {
              const { data: profile } = await adminSupabase
                .from('profiles')
                .select('id')
                .eq('email', normalizedEmail)
                .single()
              
              if (profile?.id) {
                mappedUserId = profile.id
                // Re-hydrate the cache (Self-Healing)
                await redis.set(`artisan-flow:email-to-user:${normalizedEmail}`, mappedUserId, { ex: 7 * 24 * 60 * 60 })
              }
            }
          }

          if (typeof mappedUserId === 'string' && mappedUserId.length > 0) {
            // Keep the mapping alive for active users (7 days)
            await redis.expire(`artisan-flow:email-to-user:${normalizedEmail}`, 7 * 24 * 60 * 60)
            const bannedUntilStr = await redis.get(`artisan-flow:ban:${mappedUserId}`)
            if (bannedUntilStr) {
              const timestamp = Number(bannedUntilStr)
              if (Number.isFinite(timestamp)) {
                const date = new Date(timestamp)
                const banMessage = `Vous pourrez vous reconnecter le ${date.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}.`
                errorMessage = `${errorMessage} ${banMessage}`
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch ban expiration', e)
      }
    }
    return { error: errorMessage }
  }

  // Success! Reset reputation
  await resetSecurityReputation()
  console.log('✅ Login success for', email)

  // 🚀 HARDENED SECURITY: Record fingerprint in app_metadata (Tamper-proof)
  const { headers } = await import('next/headers')
  const { requireAdminClient } = await import('@/lib/supabase/admin')
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for') || 'unknown'
  const ua = headerStore.get('user-agent') || 'unknown'

  try {
    const adminSupabase = requireAdminClient()!
    await adminSupabase.auth.admin.updateUserById(user.id, {
      app_metadata: { 
        last_login_ip: ip,
        last_login_ua: ua,
        last_login_at: new Date().toISOString()
      }
    })
  } catch (e: any) {
    if (e.message === 'SERVICE_UNAVAILABLE') {
      console.warn('⚠️ [LOGIN] Service Admin indisponible. La synchronisation des métadonnées est ignorée.')
    } else {
      console.error('⚠️ [LOGIN] Erreur inattendue lors de la mise à jour des métadonnées:', e.message)
    }
    // Non-blocking: Login continues
  }

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
