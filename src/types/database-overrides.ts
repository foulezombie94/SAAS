import { Database } from './supabase'

export type PaymentDetails = {
  method: 'card' | 'transfer' | 'cash';
  transaction_id?: string;
  paid_at?: string;
}

export type StrictQuote = Omit<Database['public']['Tables']['quotes']['Row'], 'payment_details'> & {
  payment_details: PaymentDetails | null;
}

export type StrictQuoteInsert = Omit<Database['public']['Tables']['quotes']['Insert'], 'payment_details'> & {
  payment_details?: PaymentDetails | null;
}

export type StrictQuoteUpdate = Omit<Database['public']['Tables']['quotes']['Update'], 'payment_details'> & {
  payment_details?: PaymentDetails | null;
}
