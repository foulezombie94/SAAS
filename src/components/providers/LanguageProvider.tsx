'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'fr' | 'en' | 'es'

interface LanguageContextType {
  language: Locale
  setLanguage: (lang: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Note: Translations are loaded dynamically to avoid bundling everything if not needed, 
// though for small dictionaries we can just import them.
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

const translations: Record<Locale, any> = { fr, en, es }

export function LanguageProvider({ children, initialLanguage }: { children: ReactNode, initialLanguage?: string }) {
  const [language, setLanguage] = useState<Locale>((initialLanguage as Locale) || 'fr')

  // Sync state if initialLanguage changes from server props
  useEffect(() => {
    if (initialLanguage && (initialLanguage === 'fr' || initialLanguage === 'en' || initialLanguage === 'es')) {
      setLanguage(initialLanguage as Locale)
    }
  }, [initialLanguage])

  const t = (key: string): string => {
    const keys = key.split('.')
    let result = translations[language]
    
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k]
      } else {
        // Fallback to English if key missing in current language
        let fallback = translations['en']
        for (const fk of keys) {
          if (fallback && fallback[fk]) {
            fallback = fallback[fk]
          } else {
            return key // Return the key itself as last resort
          }
        }
        return fallback 
      }
    }
    
    return typeof result === 'string' ? result : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within a LanguageProvider')
  }
  return context
}
