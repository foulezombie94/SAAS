import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. IP Extraction for Rate Limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    
    // 2. Rate Limiting (5 reports per minute per IP)
    const { success, headers } = await rateLimit(
      `csp-report:${ip}`,
      5,
      60000,
      { prefix: 'artisan-flow:security' }
    );
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many reports' }, 
        { status: 429, headers }
      );
    }

    // 3. Payload Validation
    const report = await req.json();
    if (!report || typeof report !== 'object') {
       return NextResponse.json({ status: 'invalid' }, { status: 400 });
    }

    // 4. Normalization (Handle legacy csp-report and modern Reporting API)
    const normalizedReport = report['csp-report'] || report;
    
    // 5. Robust Logging (Professional Format)
    console.warn('CSP Violation Detected:', {
      timestamp: new Date().toISOString(),
      ip: ip.replace(/\.\d+$/, '.***'), // Subtle anonymization for logs
      userAgent: req.headers.get('user-agent'),
      report: normalizedReport
    });
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }
}
