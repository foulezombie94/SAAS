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
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm border-b-0">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold tracking-tighter text-blue-900 dark:text-blue-100 italic">
          ArtisanFlow
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link 
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-blue-900 transition-all duration-200" 
            href="#features"
          >
            Fonctions
          </Link>
          <Link 
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-blue-900 transition-all duration-200" 
            href="#pricing"
          >
            Tarifs
          </Link>
          
          {user ? (
            <Link href="/dashboard">
              <Button className="bg-primary text-on-primary px-6 py-2 rounded-md font-bold transition-all duration-200 hover:opacity-90 active:scale-95">
                Tableau de Bord
              </Button>
            </Link>
          ) : (
            <>
              <Link 
                className="text-slate-600 dark:text-slate-400 font-medium hover:text-blue-900 transition-all duration-200" 
                href="/login"
              >
                Connexion
              </Link>
              <Link href="/login?signup=true">
                <Button className="bg-primary text-on-primary px-6 py-2 rounded-md font-bold transition-all duration-200 hover:opacity-90 active:scale-95">
                  Démarrer Gratuitement
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-blue-900/5 via-blue-900/10 to-transparent"></div>
    </nav>
  );
};
