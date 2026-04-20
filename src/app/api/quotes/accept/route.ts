import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient, requireAdminClient } from '@/lib/supabase/admin'
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
      // 🛡️ SECURITY GRADE 3 : Validation du format image base64 (PNG/JPEG/WebP mobile compatible)
      const mimeMatch = signatureDataUrl.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,/)
      if (!mimeMatch) {
        return NextResponse.json({ error: 'Format de signature invalide (image base64 attendu)' }, { status: 400 })
      }

      const mimeType = mimeMatch[1]
      const ext = mimeMatch[2]?.replace('jpeg', 'jpg') || 'png'
      const base64Data = signatureDataUrl.split(',')[1];
      if (!base64Data) throw new Error('Format de signature corrompu');
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      // 🛡️ ANTI-DoS
      if (buffer.length > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Signature trop volumineuse (max 2Mo)' }, { status: 413 })
      }

      const fileName = `sig_${quoteId}_${Date.now()}.${ext}`
      const adminSupabase = requireAdminClient()
      
      const { error: uploadError } = await adminSupabase.storage
        .from('signatures')
        .upload(fileName, buffer, { 
          contentType: mimeType,
          upsert: true 
        })

      if (uploadError) throw new Error(`Upload Error: ${uploadError.message}`);

      const { data: { publicUrl } } = adminSupabase.storage
        .from('signatures')
        .getPublicUrl(fileName)
      
      finalSignatureUrl = publicUrl;
    }


    // 3. ATOMIC TRANSACTION (RPC v4 - Dual Signature Flow)
    const adminSupabase = requireAdminClient()
    const { data: quoteResult, error: rpcError } = await adminSupabase.rpc('accept_quote_v4', {
      p_public_token: publicToken || 'invalid_token_placeholder',
      p_quote_id: quoteId,
      p_signature_url: finalSignatureUrl || '',
      p_signer_type: 'client'
    });

    if (rpcError) {
      // 🕵️‍♂️ SECURITY : Detailed logs for the artisan, masked for the public
      console.error('[API/Accept] RPC Zero-Trust Refusal:', {
        message: rpcError.message,
        details: rpcError.details,
        code: rpcError.code
      });
      return NextResponse.json({ 
        error: 'Accès refusé ou lien expiré', 
        details: rpcError.message 
      }, { status: 403 });
    }

    // 🚀 Invalidation Cache Global pour le Dashboard
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({ 
      success: true, 
      signatureUrl: finalSignatureUrl, 
      invoiceId: typeof quoteResult === 'object' ? (quoteResult as any)?.invoice_id : null
    })

  } catch (err: any) {
    if (err.message === 'SERVICE_UNAVAILABLE') {
      return NextResponse.json({ error: 'Service de signature momentanément indisponible (Configuration Admin manquante).' }, { status: 503 })
    }
    console.error('Critical Acceptance Failure:', err)
    return NextResponse.json({ 
      error: err.message || "Une erreur fatale est survenue lors de l'acceptation." 
    }, { status: 500 })
  }
}
