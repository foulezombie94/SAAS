import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

const CACHE_VERSION = 'v1.1'
const DEFAULT_TTL = 1000 * 60 * 30 // 30 minutes

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
  const isFirstMount = useRef(true)
  const isFirstSync = useRef(true)
  const requestIdRef = useRef(0)
  
  // 🚀 REVALIDATE OPTIMISÉ (DEDUP + THROTTLE + ANTI-RACE)
  const revalidate = useCallback(async (isManual = false) => {
    if (!enabled && !isManual) return

    // 🛡️ THROTTLE : Empêche deux auto-revalidations sur la même clé en moins de 1s
    const now = Date.now()
    const lastFetch = lastFetchTimestamps.get(key) || 0
    if (!isManual && (now - lastFetch < 1000)) return

    // 🏆 ID monotonic pour éviter les Race Conditions
    const currentRequestId = ++requestIdRef.current
    
    setIsSyncing(true)

    try {
      let freshData: T

      // 🛡️ DÉDUPLICATION INTELLIGENTE : Si une requête pour cette clé est déjà en cours, on l'attend
      if (pendingRequests.has(key)) {
        console.log(`[SyncCache] Joining existing request for "${key}"`)
        freshData = await pendingRequests.get(key)
      } else {
        // Initialsation du fetch
        lastFetchTimestamps.set(key, now)
        const p = fetcher()
        pendingRequests.set(key, p)
        try {
          freshData = await p
        } finally {
          pendingRequests.delete(key)
        }
      }
      
      // 🛡️ ANTI-RACE : Si une requête plus récente a déjà abouti, on ignore celle-ci
      if (currentRequestId !== requestIdRef.current) return

      const receivedEmpty = Array.isArray(freshData) && freshData.length === 0
      const hasCachedData = Array.isArray(state) ? state.length > 0 : !!state

      // 🔥 PROTECTION RLS / SESSION UNIFIÉE
      // S'applique même aux requêtes partagées. On n'écrase jamais du cache avec du vide 
      // lors de la première tentative de synchro.
      if (isFirstSync.current && receivedEmpty && hasCachedData) {
        isFirstSync.current = false
        console.log(`[SyncCache] Guard triggered for "${key}" (Dedupped): keeping cached data.`)
        return
      }
      
      isFirstSync.current = false

      // 🟠 OPTIMISATION LOCALSTORAGE : Éviter les écritures CPU/IO inutiles
      const envelope: CacheEnvelope<T> = {
        data: freshData,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }

      if (typeof window !== 'undefined') {
        const envelopeStr = JSON.stringify(envelope)
        const previous = window.localStorage.getItem(key)
        if (previous !== envelopeStr) {
           window.localStorage.setItem(key, envelopeStr)
        }
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
  }, [key, fetcher, enabled, initialData]) // ✅ state retiré des deps pour casser la boucle

  // 3. Cycle de vie (Mount + Polling)
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
