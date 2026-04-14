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
    <div className="relative h-full w-full group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative h-[calc(100%-40px)] flex items-end justify-between gap-1 md:gap-2 px-1">
        {/* Y-Axis Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
          {[0, 1, 2, 3].map((_, i) => (
            <div key={i} className="w-full border-t border-dashed border-slate-100" />
          ))}
        </div>

        {(data || []).map((item, idx) => {
          const revenue = Number(item.revenue) || 0
          const height = (revenue / maxRevenue) * 100
          const isSignificant = revenue > 0

          return (
            <div
              key={idx}
              className="relative flex-1 h-full flex flex-col justify-end group"
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
                    ? "bg-gradient-to-t from-primary to-primary/80 shadow-lg shadow-primary/10" 
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
        <div className="flex justify-between mt-4 px-1">
          {data.map((item, idx) => (
            <span key={idx} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
