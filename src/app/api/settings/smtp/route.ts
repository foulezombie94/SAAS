import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createTransporter } from '@/lib/nodemailer'
import { encrypt, decrypt } from '@/lib/encryption'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.union([z.string(), z.number()]).transform(v => {
    const p = parseInt(v.toString());
    return isNaN(p) ? 0 : p;
  }).refine(v => v > 0, 'Port invalide'),
  user: z.string().min(1, 'User is required'),
  pass: z.string().optional(),
  from: z.string().max(100, 'Nom trop long').optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 🛡️ RATE LIMITING (Grade 3)
    const ratelimit = await rateLimit(`smtp:${user.id}`, 5, 60000)
    if (!ratelimit.success) {
      return NextResponse.json({ error: ratelimit.message }, { headers: ratelimit.headers, status: 429 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pro) {
      return NextResponse.json({ error: 'Fonctionnalité réservée aux comptes Pro' }, { status: 403 })
    }

    const body = await request.json()
    const { action, config: rawConfig } = body

    // 🛡️ ZOD VALIDATION
    const configResult = smtpSchema.safeParse(rawConfig)
    if (!configResult.success) {
      return NextResponse.json({ 
        error: 'Configuration invalide', 
        details: configResult.error.format() 
      }, { status: 400 })
    }
    const config = configResult.data

    if (action === 'save') {
      const updateData: any = {
        smtp_host: config.host,
        smtp_port: config.port,
        smtp_user: config.user,
        smtp_from: config.from || user.email
      }

      // N'update le mot de passe que s'il est présent
      if (config.pass) {
        updateData.smtp_pass = encrypt(config.pass)
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'test') {
      try {
        let testPass: string | null | undefined = config.pass
        
        // Si on demande d'utiliser le mot de passe stocké
        if (testPass === '__STORED_PASSWORD__') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('smtp_pass')
            .eq('id', user.id)
            .single()
          
          if (!profile?.smtp_pass) {
            return NextResponse.json({ error: "Aucun mot de passe configuré." }, { status: 400 })
          }
          testPass = decrypt(profile.smtp_pass)
        }

        const transporter = await createTransporter({
          host: config.host as string,
          port: config.port,
          user: config.user as string,
          pass: testPass || '',
          from: config.from || user.email as string
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
        
        let errorMessage = 'Échec de la connexion SMTP.'
        if (err.code === 'EAUTH') {
          errorMessage = 'Erreur d\'authentification : Vérifiez votre email et mot de passe (ou utilisez un mot de passe d\'application).'
        } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
          errorMessage = 'Erreur de connexion : Le serveur est injoignable ou le port est incorrect.'
        } else if (err.message) {
          errorMessage = `Erreur SMTP : ${err.message}`
        }

        return NextResponse.json({ 
          error: errorMessage 
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
      .select('smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, is_pro')
      .eq('id', user.id)
      .single()

    if (error) throw error
    
    if (!profile?.is_pro) {
      return NextResponse.json({ error: 'Fonctionnalité réservée aux comptes Pro' }, { status: 403 })
    }

    // SÉCURITÉ : Ne jamais renvoyer le mot de passe en clair au client.
    // On renvoie un indicateur pour l'UI.
    const has_smtp_pass = !!profile?.smtp_pass;
    
    // On nettoie l'objet avant de le renvoyer
    const sanitizedProfile = {
      ...profile,
      smtp_pass: undefined,
      has_smtp_pass
    }

    return NextResponse.json(sanitizedProfile)
  } catch (err: any) {
    return NextResponse.json({ error: "Impossible de récupérer la configuration." }, { status: 500 })
  }
}
