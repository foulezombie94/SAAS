import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers, cookies } from "next/headers";
import "./globals.css";
import { Toaster } from 'sonner'
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ArtisanFlow | Logiciel de Devis & Facturation pour Artisans",
  description: "La solution la plus simple pour les artisans. Créez des devis, facturez et recevez vos paiements en un clin d'œil.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Retrieve context and consent
  const nonce = (await headers()).get("x-nonce") ?? "";
  const cookieStore = await cookies();
  const hasConsent = cookieStore.get("artisanflow_analytics_consent")?.value === "true";
  
  // 🟡 COOKIE FONCTIONNEL : Thème persistant dès le chargement serveur
  const theme = cookieStore.get("af_theme")?.value || 'light';

  return (
    <html lang="fr" className={`${inter.variable} ${theme}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* 🛡️ THEME SCRIPT: Prevent FOUC (Flash of Unstyled Content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const match = document.cookie.match(new RegExp('(^| )af_theme=([^;]+)'));
                const theme = match ? decodeURIComponent(match[2]) : 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Toaster position="top-right" expand={true} richColors closeButton />
        {children}
        {hasConsent && <Analytics />}
      </body>
    </html>
  );
}
