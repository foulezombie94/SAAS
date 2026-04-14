import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotePdfDocument } from '@/lib/pdf/templates/QuotePdf';
import React from 'react';

/**
 * 📄 PDF Generation Static Route (Ultra-Robust)
 * Path: /api/quotes/download-pdf?id=xxx
 * 
 * We use a static path + query param for the highest reliability 
 * across Vercel deployment and middleware matching.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quoteId = searchParams.get('id');

    if (!quoteId) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Internal Security Check
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 1. Fetch Quote with all necessary relations
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, profiles(*), clients(*), quote_items(*)')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single();

    if (error || !quote) {
      console.error('PDF Fetch Error:', error);
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    // 2. Generate PDF Buffer using React-PDF
    const buffer = await renderToBuffer(
      <QuotePdfDocument quote={quote as any} /> as any
    );

    // 3. Return PDF Response as Uint8Array for Web API compatibility
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Devis_${quote.number}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('PDF Generation API Error:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' }, 
      { status: 500 }
    );
  }
}
