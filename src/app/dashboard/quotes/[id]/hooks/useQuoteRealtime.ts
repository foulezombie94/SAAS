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

  // 🔄 Sync state with props only if ID or version changes (prevent regressions)
  useEffect(() => {
    setCurrentQuote(prev => {
      // Si l'ID a changé, on réinitialise tout
      if (prev.id !== initialQuote.id) return initialQuote;
      
      // Sinon, on ne met à jour que si les données serveur semblent "plus fraîches"
      // ou si l'état local a été perdu.
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
    const channelName = `quote-dashboard-${initialQuote.id}`
    
    console.log(`📡 [Realtime] Tentative de connexion au canal : ${channelName}`)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `id=eq.${initialQuote.id}` },
        (payload: RealtimePostgresUpdatePayload<Quote>) => {
          const updated = payload.new as Quote
          console.log("⚡ [Realtime] UPDATE reçu :", updated.id, "=>", updated.status)
          
          setCurrentQuote(prev => {
             // 1. Protection relations (profiles/clients)
             // Les payloads Realtime n'incluent que les colonnes de la table 'quotes'.
             // On fusionne donc avec 'prev' pour conserver les objets liés.
             
             const isIdentical = 
                prev.status === updated.status && 
                prev.last_viewed_at === updated.last_viewed_at &&
                prev.client_signature_url === updated.client_signature_url &&
                prev.artisan_signature_url === updated.artisan_signature_url;

             if (isIdentical) {
                console.log("⏸️ [Realtime] Mise à jour ignorée (Identique)");
                return prev;
             }

             // 2. Gestion des Notifications (Toasts)
             const showToast = (type: string, title: string, desc: string) => {
               const key = `AF_EVT_${updated.id}_${type}`
               if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
                 localStorage.setItem(key, Date.now().toString())
                 toast.success(title, { description: desc })
               }
             }

             // Déclencheurs spécifiques pour éviter le spam
             const justBecameConsulted = updated.last_viewed_at && !prev.last_viewed_at;
             const justSigned = updated.status === 'accepted' && prev.status !== 'accepted';
             const justPaid = updated.status === 'paid' && prev.status !== 'paid';

             if (justPaid) {
                showToast('paid', "🎉 Paiement reçu !", `Le devis #${updated.number} est maintenant marqué comme payé.`)
             } else if (justSigned) {
                showToast('signed', "✍️ Devis signé !", `Le client a validé le devis #${updated.number}.`)
             } else if (justBecameConsulted) {
                showToast('viewed', "👀 Devis consulté !", `Le client est en train de regarder le devis #${updated.number}.`)
             } else if (updated.artisan_signature_url && !prev.artisan_signature_url) {
                showToast('artisan_signed', "✍️ Signature artisan ajoutée !", `Le devis #${updated.number} a été signé par l'artisan.`)
             }

             return { ...prev, ...updated };
          })
        }
      )
      .subscribe((status) => {
        console.log(`🔌 [Realtime] État du canal : ${status}`)
      })

    return () => {
      console.log(`📴 [Realtime] Fermeture du canal : ${channelName}`)
      supabase.removeChannel(channel)
    }
  }, [initialQuote.id])

  return {
    currentQuote,
    setCurrentQuote
  }
}
