import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/lib/nodemailer'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { quoteId, subject, message } = await req.json()

    if (!quoteId) {
      return NextResponse.json({ error: 'ID du devis manquant' }, { status: 400 })
    }

    // 1. Fetch Quote, Client and Artisan Profile
    const { data: quote, error: qError } = await supabase
      .from('quotes')
      .select('*, clients(*)')
      .eq('id', quoteId)
      .single()

    if (qError || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (pError || !profile) {
      return NextResponse.json({ error: 'Profil artisan introuvable' }, { status: 404 })
    }

    if (!profile.smtp_host || !profile.smtp_user || !profile.smtp_pass) {
      return NextResponse.json({ 
        error: 'Configuration SMTP manquante. Veuillez configurer vos paramètres email.' 
      }, { status: 400 })
    }

    if (!quote.clients?.email) {
      return NextResponse.json({ 
        error: "L'email du client n'est pas renseigné." 
      }, { status: 400 })
    }

    // 2. Generate Links
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artisanflow.app'
    const shareUrl = `${baseUrl}/share/quotes/${quote.id}`
    const paymentUrl = shareUrl // The share page has the payment button

    // 3. Construct HTML Email
    const htmlEmail = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
        <div style="background-color: #00236f; padding: 40px; border-radius: 16px 16px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">${profile.company_name || 'ArtisanFlow'}</h1>
          <p style="margin-top: 10px; opacity: 0.8; font-size: 14px;">Votre Devis Professionnel</p>
        </div>
        
        <div style="padding: 40px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #00236f; font-size: 20px; font-weight: 700; margin-bottom: 20px;">Bonjour ${quote.clients.name},</h2>
          
          <div style="margin-bottom: 30px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600; color: #64748b;">Référence :</span>
              <span style="font-weight: 700; color: #00236f;">${quote.number}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600; color: #64748b;">Montant Total :</span>
              <span style="font-weight: 800; color: #00236f; font-size: 18px;">${(quote.total_ttc || 0).toLocaleString('fr-FR')} € TTC</span>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${shareUrl}" style="display: inline-block; background-color: #00236f; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px -1px rgba(0, 35, 111, 0.2);">
              Consulter et Signer le Devis
            </a>
          </div>

          <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 30px;">
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 15px;">Vous pouvez également procéder au paiement directement en ligne :</p>
            <a href="${paymentUrl}" style="color: #00236f; font-weight: 700; font-size: 14px; text-decoration: underline;">
              Effectuer le Paiement par Carte
            </a>
          </div>
        </div>

        <div style="padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <p>© ${new Date().getFullYear()} ${profile.company_name}. Propulsé par ArtisanFlow.</p>
        </div>
      </div>
    `

    // 4. Send Email
    const smtpConfig = {
      host: profile.smtp_host,
      port: profile.smtp_port || 465,
      user: profile.smtp_user,
      pass: profile.smtp_pass,
      from: profile.smtp_from || user.email || ''
    }

    await sendEmail(
      smtpConfig,
      quote.clients.email,
      subject || `Devis ${quote.number} - ${profile.company_name}`,
      htmlEmail,
      `${message}\n\nConsulter le devis ici : ${shareUrl}\n\nPayer en ligne : ${paymentUrl}`
    )

    // 5. Update Status
    if (quote.status === 'draft') {
      await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Send Email API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
