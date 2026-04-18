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
      // Si l'ID a changé, on réinitialise tout
      if (prev.id !== initialQuote.id) return initialQuote;
      
      // 🚦 RACE CONDITION GUARD: If we just got a realtime event within the last 5s,
      // don't let the server SSR prop override our live state.
      const timeSinceRealtime = Date.now() - lastRealtimeUpdateRef.current;
      if (timeSinceRealtime < 5000) {
        console.log("⚡ [Realtime] Sync depuis serveur ignorée (événement temps réel récent < 5s)");
        return prev;
      }
      
      // Sinon, on ne met à jour que si les données serveur semblent "plus fraîches"
      const isServerNewer = new Date(initialQuote.updated_at || 0) > new Date(prev.updated_at || 0);
      if (isServerNewer) {
        console.log("♻️ [Realtime] Mise à jour depuis le serveur detectée");
        return { ...prev, ...initialQuote };
      }
      return prev;
    });
  }, [initialQuote.id, initialQuote.updated_at]);

  // ⚡ Real-time synchronization
  useEffect(() => {
    const supabase = createClient()
    const quoteId = initialQuote.id
    const channelName = `quote-realtime-${quoteId}`
    
    console.log(`📡 [Realtime] Initialisation du canal : ${channelName}`)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'quotes', 
          // 🎯 Filter explicitly on the quote ID
          filter: `id=eq.${quoteId}` 
        },
        (payload: RealtimePostgresUpdatePayload<Quote>) => {
          const updated = payload.new as Quote
          console.log("⚡ [Realtime] Événement UPDATE reçu pour :", updated.id)
          
          setCurrentQuote(prev => {
             // 1. Vérifie si un changement réel a eu lieu sur les champs suivis
             const hasChanged = 
                prev.status !== updated.status || 
                prev.last_viewed_at !== updated.last_viewed_at ||
                prev.client_signature_url !== updated.client_signature_url ||
                prev.artisan_signature_url !== updated.artisan_signature_url;

             if (!hasChanged) {
                console.log("⏸️ [Realtime] Aucune différence détectée, ignoré.");
                return prev;
             }

             // 🕒 Capture le timestamp pour bloquer l'écrasement par SSR (Race condition)
             lastRealtimeUpdateRef.current = Date.now();

             // 2. Notifications intelligentes (Toasts)
             const showToast = (type: string, title: string, desc: string) => {
               const key = `AF_EVT_${updated.id}_${type}`
               if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
                 localStorage.setItem(key, Date.now().toString())
                 toast.success(title, { description: desc })
               }
             }

             const statusChanged = prev.status !== updated.status;
             if (statusChanged) {
               if (updated.status === 'accepted') {
                 showToast('signature', "✍️ Devis signé !", `Le client et l'artisan ont signé le devis #${updated.number}.`)
               } else if (updated.status === 'paid') {
                 showToast('paid', "🎉 Paiement reçu !", `Le devis #${updated.number} est maintenant payé.`)
               }
             }
             
             if (updated.last_viewed_at && !prev.last_viewed_at) {
               showToast('viewed', "👀 Devis consulté !", `Le client consulte actuellement votre devis.`)
             }

             // 3. Fusion sécurisée (on ne garde que les champs définis pour ne pas perdre les relations)
             const safeUpdate = Object.fromEntries(
                Object.entries(updated).filter(([_, v]) => v !== undefined && v !== null)
             );

             return { ...prev, ...safeUpdate };
          })
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Realtime] Connecté avec succès au devis ${quoteId}`)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`❌ [Realtime] Erreur de canal (${status}) :`, err)
          // Diagnostic silencieux pour l'utilisateur, mais logué pour nous
        }
      })

    return () => {
      console.log(`📴 [Realtime] Désactivation du canal : ${channelName}`)
      supabase.removeChannel(channel)
    }
  }, [initialQuote.id])

  return {
    currentQuote,
    setCurrentQuote
  }
}
