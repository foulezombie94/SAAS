import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const report = await req.json();
    console.warn('CSP Violation:', report);
    
    // In a real pro environment, you would log this to a service like Sentry 
    // or a dedicated logging table in Supabase.
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }
}
