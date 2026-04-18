import React, { useState, useEffect, useRef } from 'react'
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
  
  // 🛡️ Track when we last received a REALTIME event to prevent server prop race conditions.
  const lastRealtimeUpdateRef = useRef<number>(0)

  // 🔄 Sync state with props only if ID or version changes (prevent regressions)
  useEffect(() => {
    setCurrentQuote(prev => {
      if (!prev) return initialQuote;
      if (prev.id !== initialQuote.id) return initialQuote;
      
      const timeSinceRealtime = Date.now() - lastRealtimeUpdateRef.current;
      if (timeSinceRealtime < 5000) {
        return prev;
      }
      
      const prevDate = prev.updated_at ? new Date(prev.updated_at).getTime() : 0;
      const nextDate = initialQuote.updated_at ? new Date(initialQuote.updated_at).getTime() : 0;

      if (nextDate > prevDate) {
        return { ...prev, ...initialQuote };
      }
      return prev;
    });
  }, [initialQuote]) // 🎯 Correct dependencies

  // ⚡ Real-time synchronization
  useEffect(() => {
    const supabase = createClient()
    const quoteId = initialQuote.id
    const channelName = `quote-realtime-${quoteId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'quotes', 
          filter: `id=eq.${quoteId}` 
        },
        (payload: RealtimePostgresUpdatePayload<Quote>) => {
          const updated = payload.new as Quote
          
          setCurrentQuote(prev => {
             // 🏎️ PERFORMANCE: Early return if no timestamp change
             if (updated.updated_at === prev.updated_at) return prev;

             // 1. Vérifie si un changement réel a eu lieu sur les champs suivis
             const hasChanged = 
                prev.status !== updated.status || 
                prev.last_viewed_at !== updated.last_viewed_at ||
                prev.client_signature_url !== updated.client_signature_url ||
                prev.artisan_signature_url !== updated.artisan_signature_url;

             if (!hasChanged) return prev;

             lastRealtimeUpdateRef.current = Date.now();

             // 2. Notifications intelligentes avec Debounce 10s
             const showToast = (type: string, title: string, desc: string) => {
               if (typeof window === 'undefined') return;
               const key = `AF_EVT_${updated.id}_${type}`
               const existing = localStorage.getItem(key)
               
               if (existing && Date.now() - Number(existing) < 10000) return;
               
               localStorage.setItem(key, Date.now().toString())
               toast.success(title, { description: desc })
             }

             if (prev.status !== updated.status) {
               if (updated.status === 'accepted') {
                 showToast('signature', "✍️ Devis signé !", `Le devis #${updated.number} a été signé par les deux parties.`)
               } else if (updated.status === 'paid') {
                 showToast('paid', "🎉 Paiement reçu !", `Le devis #${updated.number} est maintenant réglé.`)
               }
             }
             
             if (updated.last_viewed_at && !prev.last_viewed_at) {
               showToast('viewed', "👀 Devis consulté !", `Votre client consulte actuellement le devis #${updated.number}.`)
             }

             // 3. Fusion sécurisée (On garde les 'null' pour permettre les suppressions en DB)
             const safeUpdate = Object.fromEntries(
                Object.entries(updated).filter(([_, v]) => v !== undefined)
             );

             return { ...prev, ...safeUpdate };
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialQuote.id])

  return { currentQuote, setCurrentQuote }
}
