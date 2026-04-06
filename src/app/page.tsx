"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleProAction = async () => {
    if (!user) {
      router.push(`/signup?redirect=/dashboard`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: isYearly ? 'yearly' : 'monthly' })
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du lancement du paiement. Vérifiez votre configuration Stripe.');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeAction = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/signup');
    }
  };
  return (
    <div className="bg-surface text-on-surface selection:bg-tertiary-fixed-dim selection:text-on-tertiary-fixed border-t-2 border-transparent">
      {/* Vercel Rebuild Trigger - Fix 404 Case Sensitivity & Versions */}
      <Navbar />

      <main className="pt-24 overflow-hidden">
        {/* Hero Section */}
        <section className="relative px-6 py-16 md:py-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase mb-6 rounded-sm">
                L'OUTIL DES PROS
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-primary leading-tight mb-8">
                Gagnez du temps sur vos chantiers avec ArtisanFlow
              </h1>
              <p className="text-xl text-on-surface-variant leading-relaxed mb-10 max-w-lg">
                Créez vos devis en 2 minutes, soyez payé plus vite. Le seul outil conçu pour les artisans, par des experts du bâtiment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleFreeAction}
                  className="bg-tertiary-fixed-dim text-on-tertiary-fixed px-8 py-4 text-lg font-bold rounded-md shadow-lg transition-all hover:bg-tertiary hover:text-on-tertiary"
                >
                  Commencer Gratuitement
                </button>
                <button className="border-2 border-primary text-primary px-8 py-4 text-lg font-bold rounded-md hover:bg-surface-container-low transition-all">
                  Voir la démo
                </button>
              </div>
            </div>
            <div className="relative mt-12 lg:mt-0">
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-tertiary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
              <div className="relative grid grid-cols-12 gap-4">
                <div className="col-span-8 transform -rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl rounded-xl overflow-hidden border-4 border-white bg-white">
                  <img
                    className="w-full aspect-video object-cover"
                    alt="ArtisanFlow Dashboard"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDahAP1wYn6P3n8SiLC7Z7uTTBWaBv84g4dSmuGjgpwj-J85Zd_VR3MqUDKRMesMKGSQRtcnxpnxcEJ8_1bMCLRGbWxwlomqyu7N_7JBP5xWILvxMfWiudm3WZuZ_G9GYTpLP1JvfvGzfZRKMh7XExc5D3UgCuNugNlA5z0r8E-voW9izDrp8Fp6TXla5s8Homu3mT7iJlQnWtnT8T51gzbjm_QWQ8ZB1k4gJaJbL5wx5T8CWzHAvAQGLI5WsmpGAd9tlJPFsl7uZf3"
                  />
                </div>
                <div className="col-span-7 col-start-5 -mt-20 transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl rounded-xl overflow-hidden border-4 border-white bg-white">
                  <img
                    className="w-full aspect-video object-cover"
                    alt="Quote Editor"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDN9b0liy9NIMDIIW7dYzHKoEnRpmFX12JsUi_mJ_5J_TnWQijgedQY1Qd45IzEeI_atXlVANfDrpewOrjtUXEEEIIsGWj9WGwqn1M4FUIxYkrCS_csHG2xy3ILXpA7FFuOnIYv3vMMKD-OtzgghLv0PRFWQKW99PnbfYg6H8Wfr4OASHBYdIq6IbLZ-R7vr8fHmXh_Zhx9To_0HEUlby4TgTAOnZTem3SQifHWFcOqmwS_1HCJPxropZki1o4gAkrMdi-JwYJR5B86"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section id="features" className="bg-surface-container-low py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-primary mb-4">Pourquoi choisir ArtisanFlow ?</h2>
              <div className="h-1.5 w-20 bg-tertiary-fixed-dim mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Benefit 1 */}
              <div className="bg-surface-container-lowest p-8 rounded-lg transition-all hover:bg-surface-container-highest group">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">speed</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">Vitesse</h3>
                <p className="text-on-surface-variant leading-relaxed">Devis en 2 minutes chrono. Répondez à vos clients avant même de quitter le chantier.</p>
              </div>
              {/* Benefit 2 */}
              <div className="bg-surface-container-lowest p-8 rounded-lg transition-all hover:bg-surface-container-highest group">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">touch_app</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">Simplicité</h3>
                <p className="text-on-surface-variant leading-relaxed">Pas besoin d'être un expert en informatique. Une interface intuitive pensée pour le terrain.</p>
              </div>
              {/* Benefit 3 */}
              <div className="bg-surface-container-lowest p-8 rounded-lg transition-all hover:bg-surface-container-highest group">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">Paiement Rapide</h3>
                <p className="text-on-surface-variant leading-relaxed">Lien Stripe intégré pour un règlement immédiat. Réduisez vos délais de paiement de 50%.</p>
              </div>
              {/* Benefit 4 */}
              <div className="bg-surface-container-lowest p-8 rounded-lg transition-all hover:bg-surface-container-highest group">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">Image Pro</h3>
                <p className="text-on-surface-variant leading-relaxed">Des PDF impeccables à l'image de votre savoir-faire. Gagnez la confiance de vos clients.</p>
              </div>
              {/* Benefit 5 - Agenda */}
              <div className="bg-surface-container-lowest p-8 rounded-lg transition-all hover:bg-surface-container-highest group border-2 border-transparent hover:border-tertiary-fixed-dim/30">
                <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-tertiary">Agenda Pro</h3>
                <p className="text-on-surface-variant leading-relaxed">Planning intelligent et gestion d'équipes. Ne manquez plus aucun rendez-vous chantier.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Deep Dive */}
        <section className="py-24 space-y-32">
          {/* Feature 1 */}
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-surface-container-high rounded-2xl p-4 lg:-ml-12 shadow-inner">
              <img
                className="rounded-xl shadow-2xl w-full"
                alt="Gestion Simplifiée"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4WpURYRd53hpo17HoHHLohi_WhDNDzNnxEdkwkoPD3qWl92A0HOW13m5iAHOHoYT-2NMu73tHhj8uUkRNSI4rNZjf8dmiZA4nw1EONPNgBqECtC2QH2ne4DBimZEr6jxUoh15hdPsBXCtiR1yfkP0DsXqQogsIOZ8Z7V_gJ-ZkDizPqanX5h6eBfvekItMI7KXrSZ_qbRSw03Lf1DINpdYMxlYUdRzes1brMLn0h6f5CRJ6rWn32epmtF6a-SJz7Dk3B8ZRPuzt-0"
              />
            </div>
            <div>
              <label className="text-xs font-black tracking-widest text-on-tertiary-fixed-variant uppercase">Gestion Simplifiée</label>
              <h2 className="text-4xl font-bold tracking-tight text-primary mt-4 mb-6 leading-snug">Ne perdez plus jamais un contact client</h2>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8">
                Centralisez l'historique complet de chaque chantier. Accédez aux coordonnées, aux anciens devis et aux notes spécifiques en un clin d'œil, même hors connexion.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-medium text-primary">
                  <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
                  Répertoire client intelligent
                </li>
                <li className="flex items-center gap-3 font-medium text-primary">
                  <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
                  Historique des interventions
                </li>
                <li className="flex items-center gap-3 font-medium text-primary">
                  <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
                  Notes de chantier photos incluses
                </li>
              </ul>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <label className="text-xs font-black tracking-widest text-on-tertiary-fixed-variant uppercase">Trésorerie Maîtrisée</label>
              <h2 className="text-4xl font-bold tracking-tight text-primary mt-4 mb-6 leading-snug">De la signature au paiement en un clic</h2>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8">
                Transformez vos devis acceptés en factures professionnelles instantanément. Automatisez vos rappels de paiement et offrez à vos clients la possibilité de payer par carte.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-medium text-primary">
                  <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
                  Conversion devis en facture auto
                </li>
                <li className="flex items-center gap-3 font-medium text-primary">
                  <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
                  Relances automatiques par SMS/Email
                </li>
                <li className="flex items-center gap-3 font-medium text-primary">
                  <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
                  Suivi des encaissements en temps réel
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 bg-surface-container-high rounded-2xl p-4 lg:-mr-12 shadow-inner">
              <img
                className="rounded-xl shadow-2xl w-full"
                alt="Trésorerie Maîtrisée"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjh3iRthvIIgBt23Y9FNq7phVrHiGDPybZbgTOVXltDrKS4ehXonnqbGvZ1PXDViMi6lN3TsLY6Lv79WhJR_95qZ5qT8J-qkqDbw1OZjUDX5_SJxy7WP3qmGHdaLnTGKyGDeQX_FIJemwjyoC8E8tJ_ROF0RhX3BxWNtNnO9-hOF-Aw1Wpuz56FALGdEnJKaHtB_PNuV0r9xTr21yEZXumhi9imgA1ndYxGfoZbdlInKlUz9EooNgz0OsNmLX8n2uSM0QpmRz_SLwJ"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-primary text-on-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold tracking-tighter mb-4">Une tarification transparente</h2>
              <p className="text-on-primary-container text-lg">Choisissez le plan adapté à la taille de votre entreprise.</p>
              
              {/* Toggle Mensuel / Annuel */}
              <div className="mt-10 flex items-center justify-center gap-6">
                <span className={`text-sm font-bold uppercase tracking-widest ${!isYearly ? 'text-white' : 'text-white/40'}`}>Mensuel</span>
                <button 
                  onClick={() => setIsYearly(!isYearly)}
                  className="w-16 h-8 bg-white/10 border border-white/20 rounded-full relative flex items-center transition-all px-1"
                >
                  <div className={`w-6 h-6 bg-tertiary-fixed-dim rounded-full shadow-lg transition-all transform ${isYearly ? 'translate-x-8' : 'translate-x-0'}`} />
                </button>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold uppercase tracking-widest ${isYearly ? 'text-white' : 'text-white/40'}`}>Annuel</span>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce-subtle">
                    -24% 🔥
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Pricing Card 1 */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-10 border border-white/10 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Gratuit</h3>
                  <p className="text-on-primary-container/80 text-sm">Pour démarrer sereinement</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black">0€</span>
                    <span className="ml-2 text-on-primary-container/60">/mois</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim">check</span> 3 devis & 3 factures maximum
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim">check</span> Gestion de 3 clients maximum
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim">check</span> Signature électronique incluse
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim">check</span> Paiements en ligne
                  </li>
                  <li className="flex items-center gap-3 text-sm opacity-40">
                    <span className="material-symbols-outlined text-white/40">close</span> Envoi d'email intégré
                  </li>
                </ul>
                <button 
                  onClick={handleFreeAction}
                  className="w-full py-4 border border-white/30 rounded-md font-bold hover:bg-white/10 transition-all"
                >
                  {user ? 'Aller au Dashboard' : "S'inscrire"}
                </button>
              </div>
              {/* Pricing Card 2 (Featured) */}
              <div className="bg-surface-container-lowest text-on-surface rounded-xl p-10 shadow-2xl ring-4 ring-tertiary-fixed-dim flex flex-col h-full transform scale-105 z-20 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-tertiary-fixed-dim text-on-tertiary-fixed px-4 py-1 text-xs font-black rounded-full uppercase tracking-widest">Le plus populaire</div>
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2 text-primary">Pro</h3>
                  <p className="text-on-surface-variant text-sm">Pour les artisans actifs</p>
                  <div className="mt-6 flex flex-col items-start gap-2 h-[120px] justify-center">
                    {!isYearly ? (
                      <div className="flex items-baseline text-primary">
                        <span className="text-5xl font-black">22€</span>
                        <span className="ml-2 text-on-surface-variant font-bold">/mois</span>
                      </div>
                    ) : (
                      <div className="bg-amber-100 text-amber-900 px-4 py-4 rounded-xl border-2 border-amber-500/20 shadow-sm animate-pulse-slow w-full">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Paiement Annuel</p>
                        <p className="text-3xl font-black tracking-tighter">199.99€/an</p>
                        <p className="text-[10px] font-bold text-amber-600 bg-white/50 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-tighter">ÉCONOMISEZ 24% 🔥</p>
                      </div>
                    )}
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Devis & factures illimités
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Clients illimités
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Paiement Stripe intégré
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Signature électronique
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Envoi d'email avec SMTP
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-tertiary">
                    <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span> Agenda Interactif & Planning
                  </li>
                </ul>
                <button 
                  onClick={() => handleProAction()}
                  disabled={loading}
                  className="w-full py-4 bg-tertiary-fixed-dim text-on-tertiary-fixed rounded-md font-black shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-on-tertiary-fixed border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Essayer Pro</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 text-center bg-surface relative">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-6">Rejoignez plus de 500 artisans qui ont choisi la simplicité.</h2>
            <p className="text-lg text-on-surface-variant mb-12">Libérez-vous de la paperasse administrative et concentrez-vous sur ce que vous faites de mieux : votre métier.</p>
            <div className="inline-flex flex-col items-center gap-6">
              <button 
                onClick={handleFreeAction}
                className="bg-primary text-on-primary px-12 py-5 text-xl font-bold rounded-md shadow-2xl hover:bg-primary-container transition-all scale-100 hover:scale-105 active:scale-95"
              >
                Commencer mon essai gratuit
              </button>
              <p className="text-sm font-medium text-on-surface-variant/70 flex items-center gap-2">
                <span className="material-symbols-outlined text-on-tertiary-container">verified_user</span>
                Aucune carte bancaire requise
              </p>
            </div>
          </div>
          {/* Decorative artisan illustration */}
          <div className="mt-16 max-w-5xl mx-auto px-6">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                className="w-full h-[400px] object-cover"
                alt="Professional artisan at work"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1E-VpTUWPjs0D5smTQ5OXcg5FcqeE4_Si7nU1QaY0eBaJyC1SX2xNjBB_46nkj4KEnAnTzATOE-nh3xkrO9J4N5DcufEM7gidWlHiKo5juHcWKMcW5nSxufEttbNm9-XvYsCSoWwMnnHFRgJUqN4uy8Um0fzFZvomTj2Um7Hd0CqMSW-uTCnYYEX_TXRugvcp5hBxTnDy-CBllxTpDyHW-VOTUH5fkczosvxqbWjyVftA7jcHkV4x-wwvscZNMQR-xbw1E93rOIu6"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
              <div className="absolute bottom-8 left-8 text-white text-left max-w-sm">
                <p className="italic text-lg mb-2">"ArtisanFlow a changé ma façon de travailler. Je fais mes devis le soir en 10 minutes au lieu de 2 heures."</p>
                <p className="font-bold">— Jean-Marc, Électricien à Lyon</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 dark:bg-slate-950 w-full py-16 px-6 border-t font-headline">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-sm tracking-wide text-blue-900 dark:text-blue-400">
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-black text-blue-900 dark:text-blue-100 mb-6">ArtisanFlow</div>
            <p className="text-slate-500 mb-6">La solution de gestion conçue pour le bâtiment.</p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-blue-900">social_leaderboard</span>
              <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-blue-900">share</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-6 uppercase tracking-widest text-xs">Produit</h4>
            <ul className="space-y-4">
              <li><Link className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-100 hover:translate-x-1 transition-transform inline-block no-underline" href="#">Features</Link></li>
              <li><Link className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-100 hover:translate-x-1 transition-transform inline-block no-underline" href="#">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-widest text-xs">Entreprise</h4>
            <ul className="space-y-4">
              <li><Link className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-100 hover:translate-x-1 transition-transform inline-block no-underline" href="#">About Us</Link></li>
              <li><Link className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-100 hover:translate-x-1 transition-transform inline-block no-underline" href="#">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-widest text-xs">Légal</h4>
            <ul className="space-y-4">
              <li><Link className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-100 hover:translate-x-1 transition-transform inline-block no-underline" href="#">Privacy Policy</Link></li>
              <li><Link className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-100 hover:translate-x-1 transition-transform inline-block no-underline" href="#">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
          © 2026 ArtisanFlow SARL.
        </div>
      </footer>
    </div>
  );
}
