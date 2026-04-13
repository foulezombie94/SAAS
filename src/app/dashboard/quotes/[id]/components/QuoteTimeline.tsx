import React from 'react'
import { Card } from '@/components/ui/Card'
import { Check, Send, MessageSquare, PenTool, Banknote, Receipt, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuoteTimelineProps {
  status: string
  lastViewedAt: string | null
}

interface Step {
  id: string
  label: string
  icon: LucideIcon
  active: boolean
}

export function QuoteTimeline({ status, lastViewedAt }: QuoteTimelineProps) {
  const steps: Step[] = [
    { id: 'created', label: 'CREATED', icon: Check, active: true },
    { id: 'sent', label: 'SENT', icon: Send, active: status !== 'draft' },
    { id: 'consulted', label: 'CONSULTED', icon: MessageSquare, active: !!lastViewedAt },
    { id: 'signed', label: 'SIGNED', icon: PenTool, active: ['accepted', 'paid', 'invoiced'].includes(status) },
    { id: 'paid', label: 'PAID', icon: Banknote, active: status === 'paid' },
    { id: 'invoiced', label: 'INVOICED', icon: Receipt, active: status === 'invoiced' },
  ]

  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8 bg-white py-10 px-6 md:px-16 rounded-[32px]">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isActive = step.active;
          const isNextActive = idx < steps.length - 1 && steps[idx + 1].active;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Node */}
              <div className="flex flex-col items-center gap-4 relative z-10 bg-white px-2">
                <div className={cn(
                  "w-14 h-14 rounded-[16px] flex items-center justify-center transition-all duration-500",
                  isActive 
                    ? "bg-[#002878] text-white shadow-[0_8px_16px_rgba(0,40,120,0.25)]" 
                    : "bg-white border-2 border-slate-200 text-slate-400"
                )}>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 whitespace-nowrap",
                  isActive ? "text-[#002878]" : "text-slate-400"
                )}>
                  {step.label}
                </span>
              </div>
              
              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] rounded-full mx-1 -translate-y-4 transition-all duration-1000 relative">
                  <div className={cn(
                    "absolute inset-0 transition-all duration-1000 rounded-full",
                    isNextActive ? "bg-[#002878]" : "bg-slate-200"
                  )} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </Card>
  )
}
