'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
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
      // 1. Fetch Preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single()
      
      const prefs = (profile as any)?.notification_preferences
      if (prefs) {
        setPreferences((prev: any) => ({ ...prev, ...prefs }))
      }

      // 2. Fetch Initial Notifications
      const { data } = await supabase
        .from('quotes')
        .select('*, clients(name)')
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted', 'expired'] as any[])
        .order('updated_at', { ascending: false })
        .limit(8)
      
      if (data) {
        setNotifications(data as QuoteNotification[])
      }
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
        (payload) => {
          const newQuote = payload.new as any
          const oldQuote = payload.old as any

          // Security check (Double redundant)
          if (newQuote.user_id !== userId) return

          const isPaid = newQuote.status === 'paid' && (oldQuote?.status === undefined || oldQuote?.status !== 'paid')
          const isAccepted = newQuote.status === 'accepted' && (oldQuote?.status === undefined || oldQuote?.status !== 'accepted')
          const isExpired = newQuote.status === 'expired' && (oldQuote?.status === undefined || oldQuote?.status !== 'expired')
          const isViewed = newQuote.last_viewed_at !== oldQuote?.last_viewed_at && !!newQuote.last_viewed_at

          // 🧠 Check preferences via Ref to avoid resubscribe chain
          const prefs = preferencesRef.current
          // Explicitly check for false to support default-to-true behavior safely
          const shouldNotifyPaid = isPaid && prefs.payments_received !== false
          const shouldNotifyAccepted = isAccepted && prefs.quotes_accepted !== false
          const shouldNotifyExpired = isExpired && prefs.quotes_expired !== false
          const shouldNotifyViewed = isViewed && prefs.quotes_viewed !== false

          if (shouldNotifyPaid || shouldNotifyAccepted || shouldNotifyExpired || shouldNotifyViewed) {
            setUnreadCount(prev => prev + 1)
            
            setNotifications(prev => {
              const existing = prev.find(n => n.id === newQuote.id)
              const enriched: QuoteNotification = {
                ...newQuote,
                clients: newQuote.clients || existing?.clients || null
              }
              const filtered = prev.filter(n => n.id !== enriched.id)
              return [enriched, ...filtered].slice(0, 8)
            })

            if (audioRef.current) {
              audioRef.current.play().catch(() => {})
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

          if (payload.new.plan !== payload.old.plan) {
            supabase.auth.refreshSession().then(() => window.location.reload())
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(profileChannel)
    }
  }, [supabase, userId])

  const markAllAsRead = () => setUnreadCount(0)
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
