'use client'

import { useEffect, useRef } from 'react'
import { trackQuoteViewAction } from '@/app/dashboard/quotes/actions'

interface ViewTrackerProps {
  quoteId: string
  publicToken: string
}

export function ViewTracker({ quoteId, publicToken }: ViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // Give it a small delay to ensure it's a real view
    const timer = setTimeout(() => {
      trackQuoteViewAction(quoteId, publicToken).catch(() => {})
    }, 2000)

    return () => clearTimeout(timer)
  }, [quoteId, publicToken])

  return null
}
