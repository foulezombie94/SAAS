import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createTransporter } from '@/lib/nodemailer'
import { encrypt, decrypt } from '@/lib/encryption'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { action, config } = body

    if (action === 'save') {
      const { error } = await supabase
        .from('profiles')
        .update({
          smtp_host: config.host,
          smtp_port: parseInt(config.port),
          smtp_user: config.user,
          smtp_pass: encrypt(config.pass), // Security fix: Encrypt before save
          smtp_from: config.from || user.email
        })
        .eq('id', user.id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'test') {
      try {
        const transporter = await createTransporter({
          host: config.host,
          port: parseInt(config.port),
          user: config.user,
          pass: config.pass,
          from: config.from || user.email
        })

        // Verify connection
        await transporter.verify()

        // Send a real test email to check deliverability
        await transporter.sendMail({
          from: `"${config.from || 'ArtisanFlow Test'}" <${config.user}>`,
          to: user.email,
          subject: 'ArtisanFlow - Test de connexion SMTP Réussi !',
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #00236f;">Connexion SMTP Réussie</h2>
              <p>Félicitations ! Votre configuration SMTP fonctionne parfaitement sur ArtisanFlow.</p>
              <p><strong>Détails du test :</strong></p>
              <ul>
                <li>Hôte : ${config.host}</li>
                <li>Utilisateur : ${config.user}</li>
              </ul>
              <p style="color: #666; font-size: 0.9em; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                Ceci est un email automatique de test. Si vous le recevez dans vos spams, assurez-vous d'avoir bien configuré vos enregistrements SPF/DKIM chez votre fournisseur d'email.
              </p>
            </div>
          `,
          text: `ArtisanFlow - Test réussi ! Votre configuration SMTP pour ${config.host} fonctionne.`
        })

        return NextResponse.json({ success: true })
      } catch (err: any) {
        console.error('SMTP Test Error:', err)
        return NextResponse.json({ 
          error: 'Échec de la connexion SMTP. Veuillez vérifier vos paramètres.' 
        }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (err: any) {
    console.error('SMTP API Error:', err)
    return NextResponse.json({ error: "Une erreur est survenue lors de l'enregistrement." }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from')
      .eq('id', user.id)
      .single()

    if (error) throw error

    // Decrypt password for display if needed (though masked by UI)
    if (profile?.smtp_pass) {
      profile.smtp_pass = decrypt(profile.smtp_pass)
    }

    return NextResponse.json(profile)
  } catch (err: any) {
    return NextResponse.json({ error: "Impossible de récupérer la configuration." }, { status: 500 })
  }
}
