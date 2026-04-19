/**
 * UI PERSISTENCE ENGINE (Functional Cookies)
 * 
 * Manages user preferences like theme and sidebar state.
 */

export const UI_COOKIES = {
  THEME: 'af_theme',
  SIDEBAR_COLLAPSED: 'af_sidebar_collapsed',
}

/**
 * Sets a UI preference cookie (Client-side)
 */
export function setUIPreference(name: string, value: string) {
  if (typeof document === 'undefined') return
  
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`
}

/**
 * Gets a UI preference (Client-side)
 */
export function getUIPreference(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}
