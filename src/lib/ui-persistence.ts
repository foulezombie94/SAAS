export const UI_COOKIES = {
  THEME: 'af_theme',
  SIDEBAR_COLLAPSED: 'af_sidebar_collapsed',
}

/**
 * Sets a UI preference cookie (Client-side)
 * 🛡️ HARDENING: Added encodeURIComponent, Secure flag, and SameSite=Lax
 */
export function setUIPreference(name: string, value: string) {
  if (typeof document === 'undefined') return
  
  const encodedValue = encodeURIComponent(value)
  // 🛡️ Always use Secure flag in production (or if HTTPS)
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  
  document.cookie = `${name}=${encodedValue}; path=/; max-age=31536000; SameSite=Lax${secure}`
}

/**
 * Gets a UI preference (Client-side)
 * 🛡️ HARDENING: Robust Regex parsing + decodeURIComponent
 */
export function getUIPreference(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  if (match) {
    return decodeURIComponent(match[2])
  }
  return null
}
