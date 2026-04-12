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
  const processedRef = useRef<string[]>([])
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
    console.log("🔄 [Realtime] Status change detected. Refreshing UI...")
    router.refresh()

    // 2. Notification Logic
    const isPaid = newQuote.status === 'paid' && (!oldQuote || oldQuote.status !== 'paid')
    const isAccepted = newQuote.status === 'accepted' && (!oldQuote || oldQuote.status !== 'accepted')
    const isViewed = !!newQuote.last_viewed_at && (!oldQuote || newQuote.last_viewed_at !== oldQuote.last_viewed_at)

    if (!isPaid && !isAccepted && !isViewed) return

    const eventType = isPaid ? 'paid' : isAccepted ? 'signed' : 'viewed'
    const staticKey = `AF_EVT_${newQuote.id}_${eventType}`
    
    if (typeof window !== 'undefined' && localStorage.getItem(staticKey)) return
    if (typeof window !== 'undefined') localStorage.setItem(staticKey, Date.now().toString())

    const prefs = preferencesRef.current
    if (
       (isPaid && prefs.payments_received === false) ||
       (isAccepted && prefs.quotes_accepted === false) ||
       (isViewed && prefs.quotes_viewed === false)
    ) return

    // Toast UI
    if (isViewed) toast.info("👀 Devis consulté !", { description: `Le devis #${newQuote.number} vient d'être ouvert.` })
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
    const { data: fullQuote } = await supabase
      .from('quotes')
      .select('*, clients(name)')
      .eq('id', newQuote.id)
      .single()

    if (fullQuote) {
      const validated = {
        ...fullQuote,
        clients: Array.isArray(fullQuote.clients) ? fullQuote.clients[0] : fullQuote.clients
      } as unknown as QuoteNotification
      
      setNotifications(prev => [validated, ...prev.filter(n => n.id !== validated.id)].slice(0, 15))
    }

    await refetchUnreadCount()
  }, [router, supabase, refetchUnreadCount])

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
    const quoteChannel = supabase
      .channel(`quotes-sync-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes', filter: `user_id=eq.${userId}` }, handleQuoteChange)
      .subscribe()

    const profileChannel = supabase
      .channel(`profile-sync-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, 
        (p: any) => {
          if (p.new.notification_preferences) setPreferences(p.new.notification_preferences)
          if (p.new.last_seen_notifications_at !== p.old.last_seen_notifications_at) {
             setLastSeen(p.new.last_seen_notifications_at)
             refetchUnreadCount(p.new.last_seen_notifications_at)
          }
        }
      )
      .subscribe()

    const invoiceChannel = supabase
      .channel(`invoices-sync-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${userId}` }, 
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(quoteChannel)
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(invoiceChannel)
    }
  }, [userId, supabase, handleQuoteChange, refetchUnreadCount, router])

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
