"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/Button";
import { createClient } from "@/utils/supabase/client";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5">
        <div className="text-2xl font-black tracking-tighter text-[#002878] italic group cursor-pointer transition-all">
          ARTISAN<span className="text-[#ef9900] group-hover:text-[#002878] transition-colors">FLOW</span>
        </div>
        <div className="hidden md:flex gap-10 items-center">
          {["Fonctions", "Tarifs", "Méthode"].map((item) => (
            <Link 
              key={item}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#002878] transition-all duration-200" 
              href={`#${item.toLowerCase().replace('é', 'e')}`}
            >
              {item}
            </Link>
          ))}
          
          {user ? (
            <Link href="/dashboard">
              <button className="bg-[#002878] text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-[#002878]/10 hover:shadow-xl hover:scale-105 transition-all active:scale-95">
                Dashboard
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-8">
              <Link 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#002878] hover:opacity-70 transition-all" 
                href="/login"
              >
                Connexion
              </Link>
              <Link href="/login?signup=true">
                <button className="bg-[#002878] text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-[#002878]/10 hover:shadow-xl hover:scale-105 transition-all active:scale-95">
                  Démarrer
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
