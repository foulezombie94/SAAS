import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { checkLimits } from '@/lib/limits'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { quoteId } = await req.json()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check limits
    const status = await checkLimits('invoices')
    if (!status.allowed) {
      return NextResponse.json({ 
        error: 'Limite de 3 factures atteinte. Passez en PRO pour continuer !',
        limitReached: true 
      }, { status: 403 })
    }

    // 1. Fetch Quote and Items with Strict Ownership Check
    const { data: quote, error: qError } = await supabase
      .from('quotes')
      .select('*, quote_items(*)')
      .eq('id', quoteId)
      .eq('user_id', user.id) // SECURITY: Ensure the quote belongs to the user
      .single()

    if (qError || !quote) {
      return NextResponse.json({ error: 'Quote not found or access denied' }, { status: 403 })
    }

    if (quote.status !== 'paid') {
       throw new Error('Le devis doit être payé pour générer une facture officielle')
    }

    // 2. Check if Invoice Already Exists for this Quote
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('quote_id', quoteId)
      .single()

    if (existingInvoice) {
      return NextResponse.json({ invoiceId: existingInvoice.id, message: 'Invoice already exists' })
    }

    // 3. Generate Professional Invoice Number (FAC-YYYY-XXX)
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const nextNumber = (count || 0) + 1
    const invoiceNumber = `FAC-${year}-${nextNumber.toString().padStart(4, '0')}`

    // 4. Create Invoice
    if (!quote.client_id) throw new Error('Un client doit être associé au devis pour générer une facture')

      const { data: invoice, error: iError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: quote.client_id,
        quote_id: quote.id,
        number: invoiceNumber,
        status: 'paid', // Mark as paid since the quote was paid
        total_ht: quote.total_ht,
        tax_rate: quote.tax_rate,
        total_ttc: quote.total_ttc,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (iError) throw iError

    // 5. Clone Items to Invoice
    const invoiceItems = quote.quote_items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      tax_rate: item.tax_rate || quote.tax_rate || 20,
      total_ht: item.total_ht || item.total_price,
      total_ttc: item.total_ttc || (item.total_price ? item.total_price * 1.2 : 0)
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) throw itemsError

    // 6. Update Quote Status to 'invoiced'
    await supabase
      .from('quotes')
      .update({ status: 'invoiced' })
      .eq('id', quote.id)

    return NextResponse.json({ invoiceId: invoice.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
