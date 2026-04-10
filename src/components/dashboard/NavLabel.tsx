'use client'

import { useI18n } from '@/components/providers/LanguageProvider'

interface NavLabelProps {
  id: string
  fallback: string
}

export function NavLabel({ id, fallback }: NavLabelProps) {
  const { t } = useI18n()
  // Try to get translation, otherwise use fallback
  const translation = t(`sidebar.${id}`)
  return <>{translation !== `sidebar.${id}` ? translation : fallback}</>
}
