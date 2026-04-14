import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotePdfDocument } from '@/lib/pdf/templates/QuotePdf';
import React from 'react';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 1. Fetch Quote with all necessary relations
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, profiles(*), clients(*), quote_items(*)')
      .eq('id', quoteId)
      .eq('user_id', user.id) // Security check
      .single();

    if (error || !quote) {
      console.error('PDF Fetch Error:', error);
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    // 2. Generate PDF Buffer
    const buffer = await renderToBuffer(
      React.createElement(QuotePdfDocument, { quote: quote as any })
    );

    // 3. Return PDF Response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Devis_${quote.number}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('PDF Generation API Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 });
  }
}
