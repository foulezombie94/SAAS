'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Loader2 } from 'lucide-react'
import { useI18n } from '@/components/providers/LanguageProvider'
import { cn } from '@/lib/utils'

interface ActivityData {
  label: string
  revenue: number
  full_date: string
}

export function ActivityChart({ initialData }: { initialData: ActivityData[] }) {
  const { t } = useI18n()
  const [data, setData] = useState<ActivityData[]>(initialData || [])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxRevenue = Math.max(...(data || []).map(d => d.revenue), 1000)

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
      {/* Premium Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
             <h4 className="text-xl font-black text-primary tracking-tighter uppercase">{t('dashboard.activity_title')}</h4>
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">7 {t('dashboard.range_30').split(' ').slice(1).join(' ')}</p>
        </div>
      </div>

      <div className="relative h-64 flex items-end justify-between gap-1 md:gap-2 px-1">
        {/* Y-Axis Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
          {[0, 1, 2, 3].map((_, i) => (
            <div key={i} className="w-full border-t border-dashed border-slate-100" />
          ))}
        </div>

        {(data || []).map((item, idx) => {
          const height = (item.revenue / maxRevenue) * 100
          const isSignificant = item.revenue > 0

          return (
            <div
              key={idx}
              className="relative flex-1 group"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${Math.max(height, 4)}%`, opacity: 1 }}
                transition={{ 
                  type: 'spring', 
                  damping: 20, 
                  stiffness: 100, 
                  delay: (idx * 0.02) % 0.5 
                }}
                className={cn(
                  "w-full rounded-t-xl transition-all duration-500 relative overflow-hidden",
                  isSignificant 
                    ? "bg-gradient-to-t from-primary to-primary/80 shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.1)]" 
                    : "bg-slate-100",
                  hoveredIndex === idx && "filter brightness-110 scale-x-[1.05] z-10 shadow-xl"
                )}
              >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10" />
              </motion.div>

              {/* Tooltip */}
              {hoveredIndex === idx && item.revenue > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute -top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                >
                  <div className="bg-primary text-white p-3 rounded-2xl shadow-2xl shadow-primary/40 border border-white/10 whitespace-nowrap min-w-[100px]">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{item.label}</p>
                     <p className="text-base font-black tracking-tighter">{item.revenue.toLocaleString('fr-FR')}€</p>
                     <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
                  </div>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* X-Axis Labels */}
      {data.length > 0 && (
        <div className="flex justify-between mt-6 px-1">
          {data.map((item, idx) => (
            <span key={idx} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
              {item.label}
            </span>
          ))}
        </div>
      )}

      {/* Chart Footer Info */}
      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" />
            ))}
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">+ {data.filter(d => d.revenue > 0).length} périodes actives</p>
        </div>
        <div className="flex items-center gap-1.5 text-green-500 bg-green-50 px-3 py-1 rounded-full">
           <TrendingUp size={12} />
           <span className="text-[10px] font-black uppercase tracking-widest">Growth focus</span>
        </div>
      </div>
    </div>
  )
}
