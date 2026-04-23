import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ─────────────────────────────────────────────
// 🧠 INTENT DETECTION — Zero DB call if no match
// ─────────────────────────────────────────────

type Intent =
  | { type: 'quote_by_id'; value: string }
  | { type: 'quote_by_client'; value: string }
  | { type: 'invoice_by_id'; value: string }
  | { type: 'invoice_by_client'; value: string }
  | { type: 'client_lookup'; value: string }
  | { type: 'faq'; topic: string }
  | { type: 'unknown' }

const QUOTE_ID_RE = /(?:devis|quote)\s*(?:n[°o]?|#|numéro)?\s*(\d+)/i
const INVOICE_ID_RE = /(?:facture|invoice)\s*(?:n[°o]?|#|numéro)?\s*(\d+)/i
const QUOTE_CLIENT_RE = /(?:devis|devis de|quotes?\s+(?:de|pour|du client))\s+([A-Za-zÀ-ÿ\s\-']{2,40})/i
const INVOICE_CLIENT_RE = /(?:facture|factures?\s+(?:de|pour|du client))\s+([A-Za-zÀ-ÿ\s\-']{2,40})/i
const CLIENT_RE = /(?:client|contact)\s+([A-Za-zÀ-ÿ\s\-']{2,40})/i

const FAQ: Record<string, string> = {
  devis: "📄 Pour créer un devis : **Devis → Nouveau devis** dans le menu latéral. Vous pouvez y ajouter des lignes, appliquer des taxes et envoyer directement au client.",
  facture: "🧾 Vos factures sont dans la section **Factures**. Chaque facture peut être exportée en PDF ou envoyée par e-mail.",
  paiement: "💳 Les paiements sont traités via Stripe. Vérifiez dans **Factures** si un paiement est en attente.",
  client: "👤 Gérez vos clients dans **Clients**. Chaque fiche client regroupe ses devis et factures associés.",
  aide: "💡 Posez-moi votre question ! Je peux rechercher vos devis ou factures par numéro ou nom de client.",
  bonjour: "👋 Bonjour ! Comment puis-je vous aider ? Dites-moi par exemple : *devis #42* ou *devis de Dupont*.",
}

function detectIntent(message: string): Intent {
  const m = message.trim()

  // Quote by number
  const qId = QUOTE_ID_RE.exec(m)
  if (qId) return { type: 'quote_by_id', value: qId[1] }

  // Invoice by number
  const invId = INVOICE_ID_RE.exec(m)
  if (invId) return { type: 'invoice_by_id', value: invId[1] }

  // Quote by client name
  const qClient = QUOTE_CLIENT_RE.exec(m)
  if (qClient) return { type: 'quote_by_client', value: qClient[1].trim() }

  // Invoice by client name
  const invClient = INVOICE_CLIENT_RE.exec(m)
  if (invClient) return { type: 'invoice_by_client', value: invClient[1].trim() }

  // Client lookup
  const cl = CLIENT_RE.exec(m)
  if (cl) return { type: 'client_lookup', value: cl[1].trim() }

  // FAQ keywords
  for (const key of Object.keys(FAQ)) {
    if (m.toLowerCase().includes(key)) return { type: 'faq', topic: key }
  }

  return { type: 'unknown' }
}

// ─────────────────────────────────────────────
// 📊 DB QUERIES — Minimal, scoped to user_id
// ─────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: '📝 Brouillon',
  sent: '📤 Envoyé',
  accepted: '✅ Accepté',
  paid: '💰 Payé',
  expired: '⏰ Expiré',
  cancelled: '❌ Annulé',
}

function fmt(amount: number | null) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

async function findQuoteById(supabase: any, userId: string, number: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select('id, number, status, total_ttc, created_at, clients:client_id(name)')
    .eq('user_id', userId)
    .eq('number', parseInt(number))
    .maybeSingle()

  if (error || !data) return `❌ Aucun devis #${number} trouvé dans votre compte.`

  const client = (data.clients as any)?.name ?? 'Client inconnu'
  const status = STATUS_LABELS[data.status] ?? data.status
  const date = new Date(data.created_at).toLocaleDateString('fr-FR')
  return `📄 **Devis #${data.number}**\n👤 Client : ${client}\n📅 Date : ${date}\n💶 Montant TTC : ${fmt(data.total_ttc)}\n📌 Statut : ${status}`
}

async function findQuotesByClient(supabase: any, userId: string, name: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select('number, status, total_ttc, created_at, clients:client_id(name)')
    .eq('user_id', userId)
    .ilike('clients.name', `%${name}%`)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error || !data?.length) return `❌ Aucun devis trouvé pour un client correspondant à **"${name}"**.`

  const lines = data.map((q: any) => {
    const status = STATUS_LABELS[q.status] ?? q.status
    return `• Devis #${q.number} — ${fmt(q.total_ttc)} — ${status}`
  })
  const clientName = (data[0].clients as any)?.name ?? name
  return `📋 **Devis de ${clientName}** (${data.length} résultat${data.length > 1 ? 's' : ''}) :\n${lines.join('\n')}`
}

async function findInvoiceById(supabase: any, userId: string, number: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, number, status, total_ttc, created_at, clients:client_id(name)')
    .eq('user_id', userId)
    .eq('number', parseInt(number))
    .maybeSingle()

  if (error || !data) return `❌ Aucune facture #${number} trouvée dans votre compte.`

  const client = (data.clients as any)?.name ?? 'Client inconnu'
  const status = STATUS_LABELS[data.status] ?? data.status
  const date = new Date(data.created_at).toLocaleDateString('fr-FR')
  return `🧾 **Facture #${data.number}**\n👤 Client : ${client}\n📅 Date : ${date}\n💶 Montant TTC : ${fmt(data.total_ttc)}\n📌 Statut : ${status}`
}

async function findInvoicesByClient(supabase: any, userId: string, name: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('number, status, total_ttc, created_at, clients:client_id(name)')
    .eq('user_id', userId)
    .ilike('clients.name', `%${name}%`)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error || !data?.length) return `❌ Aucune facture trouvée pour un client correspondant à **"${name}"**.`

  const lines = data.map((inv: any) => {
    const status = STATUS_LABELS[inv.status] ?? inv.status
    return `• Facture #${inv.number} — ${fmt(inv.total_ttc)} — ${status}`
  })
  const clientName = (data[0].clients as any)?.name ?? name
  return `📋 **Factures de ${clientName}** (${data.length} résultat${data.length > 1 ? 's' : ''}) :\n${lines.join('\n')}`
}

async function findClient(supabase: any, userId: string, name: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('name, email, phone, quotes:quotes(id)')
    .eq('user_id', userId)
    .ilike('name', `%${name}%`)
    .limit(3)

  if (error || !data?.length) return `❌ Aucun client trouvé pour **"${name}"**.`

  const lines = data.map((c: any) => {
    const nbDevis = (c.quotes as any[])?.length ?? 0
    return `• **${c.name}** — ${c.email ?? '—'} — ${nbDevis} devis`
  })
  return `👤 **Clients trouvés** :\n${lines.join('\n')}`
}

// ─────────────────────────────────────────────
// 🚀 ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: "Message invalide." }, { status: 400 })
    }

    const intent = detectIntent(message)

    // ✅ FAQ / unknown — zero DB call
    if (intent.type === 'faq') {
      return NextResponse.json({ reply: FAQ[intent.topic], intent: 'faq' })
    }
    if (intent.type === 'unknown') {
      return NextResponse.json({
        reply: "Je n'ai pas compris votre demande. Essayez par exemple :\n• *devis #42*\n• *devis de Dupont*\n• *facture #12*\n• *aide*",
        intent: 'unknown',
      })
    }

    // 🔒 Auth — only when DB query needed
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ reply: "❌ Session expirée. Veuillez vous reconnecter." }, { status: 401 })
    }

    let reply: string

    switch (intent.type) {
      case 'quote_by_id':
        reply = await findQuoteById(supabase, user.id, intent.value)
        break
      case 'quote_by_client':
        reply = await findQuotesByClient(supabase, user.id, intent.value)
        break
      case 'invoice_by_id':
        reply = await findInvoiceById(supabase, user.id, intent.value)
        break
      case 'invoice_by_client':
        reply = await findInvoicesByClient(supabase, user.id, intent.value)
        break
      case 'client_lookup':
        reply = await findClient(supabase, user.id, intent.value)
        break
      default:
        reply = "Demande non reconnue."
    }

    return NextResponse.json({ reply, intent: intent.type })
  } catch (err) {
    console.error('[CHAT API ERROR]', err)
    return NextResponse.json({ reply: "⚠️ Une erreur est survenue. Veuillez réessayer." }, { status: 500 })
  }
}
