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
  const processedRef = useRef<string[]>([]) // 🚀 FIFO Deduplication
  const lastPlayedRef = useRef(0)

  // 🔄 Sync Ref with state for closure safety in callbacks
  useEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])

  // 🔄 Sync lastSeen for refetch query
  const lastSeenRef = useRef(lastSeen)
  useEffect(() => {
    lastSeenRef.current = lastSeen
  }, [lastSeen])

  // 🚀 Refetch unreadCount (Grade 10 Reliability)
  const refetchUnreadCount = useCallback(async () => {
    if (!userId || !supabase) return

    const { count, error } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['paid', 'accepted', 'expired'] as any[])
      .gt('updated_at', lastSeenRef.current || '1970-01-01')
    
    if (error) {
      console.warn('[NOTIFICATIONS] Unread count refetch failed:', error.message)
      return
    }
    
    setUnreadCount(count || 0)
  }, [userId, supabase])

  // 🔊 Audio Warmup mechanism
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

  useEffect(() => {
    if (!userId || !supabase) return

    const fetchInitialData = async () => {
      // 🚀 RESTORE: Load from LocalStorage first for instant consistency
      const localLastSeen = typeof window !== 'undefined' ? localStorage.getItem(`last_seen_${userId}`) : null
      
      // 1. Fetch Profile (Preferences & Last Seen)
      let lastSeenVal: string | null = localLastSeen
      
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('notification_preferences, last_seen_notifications_at')
        .eq('id', userId)
        .single()
      
      if (profileErr) {
        console.warn('[NOTIFICATIONS] Profile fetch failed:', profileErr.message)
      } else {
        const dbLastSeen = profile?.last_seen_notifications_at ?? null
        // 🚀 LOGIC: Use the most recent of either DB or LocalStorage
        if (dbLastSeen && (!lastSeenVal || new Date(dbLastSeen) > new Date(lastSeenVal))) {
          lastSeenVal = dbLastSeen
        }
        
        setLastSeen(lastSeenVal)
        const prefs = (profile as any)?.notification_preferences
        if (prefs) {
          setPreferences((prev: any) => ({ ...prev, ...prefs }))
        }
      }

      // 2. Fetch Initial Notifications (only unread — after lastSeen)
      let quotesQuery = supabase
        .from('quotes')
        .select('*, clients(name)')
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted', 'expired'] as any[])
      
      // 🚀 FIX: Only fetch notifications newer than lastSeen to prevent re-appearing on reload
      if (lastSeenVal) {
        quotesQuery = quotesQuery.gt('updated_at', lastSeenVal)
      }

      const { data: quotes, error: quotesErr } = await quotesQuery
        .order('updated_at', { ascending: false })
        .limit(8)
      
      if (quotesErr) {
        console.warn('[NOTIFICATIONS] Initial quotes fetch failed:', quotesErr.message)
      } else if (quotes) {
        // 🚀 FIX: Handle Supabase jointure format (sometimes array, sometimes object)
        const normalized = quotes.map(q => ({
          ...q,
          clients: Array.isArray(q.clients) ? q.clients[0] : q.clients
        })) as unknown as QuoteNotification[]
        setNotifications(normalized)
      }

      // 3. Initial count sync
      await refetchUnreadCount()
    }

    fetchInitialData()

    // 🕒 Periodical sync (Every 5 minutes) to ensure consistency
    const interval = setInterval(refetchUnreadCount, 5 * 60 * 1000)

    // 🛡️ REALTIME: Advanced Multi-Event Listener with FULL REPLICA IDENTITY
    const channel = supabase
      .channel(`user-activity-v5-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newQuote = payload.new as QuoteRow
          const oldQuote = payload.old as QuoteRow 

          // 🚀 IMMEDIATE DETECTION (Zero-Latency)
          const isPaid = newQuote.status === 'paid' && (!oldQuote || oldQuote.status !== 'paid')
          const isAccepted = newQuote.status === 'accepted' && (!oldQuote || oldQuote.status !== 'accepted')
          // Consultation is true if last_viewed_at was null/different
          const isViewed = !!newQuote.last_viewed_at && (!oldQuote || oldQuote.last_viewed_at !== newQuote.last_viewed_at)
          
          if (!isPaid && !isAccepted && !isViewed) return

          // 🚀 HIGH-PRECISION DEDUPLICATION (State-Based)
          // We don't include updated_at here to avoid repeats for the SAME event
          const eventType = isPaid ? 'paid' : isAccepted ? 'signed' : 'viewed'
          const key = `${newQuote.id}-${eventType}-${eventType === 'viewed' ? newQuote.last_viewed_at : newQuote.status}`
          if (processedRef.current.includes(key)) return
          processedRef.current.push(key)
          if (processedRef.current.length > 50) processedRef.current.shift()

          const prefs = preferencesRef.current
          const getPref = (k: keyof typeof prefs) => prefs[k] !== false

          const triggerNotification = async () => {
            // 🛡️ SONNER DEDUPLICATION : Explicit ID prevents same toast appearing twice
            const toastId = `${newQuote.id}-${eventType}`

            // 1. Show an immediate "Low-Fidelity" Toast
            if (isViewed) toast.info("👀 Devis consulté !", { id: toastId, description: `Un client vient d'ouvrir votre devis #${newQuote.number || '...'}` })
            if (isPaid) toast.success("🎉 Paiement reçu !", { id: toastId, description: `Le devis #${newQuote.number || '...'} a été réglé.` })
            if (isAccepted) toast.success("✍️ Devis signé !", { id: toastId, description: `Le devis #${newQuote.number || '...'} a été accepté.` })

            // 🔊 Audio alert
            const now = Date.now()
            if (now - lastPlayedRef.current > 2000) {
              audioRef.current?.play().catch(() => {})
              lastPlayedRef.current = now
            }

            // 2. Fetch rich data
            const { data: fullQuote } = await supabase
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
                // 🚀 HISTORY PRESERVATION: We only filter out EXACT matches (same ID + same STATUS)
                // This allows 'Consulted' and 'Signed' for the SAME quote to stay in the list.
                const filtered = prev.filter(n => !(n.id === validated.id && n.status === validated.status))
                return [validated, ...filtered].slice(0, 15)
              })
              await refetchUnreadCount()
            }
          }

          if (
            (isPaid && getPref('payments_received')) ||
            (isAccepted && getPref('quotes_accepted')) ||
            (isViewed && getPref('quotes_viewed'))
          ) {
            triggerNotification()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[NOTIFICATIONS] Realtime connected successfully')
        }
      })

    // 🚀 PROTECTION: Session & Prefs Sync
    const profileChannel = supabase
      .channel(`profile-sync-v5-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload: any) => {
          if (payload.new.id !== userId) return

          const newPrefs = payload.new.notification_preferences
          if (newPrefs) {
            setPreferences((prev: any) => ({ ...prev, ...newPrefs }))
          }

          if (payload.new.last_seen_notifications_at !== payload.old.last_seen_notifications_at) {
             setLastSeen(payload.new.last_seen_notifications_at)
             refetchUnreadCount()
          }

          if (payload.new.plan !== payload.old.plan) {
            supabase.auth.refreshSession().then(() => {
              router.refresh()
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(profileChannel)
      clearInterval(interval)
    }
  }, [supabase, userId, router, refetchUnreadCount])

  const markAllAsRead = async () => {
    // 🚀 RADICAL CLEANUP: Clear local state instantly for 'delete' effect
    setNotifications([])
    setUnreadCount(0)
    
    // 🚀 FIX: Add a 5s safety buffer
    const nowWithBuffer = new Date(Date.now() + 5000).toISOString()
    setLastSeen(nowWithBuffer)
    
    if (!userId) return

    // 🚀 SYNC: LocalStorage for immediate F5 protection
    if (typeof window !== 'undefined') {
      localStorage.setItem(`last_seen_${userId}`, nowWithBuffer)
    }

    // 🚀 Persist "seen" state to DB
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen_notifications_at: nowWithBuffer })
      .eq('id', userId)
    
    if (error) {
      console.error('[NOTIFICATIONS] Mark all as read failed:', error.message)
    }

    // Refresh unread count immediately to sync UI
    await refetchUnreadCount()
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
