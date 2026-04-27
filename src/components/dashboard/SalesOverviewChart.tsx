'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react'

interface DataPoint {
  label: string
  value: string
  bars: {
    color: string
    height: string
  }[]
}

const data: DataPoint[] = [
  {
    label: 'Oct',
    value: '$2,988.20',
    bars: [
      { color: 'bg-brand-teal', height: '16%' },
      { color: 'bg-brand-blue', height: '32%' },
      { color: 'bg-brand-lightpurple', height: '40%' },
      { color: 'bg-brand-purple', height: '48%' },
    ]
  },
  {
    label: 'Nov',
    value: '$1,765.09',
    bars: [
      { color: 'bg-brand-teal', height: '12%' },
      { color: 'bg-brand-blue', height: '20%' },
      { color: 'bg-brand-lightpurple', height: '24%' },
      { color: 'bg-brand-purple', height: '32%' },
    ]
  },
  {
    label: 'Dec',
    value: '$4,005.65',
    bars: [
      { color: 'bg-brand-teal', height: '24%' },
      { color: 'bg-brand-blue', height: '48%' },
      { color: 'bg-brand-lightpurple', height: '56%' },
      { color: 'bg-brand-purple', height: '64%' },
    ]
  }
]

export function SalesOverviewChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:col-span-2 relative overflow-hidden">
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-medium text-slate-500 mb-2">
            <BarChart3 size={20} />
            Sales Overview
          </div>
          <h2 className="text-3xl font-bold text-slate-800">$ 9,257.51</h2>
          <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
            <span className="text-brand-teal font-medium flex items-center">
              15.8% 
              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </span>
            + $143.50 increased
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-1.5 border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
            <ArrowUpDown size={16} /> Sort
          </button>
          <button className="border border-slate-200 rounded px-2 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="h-[200px] w-full flex items-end justify-between px-6 pb-6 relative z-10 mt-4">
        {/* Background Decorative Polygons */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ zIndex: -1, pointerEvents: 'none' }}>
          <polygon points="15%,45% 50%,65% 50%,80% 15%,75%" fill="#887CFD" opacity="0.05" />
          <polygon points="15%,20% 50%,45% 50%,60% 15%,40%" fill="#16C8C7" opacity="0.05" />
          <polygon points="50%,65% 85%,25% 85%,45% 50%,80%" fill="#887CFD" opacity="0.05" />
          <polygon points="50%,45% 85%,10% 85%,20% 50%,60%" fill="#16C8C7" opacity="0.05" />
        </svg>

        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1 items-center w-1/4">
            <span className="text-sm font-bold text-slate-600 mb-1.5">{item.value}</span>
            <div className="flex flex-col-reverse gap-1 w-16">
              {item.bars.map((bar, bIdx) => (
                <motion.div 
                  key={bIdx}
                  initial={{ height: 0 }}
                  animate={{ height: bar.height }}
                  transition={{ duration: 0.8, delay: idx * 0.1 + bIdx * 0.05 }}
                  className={`${bar.color} rounded-sm w-full`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-400 mt-3">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-6 mt-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-brand-purple rounded-sm"></span> China</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-brand-lightpurple rounded-sm"></span> UE</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-brand-blue rounded-sm"></span> USA</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></span> Canada</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-brand-teal rounded-sm"></span> Other</div>
      </div>
    </div>
  )
}
