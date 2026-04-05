export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          site_address: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          site_address?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          site_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          tax_rate: number | null
          total_ht: number | null
          total_price: number | null
          total_ttc: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          tax_rate?: number | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          tax_rate?: number | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_id_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          due_date: string | null
          id: string
          number: string
          quote_id: string | null
          status: string | null
          stripe_session_id: string | null
          tax_rate: number | null
          total_ht: number | null
          total_ttc: number | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          number: string
          quote_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          tax_rate?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          number?: string
          quote_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          tax_rate?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          quantity: number | null
          quote_id: string
          tax_rate: number | null
          total_ht: number | null
          total_price: number | null
          total_ttc: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          quantity?: number | null
          quote_id: string
          tax_rate?: number | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          quantity?: number | null
          quote_id?: string
          tax_rate?: number | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          number: string
          signature_url: string | null
          status: string | null
          stripe_session_id: string | null
          tax_rate: number | null
          total_ht: number | null
          total_ttc: number | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          number: string
          signature_url?: string | null
          status?: string | null
          stripe_session_id?: string | null
          tax_rate?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          number?: string
          signature_url?: string | null
          status?: string | null
          stripe_session_id?: string | null
          tax_rate?: number | null
          total_ht?: number | null
          total_ttc?: number | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_quote_number: { Args: { p_user_id: string }; Returns: string }
    }
    Enums: {
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "invoiced"
        | "paid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
