'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface QuoteNotification {
  id: string
  number: string
  status: string
  updated_at: string
  last_viewed_at?: string
  clients?: {
    name: string
  } | null
}

interface NotificationContextType {
  unreadCount: number
  notifications: QuoteNotification[]
  markAllAsRead: () => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children, userId }: { children: React.ReactNode, userId: string | null }) {
  const router = useRouter()
  // 🚀 Best practice: Singleton-safe initialization
  const [supabase] = useState(() => createClient())
  const [notifications, setNotifications] = useState<QuoteNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState<any>({
    quotes_expired: true,
    quotes_viewed: true,
    quotes_accepted: true,
    payments_received: true
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const preferencesRef = useRef(preferences)
  const processedRef = useRef(new Set<string>())
  const lastPlayedRef = useRef(0)

  // 🔄 Sync Ref with state
  useEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])

  // 🔊 Audio Warmup mechanism
  useEffect(() => {
    const warmup = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause()
          if (audioRef.current) audioRef.current.currentTime = 0
        }).catch(() => {})
      }
      window.removeEventListener('click', warmup)
    }
    window.addEventListener('click', warmup)
    return () => window.removeEventListener('click', warmup)
  }, [])

  useEffect(() => {
    if (!userId || !supabase) return

    const fetchInitialData = async () => {
      // 1. Fetch Profile (Preferences & Last Seen)
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences, last_seen_notifications_at')
        .eq('id', userId)
        .single()
      
      const lastSeen = profile?.last_seen_notifications_at
      const prefs = (profile as any)?.notification_preferences
      if (prefs) {
        setPreferences((prev: any) => ({ ...prev, ...prefs }))
      }

      // 2. Fetch Initial Notifications
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*, clients(name)')
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted', 'expired'] as any[])
        .order('updated_at', { ascending: false })
        .limit(8)
      
      if (quotes) {
        setNotifications(quotes as QuoteNotification[])
      }

      // 3. Calculate persistent unread count from DB
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted', 'expired'] as any[])
        .gt('updated_at', lastSeen || '1970-01-01')
      
      setUnreadCount(count || 0)
    }

    fetchInitialData()

    // 🛡️ REALTIME: Advanced Multi-Event Listener
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
        async (payload) => {
          const newQuote = payload.new as any
          const oldQuote = payload.old as any

          // 🧠 Reliable Deduplication (id + updated_at)
          const key = `${newQuote.id}-${newQuote.updated_at}`
          if (processedRef.current.has(key)) return
          processedRef.current.add(key)
          if (processedRef.current.size > 50) {
            const firstKey = processedRef.current.values().next().value
            if (firstKey) processedRef.current.delete(firstKey)
          }

          // Security check
          if (newQuote.user_id !== userId) return

          const isPaid = newQuote.status === 'paid' && (!oldQuote || oldQuote.status !== 'paid')
          const isAccepted = newQuote.status === 'accepted' && (!oldQuote || oldQuote.status !== 'accepted')
          const isExpired = newQuote.status === 'expired' && (!oldQuote || oldQuote.status !== 'expired')
          const isViewed = newQuote.last_viewed_at !== (oldQuote?.last_viewed_at || null) && !!newQuote.last_viewed_at

          const prefs = preferencesRef.current
          const shouldNotifyPaid = isPaid && prefs.payments_received !== false
          const shouldNotifyAccepted = isAccepted && prefs.quotes_accepted !== false
          const shouldNotifyExpired = isExpired && prefs.quotes_expired !== false
          const shouldNotifyViewed = isViewed && prefs.quotes_viewed !== false

          if (shouldNotifyPaid || shouldNotifyAccepted || shouldNotifyExpired || shouldNotifyViewed) {
            // 🚀 Reliable data refetch (Supabase realtime doesn't include relations like clients)
            const { data: fullQuote } = await supabase
              .from('quotes')
              .select('*, clients(name)')
              .eq('id', newQuote.id)
              .single()

            const enriched = (fullQuote || newQuote) as QuoteNotification
            
            setUnreadCount(prev => prev + 1)
            setNotifications(prev => {
              const filtered = prev.filter(n => n.id !== enriched.id)
              return [enriched, ...filtered].slice(0, 8)
            })

            // 🔊 Audio cooldown (1s)
            const now = Date.now()
            if (now - lastPlayedRef.current > 1000) {
              if (audioRef.current) {
                audioRef.current.play().catch(() => {})
                lastPlayedRef.current = now
              }
            }

            if (shouldNotifyPaid) {
              toast.success(`Paiement reçu !`, { description: `Règlement pour le devis ${newQuote.number}.` })
            } else if (shouldNotifyAccepted) {
              toast.info(`Signature reçue !`, { description: `Acceptation pour ${newQuote.number}.` })
            } else if (shouldNotifyExpired) {
              toast.warning(`Lien expiré !`, { description: `Le devis ${newQuote.number} est expiré.` })
            } else if (shouldNotifyViewed) {
              toast.message(`Devis ouvert !`, { description: `Le client consulte le devis ${newQuote.number}.`, icon: '👁️' })
            }
          }
        }
      )
      .subscribe()

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
            console.log('🔄 Prefs Synced Realtime:', newPrefs)
            setPreferences((prev: any) => ({ ...prev, ...newPrefs }))
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
    }
  }, [supabase, userId, router])

  const markAllAsRead = async () => {
    setUnreadCount(0)
    if (!userId) return
    // 🚀 Persist "seen" state to DB
    await supabase
      .from('profiles')
      .update({ last_seen_notifications_at: new Date().toISOString() })
      .eq('id', userId)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markAllAsRead, clearAllNotifications }}>
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
