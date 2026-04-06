import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { userId, secret } = await req.json()

    // 🛡️ SECURITY GRADE 3 : Validation du secret partagé
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized revalidation' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // 🚀 REVALIDATION INSTANTANÉE
    // On vide le layout global du dashboard, ce qui rafraîchit toutes les données du profil
    revalidatePath('/dashboard', 'layout')

    console.log(`[REVALIDATE] Success for user ${userId}`)
    return NextResponse.json({ revalidated: true, now: Date.now() })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
