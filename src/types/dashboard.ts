export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  site_address: string | null
  notes: string | null
  user_id: string
  created_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  // Ajouts cruciaux pour l'évolution
  tax_rate?: number 
  total_ht?: number
  total_ttc?: number
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced' | 'paid'

export interface Profile {
  id: string
  company_name: string | null
  full_name: string | null
  email: string
  address: string | null
  phone: string | null
  siret: string | null
  iban: string | null
  bic: string | null
  bank_name: string | null
  updated_at: string | null
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_user?: string | null
  smtp_pass?: string | null
  smtp_from?: string | null
}

export interface Quote {
  id: string
  number: string
  client_id: string | null
  status: QuoteStatus | null
  total_ht: number
  total_ttc: number
  signature_url: string | null
  stripe_session_id?: string | null
  user_id: string
  created_at: string
  updated_at?: string
  profiles?: Profile
  clients?: Client
  quote_items?: QuoteItem[]
  
  // Payment Tracking
  payment_method?: 'card' | 'virement' | string
  payment_details?: any
}
