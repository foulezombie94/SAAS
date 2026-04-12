import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
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
  // Retrieve the cryptographic nonce generated in middleware
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="fr" className={`${inter.variable}`}>
      <body className="antialiased">
        <Toaster position="top-right" expand={true} richColors closeButton />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
