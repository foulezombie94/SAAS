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
      // 1. Fetch Profile (Preferences & Last Seen)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('notification_preferences, last_seen_notifications_at')
        .eq('id', userId)
        .single()
      
      if (profileErr) {
        console.warn('[NOTIFICATIONS] Profile fetch failed:', profileErr.message)
      } else {
        const lastSeenVal = profile?.last_seen_notifications_at
        setLastSeen(lastSeenVal)
        const prefs = (profile as any)?.notification_preferences
        if (prefs) {
          setPreferences((prev: any) => ({ ...prev, ...prefs }))
        }
      }

      // 2. Fetch Initial Notifications
      const { data: quotes, error: quotesErr } = await supabase
        .from('quotes')
        .select('*, clients(name)')
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted', 'expired'] as any[])
        .order('updated_at', { ascending: false })
        .limit(8)
      
      if (quotesErr) {
        console.warn('[NOTIFICATIONS] Initial quotes fetch failed:', quotesErr.message)
      } else if (quotes) {
        setNotifications(quotes as QuoteNotification[])
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
        async (payload) => {
          const newQuote = payload.new as QuoteRow
          const oldQuote = payload.old as QuoteRow 

          const key = `${newQuote.id}-${newQuote.updated_at}`
          if (processedRef.current.includes(key)) return
          
          processedRef.current.push(key)
          if (processedRef.current.length > 50) {
            processedRef.current.shift()
          }

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
            // 🚀 Reliable data refetch (Realtime relations) + Zod Validation (Grade 10)
            const { data: fullQuote, error: fetchErr } = await supabase
              .from('quotes')
              .select('*, clients(name)')
              .eq('id', newQuote.id)
              .single()

            if (fetchErr) {
               console.warn('[NOTIFICATIONS] Rich refetch failed:', fetchErr.message)
               return
            }

            // 🛡️ Runtime Validation
            const validation = quoteWithClientSchema.safeParse(fullQuote)
            if (!validation.success) {
              console.error('[RUNTIME VALIDATION ERROR] Notification payload invalid:', validation.error.format())
              return
            }

            const validatedData = validation.data as unknown as QuoteNotification
            
            setNotifications(prev => {
              const filtered = prev.filter(n => n.id !== validatedData.id)
              return [validatedData, ...filtered].slice(0, 8)
            })

            // 🚀 Consistent count update from DB
            await refetchUnreadCount()

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
    setUnreadCount(0)
    const now = new Date().toISOString()
    setLastSeen(now)
    if (!userId) return
    // 🚀 Persist "seen" state to DB
    await supabase
      .from('profiles')
      .update({ last_seen_notifications_at: now })
      .eq('id', userId)
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
