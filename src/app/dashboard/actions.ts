'use server'

import { checkLimits } from '@/lib/limits'

export async function getUsageLimits(table: 'clients' | 'quotes' | 'invoices') {
  try {
    return await checkLimits(table)
  } catch (error) {
    console.error('Error fetching usage limits:', error)
    return { allowed: false, count: 0, isPro: false }
  }
}
