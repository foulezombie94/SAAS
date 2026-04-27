'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Eye, Banknote, LineChart, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  eye: Eye,
  banknote: Banknote,
  lineChart: LineChart
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  iconName: keyof typeof ICONS
  changeType?: 'positive' | 'negative'
}

export function StatCard({ title, value, change, iconName, changeType = 'positive' }: StatCardProps) {
  const Icon = ICONS[iconName]
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col group hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-[15px] font-medium text-slate-500">
          <Icon size={20} className="text-slate-400 group-hover:text-brand-purple transition-colors" />
          {title}
        </div>
        <Info size={20} className="text-slate-200 cursor-help hover:text-slate-400 transition-colors" />
      </div>
      <div className="flex items-baseline gap-3">
        <h2 className="text-4xl font-bold text-slate-800 tracking-tight">{value}</h2>
        {change !== undefined && (
          <span className={cn(
            "flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded",
            changeType === 'positive' 
              ? "text-brand-teal bg-brand-teal/10" 
              : "text-red-400 bg-red-50"
          )}>
            {Math.abs(change)}% 
            <svg 
              className={cn("w-3.5 h-3.5", changeType === 'negative' && "rotate-180")} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </span>
        )}
      </div>
    </motion.div>
  )
}
