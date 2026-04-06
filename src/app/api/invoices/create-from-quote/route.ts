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

    // 1. Create Invoice from Quote via RPC (Atomic Transaction)
    const { data, error: rpcError } = await supabase.rpc('create_invoice_from_quote_v2', {
      p_quote_id: quoteId
    })

    if (rpcError) throw rpcError

    const result = data as { invoiceId: string; message?: string }
    return NextResponse.json({ invoiceId: result.invoiceId, message: result.message })
  } catch (e: any) {
    console.error('Invoice Creation Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

