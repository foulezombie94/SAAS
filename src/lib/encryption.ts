import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH_GCM = 12 // Standard GCM IV length
// Legacy length for backward compatibility was 16

// Check for missing key - CRITICAL SECURITY
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('FATAL: ENCRYPTION_KEY environment variable is not set. Security standards require a private key for SMTP credentials.')
}

// Derive a 32-byte key from the environment string using SHA-256
// This ensures we always have a strong, 32-byte key regardless of the env string length.
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest()

export function encrypt(text: string): string {
  if (!text) return ''
  const iv = crypto.randomBytes(IV_LENGTH_GCM)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string | null {
  try {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText // Fallback for legacy plain text
    }
    
    const parts = encryptedText.split(':')
    if (parts.length < 3) return encryptedText

    const [ivHex, authTagHex, encrypted] = parts
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    // crypto.createDecipheriv detects IV length automatically
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (err) {
    // SECURITY: Returning null on failure prevents malformed data exposure
    console.error('[ENCRYPTION] Decryption failed. Malformed header or invalid key.');
    return null;
  }
}
