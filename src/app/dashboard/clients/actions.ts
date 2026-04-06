'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { clientSchema, ClientInput } from '@/lib/validations/client'
import { rateLimit } from '@/lib/rate-limit'

export async function createClientAction(formData: ClientInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  // 🛡️ ANTI-SPAM : Rate limiting (5 clients par minute)
  const isAllowed = await rateLimit(`client_creation_${user.id}`, 5, 60)
  if (!isAllowed) {
    throw new Error('Trop de tentatives. Veuillez patienter une minute.')
  }

  // 🛡️ BASTION DE SÉCURITÉ : Validation Schema Zod + Anti-XSS (Grade 3)
  const validatedData = clientSchema.parse(formData)

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      address: validatedData.address || null,
      city: validatedData.city || null,
      postal_code: validatedData.postal_code || null,
      country: validatedData.country || 'France',
      site_address: validatedData.site_address || null,
      notes: validatedData.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    throw new Error('Erreur lors de la création du client')
  }

  revalidatePath('/dashboard/clients')
  return { success: true, data }
}

export async function updateClientAction(id: string, formData: ClientInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const validatedData = clientSchema.parse(formData)

  const { error } = await supabase
    .from('clients')
    .update({
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      address: validatedData.address || null,
      city: validatedData.city || null,
      postal_code: validatedData.postal_code || null,
      country: validatedData.country || 'France',
      site_address: validatedData.site_address || null,
      notes: validatedData.notes || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating client:', error)
    throw new Error('Erreur lors de la mise à jour du client')
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function getClientsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}
