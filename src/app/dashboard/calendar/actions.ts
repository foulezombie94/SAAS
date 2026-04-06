'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

export async function getInterventions() {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('interventions')
    .select('*, client:clients(*)')
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching interventions:', error)
    return []
  }

  return data
}

export async function createIntervention(formData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autorisé')

  const { title, description, start_time, end_time, client_id, quote_id } = formData

  const { data, error } = await (supabase as any)
    .from('interventions')
    .insert([{
      title,
      description,
      start_time,
      end_time,
      user_id: user.id,
      client_id: client_id || null,
      quote_id: quote_id || null,
      status: 'planned'
    }])
    .select()

  if (error) {
    console.error('Error creating intervention:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/calendar')
  return { data: data[0] }
}

export async function updateInterventionStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('interventions')
    .update({ status })
    .eq('id', id)
    .select('id, quote_id')
    .single()

  if (error) {
    console.error('Error updating status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/calendar')
  return { data }
}

export async function sendInterventionReminder(id: string) {
  const supabase = await createClient()
  
  // 1. Fetch intervention, client and artisan profile
  const { data: intervention, error: fetchError } = await (supabase as any)
    .from('interventions')
    .select('*, client:clients(*), profile:profiles(*)')
    .eq('id', id)
    .single()

  if (fetchError || !intervention) return { error: "Impossible de trouver l'intervention" }
  if (!intervention.client?.email) return { error: "Le client n'a pas d'adresse email renseignée." }

  // 2. Setup Transporter (using environment variables fallback)
  const transporter = nodemailer.createTransport({
    host: intervention.profile?.smtp_host || process.env.SMTP_HOST,
    port: parseInt(intervention.profile?.smtp_port || process.env.SMTP_PORT || '587'),
    secure: intervention.profile?.smtp_port === '465',
    auth: {
      user: intervention.profile?.smtp_user || process.env.SMTP_USER,
      pass: intervention.profile?.smtp_pass || process.env.SMTP_PASS,
    },
  })

  // 3. Email Content
  const dateStr = new Date(intervention.start_time).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
  const timeStr = new Date(intervention.start_time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const mailOptions = {
    from: `"${intervention.profile?.company_name || 'ArtisanFlow'}" <${intervention.profile?.smtp_user || process.env.SMTP_USER}>`,
    to: intervention.client.email,
    subject: `Rappel d'intervention : ${intervention.title}`,
    text: `Bonjour ${intervention.client.name},\n\nNous vous confirmons notre intervention pour : ${intervention.title}.\n\n📅 Date : ${dateStr}\n⏰ Heure : ${timeStr}\n\nEn cas d'empêchement, merci de nous contacter au plus vite.\n\nCordialement,\n${intervention.profile?.company_name || 'Votre Artisan'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
        <h2 style="color: #002878; margin-top: 0;">Rappel d'intervention</h2>
        <p>Bonjour <strong>${intervention.client.name}</strong>,</p>
        <p>Nous vous confirmons notre passage pour l'intervention suivante :</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">${intervention.title}</p>
          <p style="margin: 10px 0 0 0; color: #64748b;">📅 ${dateStr} à ${timeStr}</p>
        </div>
        <p>En cas d'empêchement, merci de nous contacter directement par téléphone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">${intervention.profile?.company_name || 'ArtisanFlow'}</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    await (supabase as any)
      .from('interventions')
      .update({ reminder_sent: true })
      .eq('id', id)
    
    return { success: true }
  } catch (err: any) {
    console.error('SMTP Error:', err)
    return { error: "Erreur lors de l'envoi de l'email : " + err.message }
  }
}

export async function deleteIntervention(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('interventions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting intervention:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/calendar')
  return { success: true }
}
