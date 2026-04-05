import nodemailer from 'nodemailer'

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

export async function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Best practices to avoid spam
    tls: {
      rejectUnauthorized: true
    }
  })
}

export async function sendEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments?: any[]
) {
  const transporter = await createTransporter(config)

  const mailOptions = {
    from: `"${config.from}" <${config.user}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback to plain text
    html,
    attachments,
    // Anti-spam headers
    headers: {
      'X-Mailer': 'ArtisanFlow-SMTP',
      'X-Priority': '3', // Normal priority
      'Importance': 'Normal'
    }
  }

  return await transporter.sendMail(mailOptions)
}
