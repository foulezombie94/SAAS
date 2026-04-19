'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { 
  Zap, 
  MousePointer2, 
  Wallet, 
  ShieldCheck, 
  CalendarDays, 
  Award, 
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  CreditCard,
  FileText,
  Users,
  BarChart3,
  Bell,
  Settings,
  Lock,
  Smartphone,
  Globe,
  Clock,
  ChevronRight,
  Star,
  Plus,
  Trash2,
  Download,
  Share2,
  XCircle,
  ShieldAlert
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Experience3D } from "@/components/landing/Experience3D";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * ScrollyScene - The MainLabs-style Pinning Container
 * Pins content while scrubbing through a defined scroll distance.
 */
function ScrollyScene({ 
  children, 
  height = "120vh", 
  isFirst = false 
}: { 
  children: React.ReactNode, 
  height?: string,
  isFirst?: boolean
}) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // INITIAL STATE FIX: If it's the first section, it starts at 100% opacity/focus
  // Otherwise, it arrives from 0.
  const arrivalOpacityStart = isFirst ? 1 : 0;
  const arrivalScaleStart = isFirst ? 1 : 0.8;
  const arrivalBlurStart = isFirst ? 0 : 30;
  const arrivalYStart = isFirst ? 0 : 100;

  // NEW CONTINUOUS MOTION LOGIC: Something always moves
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [arrivalOpacityStart, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [arrivalScaleStart, 1.0, 1.1, 2.8]);
  const blur = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [arrivalBlurStart, 0, 0, 50]);
  const y = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [arrivalYStart, 0, -40, -120]);

  return (
    <section ref={containerRef} style={{ height }} className="relative w-full">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div
          style={{
            opacity,
            scale,
            filter: useTransform(blur, (v) => `blur(${v}px)`),
            y,
            // GPU Acceleration for blur
            willChange: "transform, opacity, filter",
            transform: "translateZ(0)"
          }}
          className="w-full flex flex-col items-center justify-center px-6"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

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
    <SmoothScroll>
      <div className="bg-white text-on-surface selection:bg-[#002878] selection:text-white selection:bg-opacity-20 transition-colors duration-1000">
        <Experience3D />
        <Navbar />

        <main className="relative z-10 origin-center">
          {/* SCENE 1: HERO - Now with isFirst=true for immediate visibility */}
          <ScrollyScene height="200vh" isFirst={true}>
            <div className="flex flex-col items-center text-center max-w-7xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-[#002878]/5 text-[#002878] text-[10px] font-black tracking-[0.4em] uppercase mb-12 rounded-full border border-[#002878]/10">
                LA SOLUTION FRANÇAISE
              </span>
              
              <h1 className="text-6xl md:text-[120px] font-black tracking-[-0.05em] text-[#002878] leading-[0.8] mb-16 uppercase italic drop-shadow-[0_20px_40px_rgba(0,40,120,0.1)]">
                DEVIS, FACTURES <br className="hidden md:block" />
                <span className="text-[#ef9900] text-glow">& PAIEMENTS</span>
              </h1>
              
              <p className="text-sm md:text-lg text-slate-500 leading-relaxed mb-20 max-w-4xl font-bold uppercase tracking-[0.2em] opacity-80">
                De la création client au suivi de votre agenda, gérez votre administratif sans prise de tête. <br className="hidden md:block" /> 
                Le logiciel 100% français qui centralise votre activité et accélère vos encaissements.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-xl mx-auto">
                <button onClick={handleFreeAction} className="bg-[#cbd5e1] text-[#0f172a] px-12 py-5 text-[10px] font-black rounded-lg shadow-2xl uppercase tracking-[0.3em] flex-1 border border-transparent hover:scale-105 transition-transform">
                  S'INSCRIRE GRATUITEMENT
                </button>
                <button className="border-2 border-[#002878]/20 text-[#002878] px-12 py-5 text-[10px] font-black rounded-lg uppercase tracking-[0.3em] flex-1 backdrop-blur-sm hover:bg-[#002878]/5 transition-all">
                  APPRENDRE ENCORE PLUS
                </button>
              </div>
            </div>
          </ScrollyScene>

          {/* SCENE 2: FEATURES GRID */}
          <ScrollyScene height="200vh">
            <div className="max-w-7xl mx-auto w-full">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#002878] mb-6 uppercase italic">L'EXCELLENCE <span className="text-[#ef9900]">OPÉRATIONNELLE</span></h2>
                <div className="h-2 w-24 bg-[#ef9900] mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { icon: <Zap size={28} />, title: "Vitesse Absolute", text: "Devis pro en 120 secondes chrono.", color: "#002878" },
                  { icon: <MousePointer2 size={28} />, title: "Interface Intuitive", text: "Zéro formation requise.", color: "#ef9900" },
                  { icon: <Wallet size={28} />, title: "Paiements Flash", text: "Encaissez vos acomptes instantanément.", color: "#002878" },
                  { icon: <ShieldCheck size={28} />, title: "Valeur Juridique", text: "Signature électronique certifiée.", color: "#ef9900" },
                  { icon: <CalendarDays size={28} />, title: "Agenda Sync", text: "Planning d'équipe en temps réel.", color: "#002878" },
                  { icon: <Award size={28} />, title: "Image Premium", text: "Design irréprochable.", color: "#ef9900" }
                ].map((feature, i) => (
                  <div key={i} className="bg-white/40 p-10 rounded-[2.5rem] shadow-diffused border border-white/50 backdrop-blur-sm group hover:bg-white transition-all">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${feature.color}10`, color: feature.color }}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-black mb-2 text-[#002878] uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-tight opacity-70">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollyScene>

          {/* SCENE 3: DASHBOARD PREVIEW */}
          <ScrollyScene height="200vh">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center w-full">
              <div className="order-2 lg:order-1">
                <span className="text-[10px] font-black tracking-[0.4em] text-[#ef9900] uppercase mb-6 block">PILOTAGE CENTRALISÉ</span>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#002878] mb-8 leading-[0.85] uppercase italic">VOTRE CHANTIER <br/> <span className="text-slate-300">DANS LA POCHE.</span></h2>
                <p className="text-lg text-slate-500 font-bold leading-relaxed mb-10 uppercase tracking-tight opacity-80">
                  Tout votre historique client, vos notes et vos photos sont synchronisés en temps réel.
                </p>
                <div className="space-y-4">
                  {["CRM Intelligent", "Historique Illimité", "Notes Photos"].map((li, i) => (
                    <div key={i} className="flex items-center gap-4 font-black text-[#002878] text-[10px] uppercase tracking-widest bg-[#002878]/5 p-4 rounded-xl border border-[#002878]/10">
                      <CheckCircle2 size={16} className="text-[#ef9900]" />
                      {li}
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2 bg-[#002878]/10 p-4 rounded-[4rem] shadow-2xl backdrop-blur-md">
                <img className="rounded-[3rem] shadow-inner" alt="Preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4WpURYRd53hpo17HoHHLohi_WhDNDzNnxEdkwkoPD3qWl92A0HOW13m5iAHOHoYT-2NMu73tHhj8uUkRNSI4rNZjf8dmiZA4nw1EONPNgBqECtC2QH2ne4DBimZEr6jxUoh15hdPsBXCtiR1yfkP0DsXqQogsIOZ8Z7V_gJ-ZkDizPqanX5h6eBfvekItMI7KXrSZ_qbRSw03Lf1DINpdYMxlYUdRzes1brMLn0h6f5CRJ6rWn32epmtF6a-SJz7Dk3B8ZRPuzt-0" />
              </div>
            </div>
          </ScrollyScene>

          {/* SCENE 4: PRICING */}
          <ScrollyScene height="200vh">
            <div className="max-w-7xl mx-auto w-full">
              <div className="text-center mb-16">
                <h2 className="text-5xl font-black tracking-tighter text-[#002878] mb-8 uppercase italic underline decoration-[#ef9900] underline-offset-8">TARIFICATION <span className="text-[#ef9900]">FIXE.</span></h2>
                
                {/* PRICING TOGGLE */}
                <div className="flex items-center justify-center gap-6 mt-12">
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!isYearly ? 'text-[#002878]' : 'text-slate-400'}`}>Mensuel</span>
                  <button 
                    onClick={() => setIsYearly(!isYearly)}
                    className="relative w-16 h-8 bg-[#002878]/5 rounded-full p-1 border border-[#002878]/10"
                  >
                    <motion.div 
                      animate={{ x: isYearly ? 32 : 0 }}
                      className="w-6 h-6 bg-[#ef9900] rounded-full shadow-lg"
                    />
                  </button>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isYearly ? 'text-[#002878]' : 'text-slate-400'}`}>Annuel</span>
                    <span className="bg-[#ef9900] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">-20%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] p-12 shadow-diffused border border-slate-100 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-sm font-black text-slate-400 mb-2 uppercase tracking-widest">STARTER</h3>
                    <div className="text-5xl font-black text-[#002878] mb-8">0€</div>
                    <ul className="space-y-3 mb-12 list-none p-0">
                      {["10 Devis / mois", "Factures Illimitées", "Support Email"].map((f, i) => (
                        <li key={i} className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                           <CheckCircle2 size={12} className="text-[#002878]" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={handleFreeAction} className="w-full border-2 border-[#002878]/10 text-[#002878] py-5 rounded-2xl font-black uppercase text-[10px]">C'est parti</button>
                </div>

                <div className="bg-white rounded-[3rem] p-12 shadow-2xl border-2 border-[#002878] ring-8 ring-[#002878]/5 relative overflow-hidden flex flex-col justify-between h-full">
                  <div className="absolute top-0 right-0 bg-[#002878] text-white text-[8px] font-black px-6 py-2 rotate-45 translate-x-3 translate-y-1">POPULAIRE</div>
                  <div>
                    <h3 className="text-sm font-black text-[#002878] mb-2 uppercase tracking-widest">ARTISAN PRO</h3>
                    <div className="text-5xl font-black text-[#002878] mb-8">
                      {isYearly ? "18€" : "22€"} 
                      <span className="text-sm font-bold text-slate-400 italic"> /mois</span>
                    </div>
                    <ul className="space-y-3 mb-12 list-none p-0">
                      {["Devis Illimités", "Acomptes CB", "Agenda Partagé", "Exports Comptables"].map((f, i) => (
                        <li key={i} className="text-[10px] font-bold text-[#002878] uppercase tracking-tight flex items-center gap-2">
                           <CheckCircle2 size={12} className="text-[#ef9900]" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={handleProAction} className="w-full bg-[#ef9900] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-[0_10px_30px_rgba(239,153,0,0.3)] hover:scale-105 transition-transform">S'abonner maintenant</button>
                </div>
              </div>
            </div>
          </ScrollyScene>

          {/* SCENE 5: CTA FINAL */}
          <ScrollyScene height="150vh">
            <div className="text-center">
              <h2 className="text-6xl md:text-[140px] font-black tracking-tighter text-[#002878] mb-12 leading-[0.75] uppercase italic">REJOIGNEZ <br/> <span className="text-[#ef9900]">L'ÉLITE.</span></h2>
              <button onClick={handleFreeAction} className="bg-[#002878] text-white px-20 py-10 text-lg font-black rounded-full shadow-3xl uppercase tracking-[0.4em] hover:scale-105 transition-transform active:scale-95">COMMENCER</button>
            </div>
          </ScrollyScene>
        </main>

        <footer className="relative z-20 bg-white py-24 px-6 border-t border-slate-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="text-3xl font-black text-[#002878] uppercase tracking-tighter italic">Artisan<span className="text-[#ef9900]">Flow</span></div>
            <div>
              <h4 className="font-black text-[#002878] mb-8 uppercase tracking-[0.3em] text-[10px] opacity-40">Produit</h4>
              <ul className="space-y-4 font-bold uppercase tracking-widest text-[10px] text-slate-400 list-none p-0">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[#002878] mb-8 uppercase tracking-[0.3em] text-[10px] opacity-40">Contact</h4>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest m-0">hello@artisanflow.com</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-100 text-center text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">
            © 2026 ArtisanFlow. DESIGN FOR BUILDERS.
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
