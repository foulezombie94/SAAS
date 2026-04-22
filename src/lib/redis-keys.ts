/**
 * 🗝️ REDIS KEY REGISTRY — Single source of truth
 * All Redis keys must be defined here to prevent naming inconsistencies.
 */
export const REDIS_KEYS = {
  /** User ban timestamp (ms epoch), set by auth webhook */
  userBan: (userId: string) => `artisan-flow:ban:${userId}`,

  /** IP-based block, set by security.ts on BOT event */
  ipBan: (ip: string) => `artisan-flow:blocked:ip:${ip}`,

  /** Email → userId mapping for ban recovery at login */
  emailToUser: (email: string) => `artisan-flow:email-to-user:${email}`,

  /** Prefix for all rate-limit keys */
  rateLimitPrefix: 'artisan-flow:ratelimit',
}
