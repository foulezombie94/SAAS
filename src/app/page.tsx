"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Award,
  ChevronRight,
  ShieldAlert,
  Zap,
  MousePointer2,
  Wallet,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Share2
} from "lucide-react";
import { Experience3D } from "@/components/landing/Experience3D";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="bg-white text-on-surface selection:bg-primary selection:text-white transition-colors duration-1000">
      <Experience3D />
      <Navbar />

      <main className="pt-24 overflow-hidden">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-40 max-w-7xl mx-auto min-h-[90vh] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-1.5 bg-[#002878]/5 text-[#002878] text-[10px] font-black tracking-[0.3em] uppercase mb-8 rounded-full border border-[#002878]/10"
              >
                L'OUTIL DES BÂTISSEURS MODERNES
              </motion.span>
              <h1 className="text-6xl md:text-8xl font-black tracking-[ -0.05em] text-[#002878] leading-[0.9] mb-10 uppercase italic">
                LE SUCCÈS <br/>
                <span className="text-[#ef9900] text-glow">COMMENCE</span> <br/>
                ICI.
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed mb-12 max-w-xl font-bold uppercase tracking-tight opacity-80">
                Passez du chantier à la facture en 120 secondes. La puissance du digital au service de votre savoir-faire artisanal.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,40,120,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFreeAction}
                  className="bg-[#002878] text-white px-12 py-6 text-xs font-black rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] relative overflow-hidden group"
                >
                  <span className="relative z-10">Commencer l'aventure</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </motion.button>
                <button className="px-10 py-6 text-xs font-black rounded-2xl border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-[0.2em]">
                  Voir la démo
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="relative mt-20 lg:mt-0"
            >
              {/* Floating Dashboard Preview Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#002878] to-[#ef9900] rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white rounded-[3rem] p-4 shadow-2xl border border-slate-100 overflow-hidden">
                   <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-slate-50 relative">
                     <img
                       className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
                       alt="ArtisanFlow Interface Premium"
                       src="https://lh3.googleusercontent.com/aida-public/AB6AXuDahAP1wYn6P3n8SiLC7Z7uTTBWaBv84g4dSmuGjgpwj-J85Zd_VR3MqUDKRMesMKGSQRtcnxpnxcEJ8_1bMCLRGbWxwlomqyu7N_7JBP5xWILvxMfWiudm3WZuZ_G9GYTpLP1JvfvGzfZRKMh7XExc5D3UgCuNugNlA5z0r8E-voW9izDrp8Fp6TXla5s8Homu3mT7iJlQnWtnT8T51gzbjm_QWQ8ZB1k4gJaJbL5wx5T8CWzHAvAQGLI5WsmpGAd9tlJPFsl7uZf3"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#002878]/20 to-transparent pointer-events-none" />
                   </div>
                </div>
                
                {/* Floating Micro-UI element */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 bottom-12 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-3xl border border-white/50 hidden md:block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernier Paiement</p>
                      <p className="text-xl font-black text-[#002878]">+4,850.00 €</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-24"
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#002878] mb-6 uppercase italic">L'EXCELLENCE <span className="text-[#ef9900]">OPÉRATIONNELLE</span></h2>
              <div className="h-1.5 w-24 bg-[#ef9900] mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                { icon: <Zap size={28} />, title: "Vitesse Absolute", text: "Devis pro en 120 secondes chrono. Répondez plus vite que vos concurrents.", color: "#002878" },
                { icon: <MousePointer2 size={28} />, title: "Interface Intuitive", text: "Zéro formation requise. Une ergonomie pensée pour le terrain et la mobilité.", color: "#ef9900" },
                { icon: <Wallet size={28} />, title: "Paiements Flash", text: "Intégration Stripe pour encaisser vos acomptes instantanément par carte.", color: "#002878" },
                { icon: <ShieldCheck size={28} />, title: "Valeur Juridique", text: "Signature électronique certifiée pour sécuriser tous vos contrats chantiers.", color: "#ef9900" },
                { icon: <CalendarDays size={28} />, title: "Agenda Sync", text: "Géolocalisation des chantiers et planning d'équipe synchronisé en temps réel.", color: "#002878" },
                { icon: <Award size={28} />, title: "Image Premium", text: "Des documents au design irréprochable qui inspirent confiance à vos clients.", color: "#ef9900" }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  className="bg-white p-10 rounded-[2.5rem] shadow-diffused border border-slate-50 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:bg-[#002878]/5" />
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 relative z-10" style={{ backgroundColor: `${feature.color}10`, color: feature.color }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-black mb-4 text-[#002878] uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed uppercase tracking-tight opacity-70">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 space-y-40">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#002878]/5 rounded-[3rem] p-4 shadow-inner relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#002878]/10 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                className="rounded-[2.5rem] shadow-3xl w-full transform group-hover:scale-[1.02] transition-transform duration-700"
                alt="Gestion Simplifiée"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4WpURYRd53hpo17HoHHLohi_WhDNDzNnxEdkwkoPD3qWl92A0HOW13m5iAHOHoYT-2NMu73tHhj8uUkRNSI4rNZjf8dmiZA4nw1EONPNgBqECtC2QH2ne4DBimZEr6jxUoh15hdPsBXCtiR1yfkP0DsXqQogsIOZ8Z7V_gJ-ZkDizPqanX5h6eBfvekItMI7KXrSZ_qbRSw03Lf1DINpdYMxlYUdRzes1brMLn0h6f5CRJ6rWn32epmtF6a-SJz7Dk3B8ZRPuzt-0"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[10px] font-black tracking-[0.4em] text-[#ef9900] uppercase mb-6 block">PILOTAGE CENTRALISÉ</span>
              <h2 className="text-5xl font-black tracking-tighter text-[#002878] mb-8 leading-[0.9] uppercase italic">VOTRE CHANTIER <br/> <span className="text-slate-400">DANS LA POCHE.</span></h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed mb-10 uppercase tracking-tight opacity-80">
                Ne perdez plus jamais une seconde à chercher une information. Tout votre historique client, vos notes et vos photos sont synchronisés en temps réel.
              </p>
              <ul className="space-y-6">
                {[
                  "Répertoire client intelligent & CRM",
                  "Historique illimité des interventions",
                  "Notes photos & documents attachés"
                ].map((li, i) => (
                  <li key={i} className="flex items-center gap-4 font-black text-[#002878] text-xs uppercase tracking-widest">
                    <div className="w-8 h-8 rounded-xl bg-[#002878]/10 flex items-center justify-center text-[#002878]">
                      <CheckCircle2 size={16} />
                    </div>
                    {li}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <span className="text-[10px] font-black tracking-[0.4em] text-[#ef9900] uppercase mb-6 block">FLUX FINANCIER</span>
              <h2 className="text-5xl font-black tracking-tighter text-[#002878] mb-8 leading-[0.9] uppercase italic">ENCAISSEZ <br/> <span className="text-slate-400">INSTANTANÉMENT.</span></h2>
              <p className="text-lg text-slate-500 font-bold leading-relaxed mb-10 uppercase tracking-tight opacity-80">
                Récupérez vos acomptes avant même de commencer les travaux. Notre intégration Stripe sécurisée permet à vos clients de signer et payer en 2 clics.
              </p>
              <ul className="space-y-6">
                {[
                  "Conversion devis en facture un clic",
                  "Relances automatiques intelligentes",
                  "Tableau de bord de trésorerie live"
                ].map((li, i) => (
                  <li key={i} className="flex items-center gap-4 font-black text-[#002878] text-xs uppercase tracking-widest">
                    <div className="w-8 h-8 rounded-xl bg-[#ef9900]/10 flex items-center justify-center text-[#ef9900]">
                      <CheckCircle2 size={16} />
                    </div>
                    {li}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 bg-[#002878]/5 rounded-[3rem] p-4 shadow-inner relative group"
            >
              <img
                className="rounded-[2.5rem] shadow-3xl w-full transform group-hover:scale-[1.02] transition-transform duration-700"
                alt="Trésorerie Maîtrisée"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjh3iRthvIIgBt23Y9FNq7phVrHiGDPybZbgTOVXltDrKS4ehXonnqbGvZ1PXDViMi6lN3TsLY6Lv79WhJR_95qZ5qT8J-qkqDbw1OZjUDX5_SJxy7WP3qmGHdaLnTGKyGDeQX_FIJemwjyoC8E8tJ_ROF0RhX3BxWNtNnO9-hOF-Aw1Wpuz56FALGdEnJKaHtB_PNuV0r9xTr21yEZXumhi9imgA1ndYxGfoZbdlInKlUz9EooNgz0OsNmLX8n2uSM0QpmRz_SLwJ"
              />
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="py-32 bg-[#002878] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 uppercase italic">VOTRE NOUVELLE <span className="text-[#ef9900]">ROUTINE PRO</span></h2>
              <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">3 ÉTAPES VERS LA TRANQUILLITÉ</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { step: "01", title: "Config Express", text: "Ajoutez vos tarifs et votre logo en 60 secondes." },
                { step: "02", title: "Édition Live", text: "Créez vos devis directement sur le chantier avec le client." },
                { step: "03", title: "Signature & Pay", text: "Récoltez la signature et l'acompte sans attendre." }
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative"
                >
                  <span className="text-8xl font-black opacity-10 absolute -top-10 -left-6">{step.step}</span>
                  <h3 className="text-2xl font-black mb-4 relative uppercase italic tracking-tighter transition-all group-hover:text-[#ef9900]">{step.title}</h3>
                  <p className="text-slate-400 font-bold text-sm uppercase leading-relaxed">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#002878] mb-6 uppercase italic">UN PRIX <span className="text-[#ef9900]">SANS SURPRISE</span></h2>
              
              <div className="flex items-center justify-center gap-4 mt-8">
                <span className={`text-sm font-black uppercase tracking-widest ${!isYearly ? 'text-[#002878]' : 'text-slate-400'}`}>Mensuel</span>
                <button 
                  onClick={() => setIsYearly(!isYearly)}
                  className="w-16 h-8 bg-slate-100 rounded-full p-1 relative transition-colors"
                >
                  <motion.div 
                    animate={{ x: isYearly ? 32 : 0 }}
                    className="w-6 h-6 bg-[#002878] rounded-full shadow-lg"
                  />
                </button>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black uppercase tracking-widest ${isYearly ? 'text-[#002878]' : 'text-slate-400'}`}>Annuel</span>
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full"
                  >
                    -20% 🔥
                  </motion.span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* PLAN STARTER */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white/50 backdrop-blur-xl rounded-[3rem] p-12 shadow-diffused border border-slate-100 relative overflow-hidden flex flex-col"
              >
                <div className="mb-8">
                  <h3 className="text-xl font-black text-[#002878] mb-2 uppercase italic tracking-tighter opacity-40">STARTER</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-[#002878]">0€</span>
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Gratuit à vie</span>
                  </div>
                </div>

                <ul className="space-y-6 mb-12 flex-grow">
                  {[
                    "Jusqu'à 3 Clients",
                    "Jusqu'à 3 Devis & Factures",
                    "Signature Manuelle",
                    "Paiement Stripe inclus",
                    "Support Communautaire"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <div className="w-5 h-5 bg-slate-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-slate-300" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={handleFreeAction}
                  className="w-full border-2 border-[#002878]/10 text-[#002878] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#002878]/5 transition-all active:scale-95"
                >
                  Démarrer gratuitement
                </button>
              </motion.div>

              {/* PLAN PRO */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white rounded-[3rem] p-12 shadow-2xl border-2 border-[#002878] relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 bg-[#002878] text-white px-8 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest animate-pulse">Populaire</div>
                
                <div className="mb-8">
                  <h3 className="text-xl font-black text-[#002878] mb-2 uppercase italic tracking-tighter">ARTISAN PRO</h3>
                  <div className="flex flex-col gap-1">
                    {!isYearly ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-[#002878]">22€</span>
                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ mois</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-6xl font-black text-[#002878]">199€</span>
                          <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ an</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mt-1">Soit environ 16€/mois (-24%)</span>
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-6 mb-12 flex-grow">
                  {[
                    "Devis & Factures illimités",
                    "Signature électronique certifiée",
                    "Emailing SMTP Personnalisé",
                    "Agenda Interactif & Planning",
                    "Support Prioritaire 24/7",
                    "Zéro publicité"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] font-black text-[#002878] uppercase tracking-widest">{item}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={handleProAction}
                  className="w-full bg-[#ef9900] text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#ef9900]/20 hover:bg-[#002878] transition-all active:scale-95"
                >
                  Passer au niveau PRO
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-40 text-center relative overflow-hidden bg-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[200%] bg-[radial-gradient(circle_at_center,_#00287805_0%,_transparent_70%)] pointer-events-none" />
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-6 relative z-10"
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#002878] mb-10 leading-[0.9] uppercase italic">REJOIGNEZ <br/> <span className="text-[#ef9900]">L'ÉLITE</span> ARTISANALE.</h2>
            <p className="text-xl text-slate-500 font-bold mb-16 uppercase tracking-widest opacity-60">Plus de 500 professionnels nous font déjà confiance pour bâtir leur succès.</p>
            
            <div className="flex flex-col items-center gap-8">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFreeAction}
                className="bg-[#002878] text-white px-16 py-8 text-sm font-black rounded-3xl shadow-3xl uppercase tracking-[0.3em] glow-primary"
              >
                C'est parti gratuitement
              </motion.button>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <ShieldCheck size={18} className="text-emerald-500" />
                Pas de carte bancaire requise
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-white w-full py-24 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-1">
            <div className="text-3xl font-black text-[#002878] mb-8 uppercase tracking-tighter italic">Artisan<span className="text-[#ef9900]">Flow</span></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">Le bastion digital des bâtisseurs modernes.</p>
          </div>
          <div>
            <h4 className="font-black text-[#002878] mb-8 uppercase tracking-[0.3em] text-[10px] opacity-40">Produit</h4>
            <ul className="space-y-4 font-bold uppercase tracking-widest text-[10px]">
              <li><Link className="text-slate-400 hover:text-[#002878] transition-colors no-underline" href="#features">Features</Link></li>
              <li><Link className="text-slate-400 hover:text-[#002878] transition-colors no-underline" href="#pricing">Tarifs</Link></li>
              <li><Link className="text-slate-400 hover:text-[#002878] transition-colors no-underline" href="#how-it-works">Méthode</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-[#002878] mb-8 uppercase tracking-[0.3em] text-[10px] opacity-40">Solution</h4>
            <ul className="space-y-4 font-bold uppercase tracking-widest text-[10px]">
              <li><Link className="text-slate-400 hover:text-[#002878] transition-colors no-underline" href="#">Devis & Factures</Link></li>
              <li><Link className="text-slate-400 hover:text-[#002878] transition-colors no-underline" href="#">Signatures</Link></li>
              <li><Link className="text-slate-400 hover:text-[#002878] transition-colors no-underline" href="#">Paiements</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-[#002878] mb-8 uppercase tracking-[0.3em] text-[10px] opacity-40">Contact</h4>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <p className="text-[10px] font-black text-[#002878] uppercase mb-2 tracking-widest">Support 24/7</p>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">hello@artisanflow.com</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-50 text-center text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">
          © 2026 ArtisanFlow. DESIGN FOR BUILDERS.
        </div>
      </footer>
    </div>
  );
}
