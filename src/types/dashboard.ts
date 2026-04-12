import { Database } from './supabase'

export type QuoteStatus = 
  | Database['public']['Enums']['quote_status']
  | 'expired';

export type Client = Database['public']['Tables']['clients']['Row']

export type Profile = Omit<Database['public']['Tables']['profiles']['Row'], 'num_contacts' | 'annual_revenue' | 'notification_preferences'> & {
  num_contacts?: string | null
  annual_revenue?: string | null
  notification_preferences?: {
    quotes_viewed?: boolean
    quotes_accepted?: boolean
    payments_received?: boolean
    quotes_expired?: boolean
  } | null
}

export type QuoteItem = Database['public']['Tables']['quote_items']['Row']

export type Quote = Omit<Database['public']['Tables']['quotes']['Row'], 'status'> & {
  status: QuoteStatus
  clients: Client | null
  profiles?: Profile | null
  quote_items?: QuoteItem[] | null
  artisan_signature_url?: string | null
  client_signature_url?: string | null
}

export type QuoteNotification = Quote & {
  isRecentlyCreated?: boolean
}

export type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: Client | null
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
