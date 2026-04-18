import React from 'react'
import { Card } from '@/components/ui/Card'
import { Check, Send, MessageSquare, PenTool, Banknote, Receipt, LucideIcon, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuoteTimelineProps {
  status: string
  lastViewedAt: string | null
  artisanSignatureUrl?: string | null
  clientSignatureUrl?: string | null
}

interface Step {
  id: string
  label: string
  icon: LucideIcon
  active: boolean
  // Highlight in a different color to distinguish artisan-signed vs fully accepted
  highlight?: boolean
}

export function QuoteTimeline({ status, lastViewedAt, artisanSignatureUrl, clientSignatureUrl }: QuoteTimelineProps) {
  const isFullyAccepted = ['accepted', 'paid', 'invoiced'].includes(status)
  const artisanSigned = !!artisanSignatureUrl
  const clientSigned = !!clientSignatureUrl

  const steps: Step[] = [
    { 
      id: 'created', 
      label: 'CRÉÉ', 
      icon: Check, 
      active: true 
    },
    { 
      id: 'sent', 
      label: 'ENVOYÉ', 
      icon: Send, 
      active: status !== 'draft' 
    },
    { 
      id: 'consulted', 
      label: 'CONSULTÉ', 
      icon: MessageSquare, 
      active: !!lastViewedAt 
    },
    { 
      id: 'signed_artisan', 
      label: 'ARTISAN ✍️', 
      icon: PenTool, 
      active: artisanSigned,
      // Orange highlight when artisan signed but client hasn't yet
      highlight: artisanSigned && !isFullyAccepted
    },
    { 
      id: 'signed', 
      label: 'VALIDÉ', 
      icon: CheckCheck, 
      active: isFullyAccepted 
    },
    { 
      id: 'paid', 
      label: 'PAYÉ', 
      icon: Banknote, 
      active: status === 'paid' 
    },
    { 
      id: 'invoiced', 
      label: 'FACTURÉ', 
      icon: Receipt, 
      active: status === 'invoiced' 
    },
  ]

  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8 bg-white py-10 px-6 md:px-10 rounded-[32px]">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isActive = step.active;
          const isNextActive = idx < steps.length - 1 && steps[idx + 1].active;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Node */}
              <div className="flex flex-col items-center gap-4 relative z-10 bg-white px-1">
                <div className={cn(
                  "w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-500",
                  isActive && !step.highlight
                    ? "bg-[#002878] text-white shadow-[0_8px_16px_rgba(0,40,120,0.25)]" 
                    : isActive && step.highlight
                    // Orange = artisan signé, en attente client
                    ? "bg-[#ef9900] text-white shadow-[0_8px_16px_rgba(239,153,0,0.3)]"
                    : "bg-white border-2 border-slate-200 text-slate-400"
                )}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-300 whitespace-nowrap",
                  isActive && !step.highlight ? "text-[#002878]" 
                  : isActive && step.highlight ? "text-[#ef9900]"
                  : "text-slate-400"
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
