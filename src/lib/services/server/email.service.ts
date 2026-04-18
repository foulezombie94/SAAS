import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/lib/nodemailer'
import { decrypt } from '@/lib/encryption'
import { verifyProAccess } from '@/lib/pro-gate'

interface SendInternalEmailParams {
  quoteId: string
  to: string
  subject: string
  message: string
  userId: string
}

/**
 * 📧 Server-Side Email Service
 * Decoupled logic to serve both API routes and Server Actions.
 */
export async function sendQuoteEmailInternal({ 
  quoteId, 
  to, 
  subject, 
  message, 
  userId 
}: SendInternalEmailParams) {
  const supabase = await createClient()

  // 1. Authorization & Pro Check
  const { isPro } = await verifyProAccess()
  if (!isPro) {
    throw new Error('Forfait Pro requis pour l\'envoi d\'emails')
  }

  // 2. Fetch Data (Parallel)
  const [quoteRes, profileRes] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, number, status, total_ttc, public_token, client_id, clients(name, email)')
      .eq('id', quoteId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('profiles')
      .select('company_name, is_pro, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from')
      .eq('id', userId)
      .single()
  ])

  if (quoteRes.error || !quoteRes.data) throw new Error('Devis introuvable')
  if (profileRes.error || !profileRes.data) throw new Error('Profil artisan introuvable')

  const quote = quoteRes.data
  const profile = profileRes.data

  if (!profile.smtp_host || !profile.smtp_user || !profile.smtp_pass) {
    throw new Error('Configuration SMTP manquante')
  }

  const decryptedPass = decrypt(profile.smtp_pass)
  if (!decryptedPass) throw new Error('Erreur de déchiffrement SMTP')

  // 3. Prepare Links
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artisanflow.app'
  const shareUrl = `${baseUrl}/share/quotes/${quote.id}?token=${quote.public_token}`
  
  // 4. Construct HTML
  const htmlEmail = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #00236f; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 20px;">${profile.company_name || 'Votre Artisan'}</h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="white-space: pre-wrap;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${shareUrl}" style="background-color: #00236f; color: white; padding: 15px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Consulter le Devis #${quote.number}
          </a>
        </div>
      </div>
    </div>
  `

  // 5. Send Email
  const smtpConfig = {
    host: profile.smtp_host,
    port: profile.smtp_port || 465,
    user: profile.smtp_user,
    pass: decryptedPass,
    from: profile.smtp_from || ''
  }

  await sendEmail(
    smtpConfig,
    to || (quote.clients as any)?.email,
    subject || `Devis ${quote.number} - ${profile.company_name}`,
    htmlEmail,
    `${message}\n\nConsulter : ${shareUrl}`
  )

  // 6. Update Status
  if (quote.status === 'draft') {
    await supabase.from('quotes').update({ status: 'sent' }).eq('id', quoteId)
  }

  return { success: true }
}
