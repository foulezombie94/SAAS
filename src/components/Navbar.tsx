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
    <nav className="fixed top-0 w-full z-[60] bg-black/5 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-6">
        <div className="text-xl font-black tracking-[-0.05em] text-white italic group cursor-pointer transition-all flex items-center gap-2">
          ARTISAN<span className="text-[#ef9900]">FLOW</span>
        </div>
        <div className="hidden md:flex gap-12 items-center">
          {["Fonctions", "Tarifs", "Contact"].map((item) => (
            <Link 
              key={item}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all duration-200" 
              href={`#${item.toLowerCase().replace('é', 'e')}`}
            >
              {item}
            </Link>
          ))}
          
          {user ? (
            <Link href="/dashboard">
              <button className="bg-white text-black px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-lg shadow-2xl hover:scale-105 transition-all active:scale-95">
                Dashboard
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-10">
              <Link 
                className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:opacity-70 transition-all" 
                href="/login"
              >
                Accès
              </Link>
              <Link href="/login?signup=true">
                <button className="bg-white text-black px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-lg hover:scale-105 transition-all active:scale-95">
                  Start
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
