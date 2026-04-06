import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

const CACHE_VERSION = 'v1.1'
const DEFAULT_TTL = 1000 * 60 * 30 // 30 minutes

interface CacheEnvelope<T> {
  data: T
  timestamp: number
  version: string
}

/**
 * Hook de Synchronisation "God Tier" (SWR-style)
 * 🏎️ Affiche instantanément le cache local (Stale)
 * 🔄 Rafraîchit en arrière-plan depuis le serveur (Revalidate)
 * 🛡️ Résilience contre les sessions vides
 */
export function useSyncCache<T>(
  key: string, 
  initialData: T, 
  fetcher: () => Promise<T>,
  options: { 
    ttl?: number,
    refreshInterval?: number,
    enabled?: boolean
  } = {}
): {
  data: T
  isSyncing: boolean
  lastUpdated: number | null
  revalidate: () => Promise<void>
} {
  const { 
    ttl = DEFAULT_TTL, 
    refreshInterval = 0, 
    enabled = true 
  } = options

  // 1. Initial State: Synch-Only (No Flash)
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialData
    
    try {
      const stored = window.localStorage.getItem(key)
      if (!stored) return initialData
      
      const envelope = JSON.parse(stored) as CacheEnvelope<T>
      const isExpired = Date.now() - envelope.timestamp > ttl
      const versionMatch = envelope.version === CACHE_VERSION
      
      // Si on a des données valides, on les prend
      if (versionMatch && !isExpired) {
        return envelope.data
      }
      
      return initialData
    } catch (e) {
      return initialData
    }
  })

  const [isSyncing, setIsSyncing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const isFirstMount = useRef(true)
  const isFirstSync = useRef(true)
  const supabase = createClient()

  // 2. Revalidation (Background)
  const revalidate = useCallback(async (isManual = false) => {
    if (!enabled && !isManual) return // Ne pas forcer si désactivé
    
    setIsSyncing(true)
    try {
      // 🛡️ Double vérification de session avant de polluer le cache
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && !isManual) {
        // Si pas de session en arrière-plan, on ne fait rien pour ne pas écraser les données du serveur
        console.warn(`[SyncTracker] Skip sync for "${key}": No active session.`)
        return
      }

      const freshData = await fetcher()
      const hasActualData = state && Array.isArray(state) && state.length > 0
      const receivedEmpty = Array.isArray(freshData) && freshData.length === 0

      // 🔥 Protection Critique : Ne pas écraser les données par du vide lors du premier sync
      // si le navigateur n'a pas encore fini d'initialiser la session (ce qui renverrait [] via RLS)
      if (isFirstSync.current && hasActualData && receivedEmpty) {
        console.log(`[SyncTracker] Protection activée pour "${key}": Données serveur préservées.`)
        isFirstSync.current = false
        return
      }

      const envelope: CacheEnvelope<T> = {
        data: freshData,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }

      window.localStorage.setItem(key, JSON.stringify(envelope))
      setState(freshData)
      setLastUpdated(envelope.timestamp)
      isFirstSync.current = false
    } catch (error) {
      console.error(`[SyncCache Error] "${key}":`, error)
    } finally {
      setIsSyncing(false)
    }
  }, [key, fetcher, state])

  // 3. Mount + Polling Cycle
  useEffect(() => {
    if (!enabled) return

    if (isFirstMount.current) {
      revalidate()
      isFirstMount.current = false
    }

    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        if (!isSyncing) revalidate()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [revalidate, refreshInterval, isSyncing, enabled])

  return { data: state, isSyncing, lastUpdated, revalidate }
}
