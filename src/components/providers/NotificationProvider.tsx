'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface NotificationContextType {
  unreadCount: number
  notifications: any[]
  markAllAsRead: () => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: React.ReactNode
  userId: string // SECURITY: Now mandatory to restrict messages
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const supabase = createClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize sound safely for browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audioRef.current.volume = 0.5
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    // Fetch initial notifications (last 10 events)
    const fetchRecentActivity = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, clients(*)')
        .eq('user_id', userId)
        .in('status', ['paid', 'accepted'])
        .order('updated_at', { ascending: false })
        .limit(5)

      if (data) {
        setNotifications(data)
      }
    }

    fetchRecentActivity()

    // 1. Setup Listener Restricted to THIS user's quotes
    const channel = supabase
      .channel(`user-payments-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const isPaid = payload.new.status === 'paid' && payload.old.status !== 'paid'
          const isAccepted = payload.new.status === 'accepted' && payload.old.status !== 'accepted'

          if (isPaid || isAccepted) {
            console.log('Notification event received:', payload.new.status)
            
            setUnreadCount(prev => prev + 1)
            
            // Prepend new notification and avoid duplicates if IDs match
            setNotifications(prev => {
              const filtered = prev.filter(n => n.id !== payload.new.id)
              return [payload.new, ...filtered].slice(0, 5)
            })

            if (isPaid) {
              toast.success(`Paiement reçu !`, {
                description: `Le devis ${payload.new.number} a été payé par carte.`,
                duration: 8000,
              })
            } else {
              toast.info(`Devis signé !`, {
                description: `Le client a accepté et signé le devis ${payload.new.number}.`,
                duration: 8000,
              })
            }
            
            // Safe audio playback
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.warn('Audio playback blocked:', e))
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Notification Channel status for ${userId}:`, status)
      })

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
