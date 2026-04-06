'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { QuoteNotification } from '@/types/dashboard'

interface NotificationContextType {
  unreadCount: number
  notifications: QuoteNotification[]
  markAllAsRead: () => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: React.ReactNode
  userId: string 
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<QuoteNotification[]>([])
  
  // ⚡ PERFORMANCE: Memoize client to prevent recreation on each render
  const supabase = useMemo(() => createClient(), [])

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audioRef.current.volume = 0.5
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetchRecentActivity = async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*, clients(*)')
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted', 'expired'] as any[])
        .order('updated_at', { ascending: false })
        .limit(8)

      if (data) {
        setNotifications(data as QuoteNotification[])
      }
    }

    fetchRecentActivity()

    // 🚀 REALTIME: Supabase handles status updates (cron) or signatures
    const channel = supabase
      .channel(`user-activity-${userId}`)
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

          // 🛡️ SENIOR DETECTION: We focus on the NEW state. 
          // Server-side updates (cron) might not always send a full 'old' record.
          const isPaid = newQuote.status === 'paid' && oldQuote?.status !== 'paid'
          const isAccepted = newQuote.status === 'accepted' && oldQuote?.status !== 'accepted'
          const isExpired = newQuote.status === 'expired' && oldQuote?.status !== 'expired'

          if (isPaid || isAccepted || isExpired) {
            setUnreadCount(prev => prev + 1)
            
            setNotifications(prev => {
              // 🛡️ STATE MERGER: Supabase only sends the changed quote row. 
              // We must preserve the 'clients' object from our current state to avoid UI breakage.
              const existing = prev.find(n => n.id === newQuote.id)
              const enriched: QuoteNotification = {
                ...newQuote,
                clients: newQuote.clients || existing?.clients || null
              }
              
              const filtered = prev.filter(n => n.id !== enriched.id)
              return [enriched, ...filtered].slice(0, 8)
            })

            if (isPaid) {
              toast.success(`Paiement reçu !`, { description: `Devis ${newQuote.number} payé.` })
            } else if (isAccepted) {
              toast.info(`Devis signé !`, { description: `Acceptation du client pour ${newQuote.number}.` })
            } else if (isExpired) {
              toast.warning(`Lien expiré !`, { description: `Sécurité : Le lien ${newQuote.number} est désormais invalide.` })
            }
            
            if (audioRef.current) {
              audioRef.current.play().catch(() => {})
            }
          }
        }
      )
      .subscribe()

    // 🚀 PROTECTION GRADE 4: Instant Session Revocation
    // We watch the 'profiles' table for plan changes to force JWT refresh
    const profileChannel = supabase
      .channel(`profile-sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload: any) => {
          if (payload.new.plan !== payload.old.plan) {
            // Force a session refresh to get a new JWT with updated app_metadata
            supabase.auth.refreshSession().then(() => {
              window.location.reload()
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(profileChannel)
    }
  }, [supabase, userId])

  const markAllAsRead = () => {
    setUnreadCount(0)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markAllAsRead, clearAllNotifications }}>
      {children}
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
