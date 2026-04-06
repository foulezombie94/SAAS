import { useState, useEffect, useCallback, useRef } from 'react'

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

  // 2. Revalidation (Background)
  const revalidate = useCallback(async () => {
    if (!enabled) return // Ne pas forcer si désactivé
    
    setIsSyncing(true)
    try {
      const freshData = await fetcher()
      
      // PROTECTION "GOD TIER": 
      // Si on a déjà des données (Prop ou Cache) et qu'on reçoit du Vide au 1er sync
      // Il y a de fortes chances que ce soit une erreur de session client/serveur.
      // On n'écrase que s'il y a un changement réel ou apres confirmation session.
      const hasActualData = Array.isArray(state) ? state.length > 0 : !!state
      const receivedEmpty = Array.isArray(freshData) ? freshData.length === 0 : !freshData
      
      if (isFirstMount.current && hasActualData && receivedEmpty) {
        console.warn(`[SyncCache] "${key}" suspecté de Session-Race condition. Update ignoré.`)
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
    } catch (error) {
      console.error(`[SyncCache Error] "${key}":`, error)
    } finally {
      setIsSyncing(false)
    }
  }, [key, fetcher, options.enabled, state])

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
