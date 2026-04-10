import { seniorCache } from './hardened-cache'
import { DataService } from '@/services/data-service'

/**
 * 🛰️ CACHE LAYER (Level 18.5+)
 * 
 * Responsibility: Orchestrate caching policy for data fetchers.
 * Pattern: High-Scale Hybrid Tagging (Global + Scoped).
 */

/** 📊 DASHBOARD STATS */
export const getCachedDashboardStats = seniorCache(
  'dashboard-stats',
  DataService.fetchDashboardStats,
  { revalidate: 900, tags: ['dashboard-stats'] }
)

/** 👤 USER PROFILE */
export const getUserProfile = seniorCache(
  'user-profile',
  DataService.fetchUserProfile,
  { revalidate: 3600, tags: ['user-profile'] }
)

/** 📄 RECENT ACTIVITY */
export const getCachedRecentQuotes = seniorCache(
  'recent-activity',
  DataService.fetchRecentQuotes,
  { revalidate: 3600, tags: ['recent-activity'] }
)

/** 🧾 ALL INVOICES */
export const getCachedInvoices = seniorCache(
  'all-invoices',
  DataService.fetchInvoices,
  { revalidate: 3600, tags: ['all-invoices'] }
)

/** 📂 ALL QUOTES */
export const getCachedAllQuotes = seniorCache(
  'all-quotes',
  DataService.fetchAllQuotes,
  { revalidate: 3600, tags: ['all-quotes'] }
)

/** 👥 ALL CLIENTS */
export const getCachedClients = seniorCache(
  'all-clients',
  DataService.fetchClients,
  { revalidate: 3600, tags: ['all-clients'] }
)
