'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Package } from 'lucide-react'

export function SalesDistributionChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-[15px] font-medium text-slate-500">
          <Package size={20} className="text-slate-400" />
          Sales Distribution
        </div>
        <select className="bg-transparent border border-slate-200 rounded px-2.5 py-1 text-sm font-medium text-slate-500 outline-none cursor-pointer">
          <option>Monthly</option>
        </select>
      </div>
      
      <div className="flex justify-between mt-6">
        <div className="group">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 border-l-[3px] border-brand-purple pl-2 transition-all group-hover:border-brand-purple/60">Website</p>
          <p className="text-[15px] font-bold text-slate-800 mt-1.5">$ 374.82</p>
        </div>
        <div className="group">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 border-l-[3px] border-brand-teal pl-2 transition-all group-hover:border-brand-teal/60">Mobile App</p>
          <p className="text-[15px] font-bold text-slate-800 mt-1.5">$ 241.60</p>
        </div>
        <div className="group">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 border-l-[3px] border-slate-200 pl-2 transition-all group-hover:border-slate-300">Other</p>
          <p className="text-[15px] font-bold text-slate-800 mt-1.5">$ 213.42</p>
        </div>
      </div>

      <div className="mt-10 flex justify-center items-end h-[130px] relative">
        <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-sm">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#F3F4F6" strokeWidth="12" strokeLinecap="round" />
          
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 0.4 }}
            transition={{ duration: 1, ease: "easeOut" }}
            d="M 50 10 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke="#16C8C7" 
            strokeWidth="12" 
            strokeLinecap="round" 
          />
          
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 0.6 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            d="M 10 50 A 40 40 0 0 1 50 10" 
            fill="none" 
            stroke="#5347CE" 
            strokeWidth="12" 
            strokeLinecap="round" 
          />
        </svg>
        <div className="absolute bottom-0 text-center">
          <p className="text-2xl font-bold text-slate-800">75%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Progress</p>
        </div>
      </div>
    </div>
  )
}
