import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "ArtisanFlow | Logiciel de Devis & Facturation pour Artisans",
  description: "La solution la plus simple pour les artisans. Créez des devis, facturez et recevez vos paiements en un clin d'œil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable}`}>
      <body className="antialiased">
        <Toaster position="top-right" expand={true} richColors closeButton />
        {children}
      </body>
    </html>
  );
}
