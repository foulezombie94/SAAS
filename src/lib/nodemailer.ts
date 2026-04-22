import nodemailer from 'nodemailer'
import crypto from 'crypto'

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

// FIX #13: Pool transporters by config hash to avoid a new TCP/TLS handshake per email
const transporterCache = new Map<string, nodemailer.Transporter>()

function getConfigHash(config: SmtpConfig): string {
  const key = `${config.host}:${config.port}:${config.user}`
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16)
}

export function createTransporter(config: SmtpConfig) {
  const hash = getConfigHash(config)
  if (transporterCache.has(hash)) {
    return transporterCache.get(hash)!
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    pool: true,                  // Enable connection pooling
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  })

  transporterCache.set(hash, transporter)
  return transporter
}

export async function sendEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments?: any[]
) {
  const transporter = createTransporter(config)

  const mailOptions = {
    from: `"${config.from}" <${config.user}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback to plain text
    html,
    attachments,
    headers: {
      'X-Mailer': 'ArtisanFlow-SMTP',
      'X-Priority': '3',
      'Importance': 'Normal',
    },
  }

  return transporter.sendMail(mailOptions)
}
