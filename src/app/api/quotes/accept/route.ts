import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const { quoteId, publicToken, signatureUrl, signatureDataUrl } = await req.json()
    
    // 0. RATE LIMITING SECURE (IP detection)
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const limit = await rateLimit(`public-accept-${ip}`, 5, 60000)
    if (!limit.success) {
      return NextResponse.json({ error: limit.message }, { status: 429 })
    }

    // 1. VALIDATION UUID
    if (!quoteId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quoteId)) {
      return NextResponse.json({ error: 'ID de devis invalide' }, { status: 400 })
    }

    const supabase = await createClient()

    // 2. SIGNATURE UPLOAD (Anti-DoS Protection 2MB + Binary Validation)
    let finalSignatureUrl = signatureUrl
    if (signatureDataUrl) {
      // 🛡️ SECURITY GRADE 3 : Validation du format
      if (!signatureDataUrl.startsWith('data:image/png;base64,')) {
        return NextResponse.json({ error: 'Format de signature invalide (PNG attendu)' }, { status: 400 })
      }

      const base64Data = signatureDataUrl.split(',')[1];
      if (!base64Data) throw new Error('Format de signature corrompu');
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      // 🛡️ ANTI-DoS
      if (buffer.length > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Signature trop volumineuse (max 2Mo)' }, { status: 413 })
      }

      const fileName = `sig_${quoteId}_${Date.now()}.png`
      const adminSupabase = createAdminClient()
      
      const { error: uploadError } = await adminSupabase.storage
        .from('signatures')
        .upload(fileName, buffer, { 
          contentType: 'image/png',
          upsert: true 
        })

      if (uploadError) throw new Error(`Upload Error: ${uploadError.message}`);

      const { data: { publicUrl } } = adminSupabase.storage
        .from('signatures')
        .getPublicUrl(fileName)
      
      finalSignatureUrl = publicUrl;
    }

    // 3. ATOMIC TRANSACTION (RPC v3 - Zero Trust Split Flow)
    // 🛡️ SECURITY GRADE 3 : We use adminSupabase to bypass RLS because Guests don't have a session.
    // The RPC itself will verify the p_public_token.
    const adminSupabase = createAdminClient()
    const { data: invoiceId, error: rpcError } = await adminSupabase.rpc('accept_quote_v3', {
      p_public_token: publicToken || 'invalid_token_placeholder',
      p_quote_id: quoteId,
      p_signature_url: finalSignatureUrl || ''
    });

    if (rpcError) {
      // 🕵️‍♂️ SECURITY : Detailed logs for the artisan, masked for the public
      console.error('[API/Accept] RPC Zero-Trust Refusal:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code,
        payload: { quoteId, hasToken: !!publicToken }
      });
      return NextResponse.json({ 
        error: 'Accès refusé ou lien expiré', 
        details: rpcError.message // Temporary unmask for debugging if needed
      }, { status: 403 });
    }

    // 🚀 Invalidation Cache Global pour le Dashboard
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({ 
      success: true, 
      signatureUrl: finalSignatureUrl, 
      invoiceId 
    })

  } catch (err: any) {
    console.error('Critical Acceptance Failure:', err)
    return NextResponse.json({ 
      error: err.message || "Une erreur fatale est survenue lors de l'acceptation." 
    }, { status: 500 })
  }
}
