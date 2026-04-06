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
 * 🛡️ Gère l'expiration et le versionnage
 */
export function useSyncCache<T>(
  key: string, 
  initialData: T, 
  fetcher: () => Promise<T>,
  options = { 
    ttl: DEFAULT_TTL,
    refreshInterval: 0 // 0 = Pas de polling par défaut
  }
): {
  data: T
  isSyncing: boolean
  lastUpdated: number | null
  revalidate: () => Promise<void>
} {
  // 1. Chargement initial du cache (Synchrone pour éviter le flash)
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialData
    
    try {
      const stored = window.localStorage.getItem(key)
      if (!stored) return initialData
      
      const envelope = JSON.parse(stored) as CacheEnvelope<T>
      
      // Validation du versionnage et de l'expiration
      const isExpired = Date.now() - envelope.timestamp > options.ttl
      const versionMatch = envelope.version === CACHE_VERSION
      
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

  // 2. Fonction de revalidation (Source de vérité Serveur)
  const revalidate = useCallback(async () => {
    setIsSyncing(true)
    try {
      const freshData = await fetcher()
      
      // Mise à jour de l'état et du cache atomique
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
  }, [key, fetcher])

  // 3. Effet de synchronisation automatique au montage + Polling
  useEffect(() => {
    if (isFirstMount.current) {
      revalidate()
      isFirstMount.current = false
    }

    if (options.refreshInterval > 0) {
      const interval = setInterval(() => {
        // On ne relance pas si une sync est déjà en cours
        if (!isSyncing) {
          revalidate()
        }
      }, options.refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [revalidate, options.refreshInterval, isSyncing])

  return { data: state, isSyncing, lastUpdated, revalidate }
}
