import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifyProAccess } from '@/lib/pro-gate'
import { sendEmail } from '@/lib/nodemailer'
import { decrypt } from '@/lib/encryption'
import { SendEmailSchema } from '@/lib/validations/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 0. ENSURE PRO (Protection Server-Side)
    const { isPro } = await verifyProAccess()
    if (!isPro) {
      return NextResponse.json({ error: 'Forfait Pro requis pour l\'envoi d\'emails' }, { status: 403 })
    }

    const body = await req.json()
    const result = SendEmailSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { quoteId, subject, message, to } = result.data

    // 0. RATE LIMITING (3 requests per minute per user)
    const limit = await rateLimit(`send-email-${user.id}`, 3, 60000)
    if (!limit.success) {
      return NextResponse.json({ error: limit.message }, { status: 429 })
    }

    // 1. Fetch Quote, Client and Artisan Profile in PARALLEL for speed
    const [quoteRes, profileRes] = await Promise.all([
      supabase
        .from('quotes')
        .select('id, user_id, number, status, total_ttc, public_token, client_id, clients(name, email)')
        .eq('id', quoteId)
        .eq('user_id', user.id) // IDOR PROTECTION
        .single(),
      supabase
        .from('profiles')
        .select('id, company_name, is_pro, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from')
        .eq('id', user.id)
        .single()
    ])

    const { data: quote, error: qError } = quoteRes
    const { data: profile, error: pError } = profileRes

    if (qError || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    if (pError || !profile) {
      return NextResponse.json({ error: 'Profil artisan introuvable' }, { status: 404 })
    }

    if (!profile.is_pro) {
      return NextResponse.json({ 
        error: 'L\'envoi d\'emails est une fonctionnalité Pro. Veuillez mettre à jour votre abonnement.' 
      }, { status: 403 })
    }

    if (!profile.smtp_host || !profile.smtp_user || !profile.smtp_pass) {
      return NextResponse.json({ 
        error: 'Configuration SMTP manquante. Veuillez configurer vos paramètres email.' 
      }, { status: 400 })
    }

    // 1.1 Decrypt SMTP Password with Strict Check
    const decryptedPass = decrypt(profile.smtp_pass)
    if (!decryptedPass) {
      return NextResponse.json({ 
        error: 'Erreur de déchiffrement des identifiants SMTP. Veuillez reconfigurer votre mot de passe.' 
      }, { status: 400 })
    }

    if (!quote.clients?.email) {
      return NextResponse.json({ 
        error: "L'email du client n'est pas renseigné." 
      }, { status: 400 })
    }

    // 2. Generate Links (Dynamic detection for local/prod testing)
    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://artisanflow.app')
    
    const shareUrl = `${baseUrl}/share/quotes/${quote.id}?token=${quote.public_token}`
    const paymentUrl = `${shareUrl}&pay=true` // Triggers Stripe checkout immediately

    // 3. Construct HTML Email (Reinforced with Security Frame)
    const htmlEmail = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background-color: #00236f; padding: 30px; text-align: center; color: white;">
          <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6;">Email Sécurisé via ArtisanFlow</p>
          <h1 style="margin: 10px 0 0 0; font-size: 22px; font-weight: 800;">${profile.company_name || 'Votre Artisan'}</h1>
        </div>
        
        <div style="padding: 40px; background-color: #ffffff;">
          <div style="border-left: 4px solid #00236f; padding-left: 20px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600;">Message de votre artisan :</p>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #1e293b; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
            <p style="margin: 0 0 15px 0; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-size: 10px;">Détails du Devis #${quote.number}</p>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #64748b; padding: 4px 0;">Client :</td>
                <td style="text-align: right; font-weight: 700; color: #1e293b;">${quote.clients.name}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 4px 0;">Montant :</td>
                <td style="text-align: right; font-weight: 800; color: #00236f; font-size: 18px;">${(quote.total_ttc || 0).toLocaleString('fr-FR')} € TTC</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${shareUrl}" style="display: inline-block; background-color: #00236f; color: white; padding: 18px 40px; border-radius: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
              Consulter et Signer le Devis
            </a>
          </div>


        </div>

        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 5px 0;">Cet email a été envoyé par <strong>${profile.company_name}</strong> via la plateforme sécurisée <strong>ArtisanFlow</strong>.</p>
          <p style="margin: 0;">© ${new Date().getFullYear()} ArtisanFlow. Tous droits réservés.</p>
        </div>
      </div>
    `

    // 4. Send Email
    const smtpConfig = {
      host: profile.smtp_host,
      port: profile.smtp_port || 465,
      user: profile.smtp_user,
      pass: decryptedPass,
      from: profile.smtp_from || user.email || ''
    }

    try {
      await sendEmail(
        smtpConfig,
        to || quote.clients.email,
        subject || `Devis ${quote.number} - ${profile.company_name}`,
        htmlEmail,
        `${message}\n\nConsulter le devis ici : ${shareUrl}`
      )
    } catch (sendError) {
      console.error('Nodemailer Error:', sendError)
      return NextResponse.json({ error: "Échec de l'envoi de l'email via votre serveur SMTP." }, { status: 500 })
    }

    // 5. Update Status
    if (quote.status === 'draft') {
      await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)
        .eq('user_id', user.id) // DOUBLE BELT
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Send Email API Error:', err)
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 })
  }
}
