import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, Send, Eye, PenTool, CreditCard, FileCheck, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuoteTimelineProps {
  status: string
  lastViewedAt: string | null
}

interface Step {
  id: string
  label: string
  icon: LucideIcon
  color: string
  active: boolean
}

export function QuoteTimeline({ status, lastViewedAt }: QuoteTimelineProps) {
  const steps: Step[] = [
    { id: 'created', label: 'Créé', icon: Clock, color: 'bg-slate-500', active: true },
    { id: 'sent', label: 'Envoyé', icon: Send, color: 'bg-blue-500', active: status !== 'draft' },
    { id: 'viewed', label: 'Consulté', icon: Eye, color: 'bg-cyan-500', active: !!lastViewedAt },
    { id: 'signed', label: 'Signé', icon: PenTool, color: 'bg-emerald-500', active: ['accepted', 'paid', 'invoiced'].includes(status) },
    { id: 'paid', label: 'Payé', icon: CreditCard, color: 'bg-indigo-500', active: status === 'paid' },
    { id: 'invoiced', label: 'Facturé', icon: FileCheck, color: 'bg-slate-800', active: status === 'invoiced' },
  ]

  return (
    <Card className="border-slate-200/60 shadow-sm overflow-hidden mb-6 bg-slate-50/30">
      <CardContent className="p-0">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex-1 min-w-[120px] p-4 flex flex-col items-center gap-2 relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10",
                  step.active 
                    ? `${step.color} text-white shadow-lg ring-4 ring-white` 
                    : "bg-slate-200 text-slate-400"
                )}>
                  {step.active && ['signed', 'paid', 'invoiced'].includes(step.id) && status !== 'draft' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                  step.active ? "text-slate-800" : "text-slate-400"
                )}>
                  {step.label}
                </span>
                
                {/* Connecting Line (Mobile/Tab specific adjustment would be needed for a perfect Look) */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-[2.5rem] left-[calc(50%+1.25rem)] w-[calc(100%-2.5rem)] h-[2px] bg-slate-200">
                    <div className={cn(
                      "h-full bg-slate-400 transition-all duration-1000",
                      steps[idx + 1].active ? "w-full" : "w-0"
                    )} />
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
