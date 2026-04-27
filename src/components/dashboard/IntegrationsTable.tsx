'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import Link from 'next/link'

const integrations = [
  { name: 'Stripe', type: 'Finance', rate: 40, profit: '$650.00', color: '#635BFF', char: 'S' },
  { name: 'Zapier', type: 'CRM', rate: 80, profit: '$720.50', color: '#FF4A00', char: '❋' },
  { name: 'Shopify', type: 'Marketplace', rate: 20, profit: '$432.25', color: '#95BF47', char: 'S' },
  { name: 'Zoom', type: 'Technology', rate: 60, profit: '$650.00', color: '#2D8CFF', char: 'Z' },
]

export function IntegrationsTable() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-[15px] font-medium text-slate-500">
          <Layers size={20} className="text-slate-400" />
          List of Integration
        </div>
        <Link href="#" className="text-sm font-bold text-brand-purple hover:underline transition-all">
          See All
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[15px] whitespace-nowrap">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-50">
              <th className="pb-4 w-10 pl-2">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-purple focus:ring-brand-purple cursor-pointer" />
              </th>
              <th className="pb-4 font-bold">APPLICATION</th>
              <th className="pb-4 font-bold">TYPE</th>
              <th className="pb-4 font-bold">RATE</th>
              <th className="pb-4 font-bold text-right pr-2">PROFIT</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {integrations.map((item, idx) => (
              <motion.tr 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
              >
                <td className="py-4 pl-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-purple focus:ring-brand-purple cursor-pointer" />
                </td>
                <td className="py-4 flex items-center gap-4 font-semibold">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    {item.char}
                  </div>
                  {item.name}
                </td>
                <td className="py-4 text-slate-500 font-medium">{item.type}</td>
                <td className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.rate}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full bg-brand-purple rounded-full"
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{item.rate}%</span>
                  </div>
                </td>
                <td className="py-4 font-bold text-right pr-2 text-slate-900 group-hover:text-brand-purple transition-colors">
                  {item.profit}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
