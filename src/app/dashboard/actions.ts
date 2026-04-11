'use server'

import { createClient } from '@/utils/supabase/server'
import { checkLimits } from '@/lib/limits'

export async function getUsageLimits(table: 'clients' | 'quotes' | 'invoices') {
  try {
    return await checkLimits(table)
  } catch (error) {
    console.error('Error fetching usage limits:', error)
    return { allowed: false, count: 0, isPro: false }
  }
}

export async function getDashboardActivity(days: number = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await (supabase as any).rpc('get_dashboard_activity', {
    p_user_id: user.id,
    p_days: days
  })

  if (error) {
    console.error('Error fetching dashboard activity:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    label: item.label,
    revenue: Number(item.revenue) || 0,
    full_date: item.full_date
  }))
}
