import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Quote } from '@/types/dashboard'
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js'
import { toast } from 'sonner'

/**
 * 🎣 Hook to manage real-time quote synchronization.
 * Handles Supabase subscriptions and keeps local state in sync.
 */
export function useQuoteRealtime(initialQuote: Quote) {
  const [currentQuote, setCurrentQuote] = useState<Quote>(initialQuote)

  // 🔄 Sync state with props when they change
  useEffect(() => {
    setCurrentQuote(initialQuote)
  }, [initialQuote])

  // ⚡ Real-time synchronization
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`quote-dashboard-${initialQuote.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `id=eq.${initialQuote.id}` },
        (payload: RealtimePostgresUpdatePayload<Quote>) => {
          const updated = payload.new as Quote
          console.log("⚡ [Realtime] Mise à jour du devis reçue (Hook) :", updated.id, updated.status)
          
          setCurrentQuote(prev => {
             // 🛡️ DÉDUPLICATION
             if (prev.status === updated.status && prev.last_viewed_at === updated.last_viewed_at) return prev
             return { ...prev, ...updated }
          })

          const showToast = (type: string, title: string, desc: string) => {
            const key = `AF_EVT_${updated.id}_${type}`
            if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
              localStorage.setItem(key, Date.now().toString())
              toast.success(title, { description: desc })
            }
          }

          if (updated.status === 'paid') {
             showToast('paid', "🎉 Paiement reçu !", `Le devis #${updated.number} est maintenant marqué comme payé.`)
          } else if (updated.status === 'accepted') {
             showToast('signed', "✍️ Devis signé !", `Le client a validé le devis #${updated.number}.`)
          } else if (updated.last_viewed_at && updated.last_viewed_at !== currentQuote.last_viewed_at) {
             showToast('viewed', "👀 Devis consulté !", `Le client est en train de regarder le devis #${updated.number}.`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialQuote.id])

  return {
    currentQuote,
    setCurrentQuote
  }
}
