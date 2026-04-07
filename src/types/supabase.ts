export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
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
      interventions: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          quote_id: string | null
          reminder_sent: boolean | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          quote_id?: string | null
          reminder_sent?: boolean | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          quote_id?: string | null
          reminder_sent?: boolean | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "invoice_items_invoice_id_fkey"
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
          status: Database["public"]["Enums"]["quote_status"] | null
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
          status?: Database["public"]["Enums"]["quote_status"] | null
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
          status?: Database["public"]["Enums"]["quote_status"] | null
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
          annual_revenue: string | null
          bank_name: string | null
          bic: string | null
          company_name: string | null
          current_period_end: string | null
          email: string
          first_name: string | null
          full_name: string | null
          iban: string | null
          id: string
          is_pro: boolean | null
          last_name: string | null
          num_contacts: string | null
          phone: string | null
          plan: string | null
          preferred_language: string | null
          siret: string | null
          smtp_from: string | null
          smtp_host: string | null
          smtp_pass: string | null
          smtp_port: number | null
          smtp_user: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_customer_id: string | null
          stripe_details_submitted: boolean | null
          stripe_subscription_id: string | null
          updated_at: string | null
          last_seen_notifications_at: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: string | null
          bank_name?: string | null
          bic?: string | null
          company_name?: string | null
          current_period_end?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          iban?: string | null
          id: string
          is_pro?: boolean | null
          last_name?: string | null
          num_contacts?: string | null
          phone?: string | null
          plan?: string | null
          preferred_language?: string | null
          siret?: string | null
          smtp_from?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_details_submitted?: boolean | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          last_seen_notifications_at?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: string | null
          bank_name?: string | null
          bic?: string | null
          company_name?: string | null
          current_period_end?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          iban?: string | null
          id?: string
          is_pro?: boolean | null
          last_name?: string | null
          num_contacts?: string | null
          phone?: string | null
          plan?: string | null
          preferred_language?: string | null
          siret?: string | null
          smtp_from?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_details_submitted?: boolean | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          last_seen_notifications_at?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          quantity: number
          quote_id: string
          tax_rate: number | null
          total_ht: number | null
          total_price: number | null
          total_ttc: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          quantity?: number
          quote_id: string
          tax_rate?: number | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          tax_rate?: number | null
          total_ht?: number | null
          total_price?: number | null
          total_ttc?: number | null
          unit_price?: number
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
          client_id: string
          created_at: string
          id: string
          number: string
          paid_at: string | null
          payment_details: Json | null
          payment_method: string | null
          public_token: string | null
          public_token_expires_at: string | null
          signature_url: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          stripe_session_id: string | null
          tax_rate: number
          total_ht: number
          total_ttc: number
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          number?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          public_token?: string | null
          public_token_expires_at?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          stripe_session_id?: string | null
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          number?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          public_token?: string | null
          public_token_expires_at?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          stripe_session_id?: string | null
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string | null
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
      webhook_logs: {
        Row: {
          created_at: string | null
          error: string | null
          event_type: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quote_v3:
        | {
            Args: {
              p_public_token: string
              p_quote_id: string
              p_signature_url: string
            }
            Returns: string
          }
        | {
            Args: {
              p_public_token: string
              p_quote_id: string
              p_signature_url: string
            }
            Returns: string
          }
      create_invoice_from_quote_v2: {
        Args: { p_quote_id: string }
        Returns: Json
      }
      create_quote_with_items: {
        Args: {
          p_client_id: string
          p_items: Json
          p_number: string
          p_status: Database["public"]["Enums"]["quote_status"]
          p_tax_rate: number
          p_total_ht: number
          p_total_ttc: number
        }
        Returns: Json
      }
      create_quote_with_items_v2:
        | {
            Args: {
              p_client_id: string
              p_items: Json
              p_payment_details?: Json
              p_payment_method?: string
              p_status: string
              p_tax_rate: number
              p_total_ht: number
              p_total_ttc: number
              p_user_id: string
              p_valid_until?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_client_id: string
              p_items: Json
              p_payment_details: Json
              p_payment_method: string
              p_status: string
              p_tax_rate: number
              p_total_ht: number
              p_total_ttc: number
              p_user_id: string
              p_valid_until: string
            }
            Returns: Json
          }
      create_quote_with_items_v3: {
        Args: {
          p_client_id: string
          p_items: Json
          p_payment_details?: Json
          p_payment_method?: string
          p_status: string
          p_tax_rate: number
          p_total_ht: number
          p_total_ttc: number
          p_valid_until?: string
        }
        Returns: string
      }
      get_dashboard_analytics: { Args: { p_user_id: string }; Returns: Json }
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
        | "overdue"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "invoiced",
        "paid",
        "overdue",
        "cancelled",
      ],
    },
  },
} as const
