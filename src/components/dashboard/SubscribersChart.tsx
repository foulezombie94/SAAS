'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, ChevronDown } from 'lucide-react'

const days = [
  { name: 'Sun', height: '25%' },
  { name: 'Mon', height: '35%' },
  { name: 'Tue', height: '85%', highlighted: true, value: '3,874' },
  { name: 'Wed', height: '25%' },
  { name: 'Thu', height: '45%' },
  { name: 'Fri', height: '35%' },
  { name: 'Sat', height: '60%' },
]

export function SubscribersChart() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
          <Users size={16} className="text-slate-400" />
          Total Subscriber
        </div>
        <button className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 outline-none transition-colors">
          Weekly <ChevronDown size={12} />
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-[28px] font-bold text-slate-900 leading-tight">24,473</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded">
            8.3% <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </span>
          <span className="text-[13px] font-medium text-slate-500">+ 749 increased</span>
        </div>
      </div>

      <div className="h-[160px] flex items-end justify-between gap-1 mt-auto">
        {days.map((day, idx) => (
          <div key={idx} className="w-full h-full flex flex-col justify-end items-center relative group">
            {day.highlighted && (
              <motion.span 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-bold text-slate-800 absolute top-[-20px]"
              >
                {day.value}
              </motion.span>
            )}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: day.height }}
              transition={{ duration: 0.8, delay: idx * 0.05 }}
              className={`w-[80%] rounded-lg mb-2.5 transition-all ${
                day.highlighted 
                  ? 'bg-gradient-to-t from-[#B3A9FF] to-[#6152F0]' 
                  : 'bg-[#F0F3F8] group-hover:bg-slate-200'
              }`}
            />
            <span className={`text-[11px] font-medium ${day.highlighted ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
              {day.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
