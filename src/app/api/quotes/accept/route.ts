import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  try {
    const { quoteId, signatureUrl, signatureDataUrl, isPublic } = await req.json()
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    let finalSignatureUrl = signatureUrl

    // 1. Handle Public Signature (Distance)
    if (isPublic && signatureDataUrl) {
      // 1. Create Invoice and Items
      const { data: quoteItems } = await adminSupabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)

      const { data: fullQuote } = await adminSupabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (!fullQuote) throw new Error('Quote details not found');

      // Generate Invoice Number
      const year = new Date().getFullYear();
      const { count } = await adminSupabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', fullQuote.user_id);
      const nextNumber = (count || 0) + 1;
      const invoiceNumber = `FAC-${year}-${nextNumber.toString().padStart(4, '0')}`;

      if (!fullQuote.client_id) throw new Error('Un client doit être associé au devis pour générer une facture');

      const { data: invoice, error: iError } = await adminSupabase
        .from('invoices')
        .insert({
          user_id: fullQuote.user_id,
          client_id: fullQuote.client_id as string,
          quote_id: fullQuote.id,
          number: invoiceNumber,
          status: 'pending',
          total_ht: fullQuote.total_ht,
          tax_rate: fullQuote.tax_rate,
          total_ttc: fullQuote.total_ttc,
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days
        })
        .select()
        .single()

      if (iError) throw iError;

      if (quoteItems && quoteItems.length > 0) {
        const invoiceItems = quoteItems.map((item: any) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          tax_rate: item.tax_rate || fullQuote.tax_rate || 20,
          total_ht: item.total_ht || item.total_price,
          total_ttc: item.total_ttc || (item.total_price ? item.total_price * 1.2 : 0)
        }));
        await adminSupabase.from('invoice_items').insert(invoiceItems);
      }

      // Update Quote Status via Admin
      await adminSupabase
        .from('quotes')
        .update({ status: 'accepted', signature_url: finalSignatureUrl })
        .eq('id', quoteId)

      return NextResponse.json({ success: true, signatureUrl: finalSignatureUrl, invoiceId: invoice.id })
    }

    // 2. Handle Dashboard Signature (Face-to-Face)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('user_id, status')
      .eq('id', quoteId)
      .single()

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update via Supabase (Authenticated)
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        status: 'accepted', 
        signature_url: finalSignatureUrl 
      })
      .eq('id', quoteId)

    if (updateError) throw updateError

    const { data: quoteItems } = await supabase.from('quote_items').select('*').eq('quote_id', quoteId);
    const { data: fullQuote } = await supabase.from('quotes').select('*').eq('id', quoteId).single();

    if (!fullQuote || !fullQuote.client_id) {
      return NextResponse.json({ success: true }) // Accept without invoice if client missing or not found
    }

    const year = new Date().getFullYear();
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const nextNumber = (count || 0) + 1;
    const invoiceNumber = `FAC-${year}-${nextNumber.toString().padStart(4, '0')}`;

    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: fullQuote.client_id as string,
        quote_id: fullQuote.id,
        number: invoiceNumber,
        status: 'pending',
        total_ht: fullQuote.total_ht,
        tax_rate: fullQuote.tax_rate,
        total_ttc: fullQuote.total_ttc,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (invoice && quoteItems) {
      const invoiceItems = quoteItems.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_rate: item.tax_rate || fullQuote.tax_rate || 20,
        total_ht: item.total_ht || item.total_price,
        total_ttc: item.total_ttc || (item.total_price ? item.total_price * 1.2 : 0)
      }));
      await supabase.from('invoice_items').insert(invoiceItems);
    }

    return NextResponse.json({ success: true, invoiceId: invoice?.id })
  } catch (err: any) {
    console.error('Accept Quote Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
