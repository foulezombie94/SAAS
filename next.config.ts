import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const cspHeader = `
    default-src 'self';
    script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""} https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://*.stripe.com https://images.unsplash.com https://*.unsplash.com https://lh3.googleusercontent.com;
    font-src 'self' data: https://fonts.gstatic.com;
    media-src 'self' https://assets.mixkit.co;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? "" : "upgrade-insecure-requests;"}
    report-uri /api/csp-report;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  // Configured for Next.js 16 (Stability & Standard)
  reactStrictMode: true,
  poweredByHeader: false, // Security: Remove X-Powered-By header
  experimental: {
    // cacheComponents: true, // ⚠️ Disabled to avoid 'Blocking Route' build errors in multi-tenant environments
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
