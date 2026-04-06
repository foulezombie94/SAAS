'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const supabase = createClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audioRef.current.volume = 0.5
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    // 🕒 INITIAL FETCH: All actionable events (Paid, Accepted, Expired)
    const fetchRecentActivity = async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*, clients(*)')
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted', 'expired'])
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
          const newQuote = payload.new as QuoteNotification
          const oldQuote = payload.old as QuoteNotification

          const isPaid = newQuote.status === 'paid' && oldQuote.status !== 'paid'
          const isAccepted = newQuote.status === 'accepted' && oldQuote.status !== 'accepted'
          const isExpired = newQuote.status === 'expired' && oldQuote.status !== 'expired'

          if (isPaid || isAccepted || isExpired) {
            setUnreadCount(prev => prev + 1)
            
            setNotifications(prev => {
              const filtered = prev.filter(n => n.id !== newQuote.id)
              return [newQuote, ...filtered].slice(0, 8)
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

    return () => {
      supabase.removeChannel(channel)
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
