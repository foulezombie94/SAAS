import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
    }

    const table = type === 'quote' ? 'quotes' : 'invoices'
    
    const { data, error } = await supabase
      .from(table)
      .select('id, number, status, total_ttc, created_at, clients:client_id(name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: "Document non trouvé." }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[CHAT PREVIEW ERROR]', err)
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}
