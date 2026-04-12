import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

const CACHE_VERSION = 'v1.4'
const DEFAULT_TTL = 1000 * 60 * 60 // 1 hour

interface CacheEnvelope<T> {
  data: T
  timestamp: number
  version: string
}

// 🏎️ DÉDUPLICATION GLOBALE (Niveau Module)
// Empêche plusieurs instances du hook de lancer la même requête simultanément.
const pendingRequests = new Map<string, Promise<any>>();
const lastFetchTimestamps = new Map<string, number>();

/**
 * Hook de Synchronisation "God Tier" (SWR-style)
 * 🏎️ Affiche instantanément le cache local (Stale)
 * 🔄 Rafraîchit en arrière-plan depuis le serveur (Revalidate)
 * 🛡️ Résilience contre les sessions vides & Double Fetch (Strict Mode)
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

  // 1. Initial State
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialData
    
    try {
      const stored = window.localStorage.getItem(key)
      if (!stored) return initialData
      
      const envelope = JSON.parse(stored) as CacheEnvelope<T>
      const isExpired = Date.now() - envelope.timestamp > ttl
      const versionMatch = envelope.version === CACHE_VERSION
      
      return (versionMatch && !isExpired) ? envelope.data : initialData
    } catch (e) {
      return initialData
    }
  })

  const [isSyncing, setIsSyncing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  
  // 🛡️ REFS DE STABILITÉ
  const isFirstMount = useRef(true)
  const isFirstSync = useRef(true)
  const requestIdRef = useRef(0)
  const stateRef = useRef(state)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync stateRef
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // 🚀 REVALIDATE IRONCLAD (DEDUP + RETRY + GAURD)
  const revalidate = useCallback(async (isManual = false) => {
    if (!enabled && !isManual) return

    const now = Date.now()
    const lastFetch = lastFetchTimestamps.get(key) || 0
    if (!isManual && (now - lastFetch < 1000)) return

    const currentRequestId = ++requestIdRef.current
    setIsSyncing(true)

    try {
      let freshData: T

      if (pendingRequests.has(key)) {
        freshData = await pendingRequests.get(key)
      } else {
        lastFetchTimestamps.set(key, now)
        const p = fetcher()
        pendingRequests.set(key, p)
        try {
          freshData = await p
        } finally {
          pendingRequests.delete(key)
        }
      }
      
      if (currentRequestId !== requestIdRef.current) return

      const receivedEmpty = Array.isArray(freshData) && freshData.length === 0
      const hasPreviousData = Array.isArray(stateRef.current) 
        ? (stateRef.current as any).length > 0 
        : !!stateRef.current

      // 🛡️ PROTECTION "ZERO-DATA" (Grade 10 Resilience)
      // Si on reçoit du vide alors qu'on avait des données, on suspecte une régression (RLS/Session)
      if (receivedEmpty && hasPreviousData) {
        if (isFirstSync.current) {
          console.warn(`[SyncCache] Suspected session race for "${key}". Retrying in 2s...`)
          if (!retryTimeoutRef.current) {
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null
              revalidate(true) 
            }, 2000) // Delay augmenté pour laisser Supabase se stabiliser
          }
          isFirstSync.current = false 
          return
        } else if (!isManual) {
          // En arrière-plan (polling/realtime), si on reçoit du vide après le premier sync 
          // alors qu'on avait des données, on IGNORE la mise à jour pour éviter le flash blanc.
          console.error(`[SyncCache Critical] Received empty data for "${key}" while state was non-empty. Ignoring update to prevent data loss.`)
          setIsSyncing(false)
          return
        }
      }
      
      isFirstSync.current = false

      const envelope: CacheEnvelope<T> = {
        data: freshData,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }

      const envelopeStr = JSON.stringify(envelope)
      const previous = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      
      if (previous !== envelopeStr && typeof window !== 'undefined') {
        window.localStorage.setItem(key, envelopeStr)
      }
      
      setState(freshData)
      setLastUpdated(envelope.timestamp)
    } catch (error) {
      console.error(`[SyncCache Error] "${key}":`, error)
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsSyncing(false)
      }
    }
  }, [key, fetcher, enabled]) // ✅ Propre

  // 3. Sync with Server Props (Essential for Next.js router.refresh())
  useEffect(() => {
    // Si les données initiales (venant du serveur) changent, on met à jour l'état local
    // Cela permet à router.refresh() de fonctionner correctement avec ce hook.
    if (initialData !== undefined && initialData !== null) {
      setState(initialData)
    }
  }, [initialData])

  // 4. Cycle de vie (Mount + Polling)
  useEffect(() => {
    if (!enabled) return

    if (isFirstMount.current) {
      revalidate()
      isFirstMount.current = false
    }

    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
           revalidate()
        }
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [revalidate, refreshInterval, enabled])

  return { data: state, isSyncing, lastUpdated, revalidate }
}
