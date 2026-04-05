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

      console.log(`[API/Accept] Processing signature for quote: ${quoteId}`);
      
      // NEW: Robust Buffer-based signature upload
      const base64Data = signatureDataUrl.split(',')[1];
      if (!base64Data) throw new Error('Format de signature invalide');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `remote_sig_${quoteId}_${Date.now()}.png`
      
      const { error: uploadError } = await adminSupabase.storage
        .from('signatures')
        .upload(fileName, buffer, { 
          contentType: 'image/png',
          upsert: true 
        })

      if (uploadError) {
        console.error('[API/Accept] Upload error:', uploadError);
        throw new Error(`Échec de l'envoi de la signature: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = adminSupabase.storage
        .from('signatures')
        .getPublicUrl(fileName)
      
      finalSignatureUrl = publicUrl;
      console.log(`[API/Accept] Signature uploaded: ${finalSignatureUrl}`);

      // Generate Invoice Number
      const year = new Date().getFullYear();
      const { count } = await adminSupabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', fullQuote.user_id);
      
      const nextNumber = (count || 0) + 1;
      const invoiceNumber = `FAC-${year}-${nextNumber.toString().padStart(4, '0')}`;
      console.log(`[API/Accept] Generating invoice: ${invoiceNumber}`);

      if (!fullQuote.client_id) throw new Error('Un client doit être associé au devis pour générer une facture');

      const { data: invoice, error: iError } = await adminSupabase
        .from('invoices')
        .insert({
          user_id: fullQuote.user_id,
          client_id: fullQuote.client_id as string,
          quote_id: fullQuote.id,
          number: invoiceNumber,
          status: 'sent',
          total_ht: fullQuote.total_ht,
          tax_rate: fullQuote.tax_rate,
          total_ttc: fullQuote.total_ttc,
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (iError) {
        console.error('[API/Accept] Invoice insert error:', iError);
        throw new Error(`Échec de création de la facture: ${iError.message}`);
      }

      console.log(`[API/Accept] Invoice created: ${invoice.id}`);

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
        const { error: itemsError } = await adminSupabase.from('invoice_items').insert(invoiceItems);
        if (itemsError) {
          console.error('[API/Accept] Items insert error:', itemsError);
          // Non-blocking for the flow, but good to know
        }
      }

      // Update Quote Status via Admin
      const { error: qUpdateError } = await adminSupabase
        .from('quotes')
        .update({ status: 'accepted', signature_url: finalSignatureUrl })
        .eq('id', quoteId)

      if (qUpdateError) {
        console.error('[API/Accept] Quote update error:', qUpdateError);
        throw new Error(`Échec de la mise à jour du devis: ${qUpdateError.message}`);
      }

      console.log(`[API/Accept] Success! Quote accepted and invoiced.`);
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
        status: 'sent',
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
