// Types du schéma Supabase (format `supabase gen types typescript`).
// À régénérer après chaque migration.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Required extends keyof Row = never> = {
  Row: Row
  Insert: Partial<Row> & Pick<Row, Required>
  Update: Partial<Row>
  Relationships: {
    foreignKeyName: string
    columns: string[]
    isOneToOne: boolean
    referencedRelation: string
    referencedColumns: string[]
  }[]
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        { id: string; full_name: string; avatar_url: string | null; created_at: string; updated_at: string },
        'id'
      >
      organizations: Table<
        {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string | null
          tax_id: string | null
          logo_url: string | null
          default_currency: string
          default_tax_rate: number
          invoice_prefix: string
          next_invoice_number: number
          payment_terms_days: number
          payment_instructions: string | null
          footer_note: string | null
          created_at: string
          updated_at: string
        },
        'name'
      >
      organization_members: Table<
        { organization_id: string; user_id: string; role: string; created_at: string },
        'organization_id' | 'user_id'
      >
      clients: Table<
        {
          id: string
          organization_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string | null
          tax_id: string | null
          notes: string | null
          archived_at: string | null
          created_at: string
          updated_at: string
        },
        'organization_id' | 'name'
      >
      invoices: Table<
        {
          id: string
          organization_id: string
          client_id: string
          number: string | null
          status: string
          issue_date: string
          due_date: string
          currency: string
          discount_type: string | null
          discount_value: number
          subtotal: number
          tax_total: number
          discount_total: number
          total: number
          amount_paid: number
          notes: string | null
          terms: string | null
          public_token: string
          sent_at: string | null
          paid_at: string | null
          cancelled_at: string | null
          client_snapshot: Json | null
          company_snapshot: Json | null
          created_at: string
          updated_at: string
        },
        'organization_id' | 'client_id' | 'issue_date' | 'due_date' | 'currency'
      >
      invoice_items: Table<
        {
          id: string
          invoice_id: string
          position: number
          description: string
          quantity: number
          unit_price: number
          tax_rate: number
          line_total: number
          tax_amount: number
        },
        'invoice_id' | 'position' | 'description' | 'quantity' | 'unit_price' | 'line_total'
      >
      payments: Table<
        {
          id: string
          invoice_id: string
          amount: number
          paid_on: string
          method: string
          reference: string | null
          created_by: string | null
          created_at: string
        },
        'invoice_id' | 'amount' | 'paid_on' | 'method'
      >
      invoice_events: Table<
        {
          id: string
          invoice_id: string
          type: string
          actor_id: string | null
          payload: Json | null
          created_at: string
        },
        'invoice_id' | 'type'
      >
    }
    Views: { [_ in never]: never }
    Functions: {
      current_org_id: { Args: Record<string, never>; Returns: string }
      create_organization: { Args: { p: Json }; Returns: string }
      save_invoice: { Args: { p_id: string | null; p: Json }; Returns: string }
      send_invoice: { Args: { p_id: string }; Returns: string }
      cancel_invoice: { Args: { p_id: string }; Returns: undefined }
      add_payment: {
        Args: { p_invoice: string; p_amount: number; p_paid_on: string; p_method: string; p_reference?: string | null }
        Returns: string
      }
      get_public_invoice: { Args: { p_token: string }; Returns: Json }
      record_invoice_view: { Args: { p_token: string }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
