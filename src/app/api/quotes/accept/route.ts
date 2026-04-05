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
      // Fetch quote with admin to verify existence (UUID is the secret)
      const { data: quote } = await adminSupabase
        .from('quotes')
        .select('id, status')
        .eq('id', quoteId)
        .single()

      if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      if (quote.status === 'accepted') return NextResponse.json({ error: 'Already accepted' }, { status: 400 })

      // Upload to Storage via Admin (since public doesn't have RLS write)
      const res = await fetch(signatureDataUrl)
      const blob = await res.blob()
      const fileName = `remote_sig_${quoteId}_${Date.now()}.png`
      
      const { error: uploadError } = await adminSupabase.storage
        .from('signatures')
        .upload(fileName, blob, { contentType: 'image/png' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = adminSupabase.storage
        .from('signatures')
        .getPublicUrl(fileName)
      
      finalSignatureUrl = publicUrl

      // Update via Admin
      await adminSupabase
        .from('quotes')
        .update({ status: 'accepted', signature_url: finalSignatureUrl })
        .eq('id', quoteId)

      return NextResponse.json({ success: true, signatureUrl: finalSignatureUrl })
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

    const { error: updateError } = await supabase
      .from('quotes')
      .update({ 
        status: 'accepted', 
        signature_url: finalSignatureUrl 
      })
      .eq('id', quoteId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Accept Quote Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
