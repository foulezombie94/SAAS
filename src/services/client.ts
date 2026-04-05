import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export interface CreateClientInput {
  name: string
  email?: string
  phone?: string
  address?: string
}

export async function addClient(input: CreateClientInput) {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autorisé')

  const { data, error } = await supabase
    .from('clients')
    .insert([{ ...input, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getClients() {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase.from('clients').select('*').order('name')
  
  if (error) throw error
  return data
}
