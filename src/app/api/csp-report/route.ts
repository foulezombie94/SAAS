import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const report = await req.json();
    console.warn('CSP Violation:', report);
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }
}
