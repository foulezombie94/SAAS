'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'
import { quoteWithClientSchema } from '@/lib/validations/database'

type QuoteRow = Database['public']['Tables']['quotes']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

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
  // 🚀 Best practice: Singleton-safe initialization
  const [supabase] = useState(() => createClient())
  const [notifications, setNotifications] = useState<QuoteNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<any>({
    quotes_expired: true,
    quotes_viewed: true,
    quotes_accepted: true,
    payments_received: true
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const preferencesRef = useRef(preferences)
  const processedRef = useRef<string[]>([]) 
  const lastPlayedRef = useRef(0)
  const hasFetchedRef = useRef(false)
  const audioLockRef = useRef(false)
  
  // 🚀 STABILISATION SUPABASE/ROUTER
  const supabaseRef = useRef(supabase)
  const routerRef = useRef(router)

  useEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])

  const lastSeenRef = useRef(lastSeen)
  useEffect(() => {
    lastSeenRef.current = lastSeen
  }, [lastSeen])

  // 🚀 REFETCH UNREAD COUNT (STABILISÉ)
  const refetchUnreadCount = useCallback(async (overrideLastSeen?: string) => {
    const sb = supabaseRef.current
    if (!userId || !sb) return

    const effectiveLastSeen = overrideLastSeen || lastSeenRef.current || '1970-01-01'
    const filter = `and(status.in.("paid","accepted","expired"),updated_at.gt.${effectiveLastSeen}),and(last_viewed_at.not.is.null,last_viewed_at.gt.${effectiveLastSeen})`

    const { count, error } = await sb
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(filter)
    
    if (!error) {
      setUnreadCount(count || 0)
    }
  }, [userId]) // ✅ Supabase/Router exclus car stables via Refs

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
    return () => window.removeEventListener('click', warmup)
  }, [])

  // 🧪 EFFECT PRINCIPAL (STABILISÉ)
  useEffect(() => {
    if (!userId || !supabase) return
    
    // 🛡️ DOUBLE-MOUNT PROTECTION
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const fetchInitialData = async () => {
      const sb = supabaseRef.current
      const localLastSeen = typeof window !== 'undefined' ? localStorage.getItem(`last_seen_${userId}`) : null
      
      let lastSeenVal: string | null = localLastSeen
      
      // 1. Fetch Profile (Lite)
      const { data: profile } = await sb
        .from('profiles')
        .select('notification_preferences, last_seen_notifications_at')
        .eq('id', userId)
        .single()
      
      if (profile) {
        const dbLastSeen = profile?.last_seen_notifications_at ?? null
        if (dbLastSeen && (!lastSeenVal || new Date(dbLastSeen) > new Date(lastSeenVal))) {
          lastSeenVal = dbLastSeen
        }
        
        setLastSeen(lastSeenVal)
        if (profile.notification_preferences) {
          setPreferences((prev: any) => ({ ...prev, ...(profile.notification_preferences as object) }))
        }
      }

      // 2. Fetch Unread (Optimized)
      const ts = lastSeenVal || '1970-01-01'
      const filter = `and(status.in.("paid","accepted","expired"),updated_at.gt.${ts}),and(last_viewed_at.not.is.null,last_viewed_at.gt.${ts})`
      
      const { data: quotes } = await sb
        .from('quotes')
        .select('*, clients(name)')
        .eq('user_id', userId)
        .or(filter)
        .order('updated_at', { ascending: false })
        .limit(10)
      
      if (quotes && (quotes.length > 0)) {
        const normalized = quotes.map(q => ({
          ...q,
          clients: Array.isArray(q.clients) ? q.clients[0] : q.clients
        })) as unknown as QuoteNotification[]
        setNotifications(normalized)
      }
      // Si quotes est [], on ne fait rien lors de l'initial fetch pour éviter le flickering "Zéro"

      // 3. Sync Initial Count
      await refetchUnreadCount(lastSeenVal || undefined)
    }

    fetchInitialData()

    // 🕒 Periodical sync (Invisible background)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refetchUnreadCount()
      }
    }, 5 * 60 * 1000)

    // 🛡️ REALTIME (ADVANCED & SILENT)
    const channel = supabase
      .channel(`user-activity-v7-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const newQuote = payload.new as QuoteRow
          const oldQuote = payload.old as QuoteRow 

          const isPaid = newQuote.status === 'paid' && (!oldQuote || oldQuote.status !== 'paid')
          const isAccepted = newQuote.status === 'accepted' && (!oldQuote || oldQuote.status !== 'accepted')
          const isViewed = !!newQuote.last_viewed_at && (!oldQuote || !oldQuote.last_viewed_at)
          
          if (!isPaid && !isAccepted && !isViewed) return

          const eventType = isPaid ? 'paid' : isAccepted ? 'signed' : 'viewed'
          const staticKey = `AF_EVT_${newQuote.id}_${eventType}`
          
          // 🛡️ PERSISTENT DEDUPLICATION (Survives Refresh/Reconnect)
          if (typeof window !== 'undefined' && localStorage.getItem(staticKey)) return
          
          if (typeof window !== 'undefined') {
            localStorage.setItem(staticKey, Date.now().toString())
            // Cleanup old keys (keep only last 50)
            const keys = Object.keys(localStorage).filter(k => k.startsWith('AF_EVT_'))
            if (keys.length > 50) {
              const sorted = keys.sort((a, b) => Number(localStorage.getItem(a)) - Number(localStorage.getItem(b)))
              localStorage.removeItem(sorted[0])
            }
          }

          const prefs = preferencesRef.current
          if (
             (isPaid && prefs.payments_received === false) ||
             (isAccepted && prefs.quotes_accepted === false) ||
             (isViewed && prefs.quotes_viewed === false)
          ) return

          // 🛡️ TOAST UI
          const toastId = staticKey
          if (isViewed) toast.info("👀 Devis consulté !", { id: toastId, description: `Le devis #${newQuote.number} vient d'être ouvert.` })
          if (isPaid) toast.success("🎉 Paiement reçu !", { id: toastId, description: `Le devis #${newQuote.number} a été payé.` })
          if (isAccepted) toast.success("✍️ Devis signé !", { id: toastId, description: `Le devis #${newQuote.number} a été accepté.` })

          // 🔊 AUDIO LOCK
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

          // 🚀 BACKEND-FIRST SYNC (Source of Truth)
          // On évite l'injection de state locale 'sale'
          // 1. Mise à jour de la liste via fetch ciblé ou refresh global
          const sb = supabaseRef.current
          const { data: fullQuote } = await sb
            .from('quotes')
            .select('*, clients(name)')
            .eq('id', newQuote.id)
            .single()

          if (fullQuote) {
            const validated = {
              ...fullQuote,
              clients: Array.isArray(fullQuote.clients) ? fullQuote.clients[0] : fullQuote.clients
            } as QuoteNotification
            
            setNotifications(prev => {
              const filtered = prev.filter(n => n.id !== validated.id)
              return [validated, ...filtered].slice(0, 15)
            })
          }

          // 2. RECONCILIATION DU COMPTE (Invalidation Strategy)
          // C'est le SEUL moyen de garantir que le badge est juste
          await refetchUnreadCount()
        }
      )
      .subscribe()

    // 🚀 PROFILE SYNC
    const profileChannel = supabase
      .channel(`profile-sync-v7-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        async (payload: any) => {
          if (payload.new.notification_preferences) {
            setPreferences(payload.new.notification_preferences)
          }
          if (payload.new.last_seen_notifications_at !== payload.old.last_seen_notifications_at) {
             setLastSeen(payload.new.last_seen_notifications_at)
             await refetchUnreadCount(payload.new.last_seen_notifications_at)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(profileChannel)
      clearInterval(interval)
    }
  }, [userId, supabase, refetchUnreadCount]) // ✅ refetchUnreadCount est stable via useCallback

  const markAllAsRead = async () => {
    if (!userId) return

    // 🚀 OPTIMISTIC UI: Instant feedback
    setNotifications([])
    setUnreadCount(0)
    
    // 🚀 TIME BUFFER: Avoid race conditions with sub-second DB updates
    const nowWithBuffer = new Date(Date.now() + 2000).toISOString()
    setLastSeen(nowWithBuffer)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`last_seen_${userId}`, nowWithBuffer)
    }

    // 🚀 PERSISTENCE & FINAL SYNC
    // On update d'abord la DB, PUIS on refetch pour être 100% sûr de la cohérence
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen_notifications_at: nowWithBuffer })
      .eq('id', userId)
    
    if (!error) {
      await refetchUnreadCount(nowWithBuffer)
    }
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markAllAsRead, clearAllNotifications, refetchUnreadCount }}>
      {children}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
