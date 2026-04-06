import { useState, useEffect } from 'react'

/**
 * Hook de "Safe Debounce"
 * 🏎️ Réduit la fréquence de mise à jour d'une valeur (ex: input de recherche)
 * ✨ Améliore les performances de filtrage sur les grands datasets
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
