'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'

type QuoteRow = Database['public']['Tables']['quotes']['Row']

// Enriched type for UI
interface QuoteNotification extends QuoteRow {
  clients?: {
    name: string
  } | null
}

interface NotificationContextType {
  unreadCount: number
  notifications: QuoteNotification[]
  markAllAsRead: () => void
  clearAllNotifications: () => void
  refetchUnreadCount: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children, userId }: { children: React.ReactNode, userId: string | null }) {
  const router = useRouter()
  const [isRefreshing, startTransition] = React.useTransition()
  const [supabase] = useState(() => createClient())
  const [notifications, setNotifications] = useState<QuoteNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [preferences, setPreferences] = useState<any>({
    quotes_expired: true,
    quotes_viewed: true,
    quotes_accepted: true,
    payments_received: true
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const preferencesRef = useRef(preferences)
  const lastSeenRef = useRef(lastSeen)
  const lastPlayedRef = useRef(0)
  const hasFetchedRef = useRef(false)
  const audioLockRef = useRef(false)

  useEffect(() => {
    preferencesRef.current = preferences
    lastSeenRef.current = lastSeen
  }, [preferences, lastSeen])

  // 🚀 REFETCH UNREAD COUNT
  const refetchUnreadCount = useCallback(async (overrideLastSeen?: string) => {
    if (!userId) return

    const ts = overrideLastSeen || lastSeenRef.current || '1970-01-01'
    const filter = `updated_at.gt.${ts},last_viewed_at.gt.${ts}`

    const { count, error } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(filter)
    
    if (!error) {
      setUnreadCount(count || 0)
    }
  }, [userId, supabase])

  // 🔊 Audio Warmup
  useEffect(() => {
    const warmup = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause()
          if (audioRef.current) audioRef.current.currentTime = 0
        }).catch(() => {})
      }
    }
    window.addEventListener('click', warmup, { once: true })
    setIsMounted(true)
    return () => window.removeEventListener('click', warmup)
  }, [])

  // 🚀 REALTIME HANDLER
  const handleQuoteChange = useCallback(async (payload: any) => {
    const newQuote = payload.new as QuoteRow
    const oldQuote = payload.old as QuoteRow

    // 1. Instant sync through Next.js (Server Components refresh)
    // 🚀 USE_TRANSITION : Empêche l'interface de "sauter" pendant le re-fetch serveur
    console.log("🔥 [Realtime] Nouveau changement détecté sur un devis !", { 
       id: newQuote?.id, 
       status: newQuote?.status,
       oldStatus: oldQuote?.status,
       lastViewed: newQuote?.last_viewed_at 
    })
    
    startTransition(() => {
      console.log("🔄 [Realtime] Déclenchement du rafraîchissement global (Next.js)...")
      router.refresh()
    })

    // 2. Notification Logic
    // 🛡️ REPLICA IDENTITY GUARD : If oldQuote only has ID, we might get false positives on every update.
    // We rely on the fact that if it's a REAL status change or view change, the value MUST be different from what we might have in cache.
    // However, the localStorage dedup AF_EVT is our best defense.
    
    const isPaid = newQuote.status === 'paid' && (!oldQuote || oldQuote.status !== 'paid')
    const isAccepted = newQuote.status === 'accepted' && (!oldQuote || oldQuote.status !== 'accepted')
    // For viewed, we check if last_viewed_at is defined and different from old (if available)
    const isViewed = !!newQuote.last_viewed_at && (!oldQuote || newQuote.last_viewed_at !== oldQuote.last_viewed_at)

    console.log("🕵️ [Realtime] Analyse du changement :", { isPaid, isAccepted, isViewed })

    if (!isPaid && !isAccepted && !isViewed) {
       console.log("ℹ️ [Realtime] Changement ignoré (pas de signature/paiement/vue significative)")
       return
    }

    const eventType = isPaid ? 'paid' : isAccepted ? 'signed' : 'viewed'
    
    // 🛡️ DEDUP PERMANENT PAR ID DEVIS — même devis + même événement = notif unique
    const staticKey = `AF_EVT_${newQuote.id}_${eventType}`
    
    if (typeof window !== 'undefined' && localStorage.getItem(staticKey)) {
       console.log("🛡️ [Realtime] Événement déjà traité (devis déjà notifié)")
       return
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(staticKey, Date.now().toString())
      
      // 🛡️ MEMORY LEAK PROTECTION : Nettoyage périodique du localStorage
      // On ne garde que les 50 derniers événements pour éviter de saturer le stockage
      const keys = Object.keys(localStorage).filter(k => k.startsWith('AF_EVT_'))
      if (keys.length > 50) {
        const sorted = keys.sort((a, b) => Number(localStorage.getItem(a)) - Number(localStorage.getItem(b)))
        sorted.slice(0, sorted.length - 50).forEach(k => localStorage.removeItem(k))
      }
    }

    const prefs = preferencesRef.current
    if (
       (isPaid && prefs.payments_received === false) ||
       (isAccepted && prefs.quotes_accepted === false) ||
       (isViewed && prefs.quotes_viewed === false)
    ) return

    // Toast UI
    if (isViewed) toast.info("👀 Devis consulté !", { description: `Le devis #${newQuote.number} vient d'être ouvert par le client.` })
    if (isPaid) toast.success("🎉 Paiement reçu !", { description: `Le devis #${newQuote.number} a été payé.` })
    if (isAccepted) toast.success("✍️ Devis signé !", { description: `Le devis #${newQuote.number} a été accepté.` })

    // Audio
    if (!audioLockRef.current) {
      const now = Date.now()
      if (now - lastPlayedRef.current > 2000) {
        audioLockRef.current = true
        audioRef.current?.play().finally(() => { 
          audioLockRef.current = false 
          lastPlayedRef.current = Date.now()
        })
      }
    }

    // Update list state
    console.log("📡 [Realtime] Récupération des détails complets du devis...")
    const { data: fullQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*, clients(name)')
      .eq('id', newQuote.id)
      .single()

    if (fetchError) {
      console.error("❌ [Realtime] Erreur lors de la récupération des détails :", fetchError)
    }

    if (fullQuote) {
      console.log("✅ [Realtime] Détails récupérés avec succès. Mise à jour de la liste locale.")
      const validated = {
        ...fullQuote,
        clients: Array.isArray(fullQuote.clients) ? fullQuote.clients[0] : fullQuote.clients
      } as unknown as QuoteNotification
      
      setNotifications(prev => [validated, ...prev.filter(n => n.id !== validated.id)].slice(0, 15))
    }

    await refetchUnreadCount()
  }, [router, supabase, refetchUnreadCount])

  // 🚀 INVOICE HANDLER
  const handleInvoiceChange = useCallback(async (payload: any) => {
    const newInvoice = payload.new as any
    const oldInvoice = payload.old as any

    console.log("🔥 [Realtime] Changement sur une facture !", { id: newInvoice?.id, status: newInvoice?.status })

    startTransition(() => {
      router.refresh()
    })

    if (newInvoice.status === 'paid' && (!oldInvoice || oldInvoice.status !== 'paid')) {
       const staticKey = `AF_INV_PAID_${newInvoice.id}`
       if (typeof window !== 'undefined' && !localStorage.getItem(staticKey)) {
         localStorage.setItem(staticKey, Date.now().toString())
         toast.success("💰 Facture Payée !", { description: `La facture ${newInvoice.number} a été réglée.` })
         
         if (!audioLockRef.current) {
            audioRef.current?.play().finally(() => { audioLockRef.current = false })
         }
       }
    }
  }, [router])

  // 🏗️ MAIN EFFECT
  useEffect(() => {
    if (!userId || !supabase) return
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const fetchInitialData = async () => {
      const localLastSeen = typeof window !== 'undefined' ? localStorage.getItem(`last_seen_${userId}`) : null
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences, last_seen_notifications_at')
        .eq('id', userId)
        .maybeSingle()
      
      let lastSeenVal = localLastSeen
      if (profile) {
        if (profile.last_seen_notifications_at && (!lastSeenVal || new Date(profile.last_seen_notifications_at) > new Date(lastSeenVal))) {
          lastSeenVal = profile.last_seen_notifications_at
        }
        setLastSeen(lastSeenVal)
        if (profile.notification_preferences) setPreferences(profile.notification_preferences)
      }

      const ts = lastSeenVal || '1970-01-01'
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*, clients(name)')
        .eq('user_id', userId)
        .or(`updated_at.gt.${ts},last_viewed_at.gt.${ts}`)
        .order('updated_at', { ascending: false })
        .limit(10)
      
      if (quotes) {
        setNotifications(quotes.map(q => ({
          ...q,
          clients: Array.isArray(q.clients) ? q.clients[0] : q.clients
        })) as unknown as QuoteNotification[])
      }

      await refetchUnreadCount(lastSeenVal || undefined)
    }

    fetchInitialData()

    // Realtime Subscriptions with FILTERS
    console.log("🔌 [Realtime] Tentative de connexion aux canaux pour l'utilisateur...", userId)
    
    // 🔧 DEBUG MODE: Shotgun (No server-side filter) to verify delivery
    console.log("🔌 [Realtime] MODE DEBUG: Connexion Shotgun (sans filtre serveur)...")
    
    const quoteChannel = supabase
      .channel(`quotes-debug-${userId}`)
      .on('postgres_changes', { 
         event: '*', 
         schema: 'public', 
         table: 'quotes' 
      }, (payload) => {
         console.log("⚡ [Realtime] BRUT reçu (Shotgun) !", payload)
         const newQuote = payload.new as QuoteRow
         
         // FILTRE JS (Sécurité)
         if (newQuote && newQuote.user_id === userId) {
            console.log("✅ [Realtime] Match utilisateur ! Traitement...")
            handleQuoteChange(payload)
         } else {
            console.log("ℹ️ [Realtime] Event ignoré (User ID mismatch)", { eventId: newQuote?.user_id, myId: userId })
         }
      })
      .subscribe((status) => {
         console.log(`📡 [Realtime] Statut du canal DEBUG : ${status}`)
      })

    const profileChannel = supabase
      .channel(`profile-sync-${userId}`)
      .on('postgres_changes', { 
         event: 'UPDATE', 
         schema: 'public', 
         table: 'profiles', 
         filter: `id=eq.${userId}` 
      }, 
        (p: any) => {
          console.log("⚡ [Realtime] Message reçu (Profile) !", p)
          if (p.new.notification_preferences) setPreferences(p.new.notification_preferences)
          if (p.new.last_seen_notifications_at !== p.old.last_seen_notifications_at) {
             setLastSeen(p.new.last_seen_notifications_at)
             refetchUnreadCount(p.new.last_seen_notifications_at)
          }
        }
      )
      .subscribe((status) => {
         console.log(`📡 [Realtime] Statut du canal Profile : ${status}`)
      })

    const invoiceChannel = supabase
      .channel(`invoices-sync-${userId}`)
      .on('postgres_changes', { 
         event: '*', 
         schema: 'public', 
         table: 'invoices', 
         filter: `user_id=eq.${userId}` 
      }, 
        (payload: any) => {
          handleInvoiceChange(payload)
        }
      )
      .subscribe()

    // 📧 Realtime : Sent Emails (For history updates)
    const emailChannel = supabase
      .channel(`emails-sync-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sent_emails',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log("⚡ [Realtime] Nouvel email envoyé !", payload)
        router.refresh()
      })
      .subscribe()

    // 📅 Realtime : Interventions (For calendar updates)
    const interventionChannel = supabase
      .channel(`interventions-sync-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'interventions',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log("⚡ [Realtime] Changement agenda !", payload)
        router.refresh()
      })
      .subscribe()

    // 👥 Realtime : Clients
    const clientChannel = supabase
      .channel(`clients-sync-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log("⚡ [Realtime] Client mis à jour !", payload)
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(quoteChannel)
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(invoiceChannel)
      supabase.removeChannel(emailChannel)
      supabase.removeChannel(interventionChannel)
      supabase.removeChannel(clientChannel)
    }
  }, [userId, supabase, handleQuoteChange, handleInvoiceChange, refetchUnreadCount, router])

  const markAllAsRead = async () => {
    if (!userId) return
    const nowWithBuffer = new Date(Date.now() + 2000).toISOString()
    setNotifications([])
    setUnreadCount(0)
    setLastSeen(nowWithBuffer)
    if (typeof window !== 'undefined') localStorage.setItem(`last_seen_${userId}`, nowWithBuffer)
    await supabase.from('profiles').update({ last_seen_notifications_at: nowWithBuffer }).eq('id', userId)
    await refetchUnreadCount(nowWithBuffer)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ unreadCount: isMounted ? unreadCount : 0, notifications, markAllAsRead, clearAllNotifications, refetchUnreadCount }}>
      {children}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) throw new Error('useNotifications must be used within a NotificationProvider')
  return context
}
