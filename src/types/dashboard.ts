import { Database } from './supabase'

export type QuoteStatus = Database['public']['Enums']['quote_status']

export type Client = Database['public']['Tables']['clients']['Row']

export type Profile = Omit<Database['public']['Tables']['profiles']['Row'], 'num_contacts' | 'annual_revenue'> & {
  num_contacts?: string | number | null
  annual_revenue?: string | number | null
}

export type QuoteItem = Database['public']['Tables']['quote_items']['Row']

export type Quote = Database['public']['Tables']['quotes']['Row'] & {
  clients: { 
    name: string
    address?: string | null
    city?: string | null
    email?: string | null
    site_address?: string | null
    postal_code?: string | null
  } | null
  profiles?: Profile | null
  quote_items?: QuoteItem[] | null
}

export type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: { name: string } | null
}

export type ClientWithQuotes = Client & {
  quotes: (Database['public']['Tables']['quotes']['Row'])[]
}

export interface DashboardStats {
  revenue: number
  revenue_change: number
  unpaid: number
  unpaid_count: number
  acceptedCount: number
  quotes_change: number
  history: {
    month: string
    revenue: number
  }[]
}
