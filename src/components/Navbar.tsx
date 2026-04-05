"use client";

import React from "react";
import Link from "next/link";
import { Button } from "./ui/Button";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm border-b-0">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold tracking-tighter text-blue-900 dark:text-blue-100">
          ArtisanFlow
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link 
            className="text-blue-900 dark:text-blue-100 border-b-2 border-orange-500 pb-1 font-headline tracking-tight" 
            href="#features"
          >
            Features
          </Link>
          <Link 
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-blue-900 dark:hover:text-blue-100 transition-all duration-200 hover:opacity-80" 
            href="#pricing"
          >
            Pricing
          </Link>
          <Link 
            className="text-slate-600 dark:text-slate-400 font-medium hover:text-blue-900 dark:hover:text-blue-100 transition-all duration-200 hover:opacity-80" 
            href="/login"
          >
            Login
          </Link>
          <Button className="bg-primary text-on-primary px-6 py-2 rounded-md font-bold transition-all duration-200 hover:opacity-90 active:scale-95">
            Start Free
          </Button>
        </div>
        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <span className="material-symbols-outlined text-primary">menu</span>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-blue-900/5 via-blue-900/10 to-transparent"></div>
    </nav>
  );
};
