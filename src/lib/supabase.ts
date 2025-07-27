import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: 'startup' | 'amc_admin' | 'ima_admin'
          tokens_given: number
          tokens_consumed: number
          tokens_remaining: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role?: 'startup' | 'amc_admin' | 'ima_admin'
          tokens_given?: number
          tokens_consumed?: number
          tokens_remaining?: number
        }
        Update: {
          name?: string
          role?: 'startup' | 'amc_admin' | 'ima_admin'
          tokens_given?: number
          tokens_consumed?: number
          tokens_remaining?: number
        }
      }
      machine_types: {
        Row: {
          id: string
          name: string
          description: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string
        }
        Update: {
          name?: string
          description?: string
        }
      }
      machines: {
        Row: {
          id: string
          name: string
          machine_type_id: string
          status: 'available' | 'maintenance' | 'offline'
          custom_token_cost: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          machine_type_id: string
          status?: 'available' | 'maintenance' | 'offline'
          custom_token_cost?: number | null
        }
        Update: {
          name?: string
          machine_type_id?: string
          status?: 'available' | 'maintenance' | 'offline'
          custom_token_cost?: number | null
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          machine_id: string
          start_datetime: string
          end_datetime: string
          booking_type: 'weekly_planning' | 'same_week_exceptional' | 'monthly_provisional'
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          justification: string | null
          tokens_consumed: number
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          machine_id: string
          start_datetime: string
          end_datetime: string
          booking_type: 'weekly_planning' | 'same_week_exceptional' | 'monthly_provisional'
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          justification?: string | null
          tokens_consumed: number
          approved_by?: string | null
        }
        Update: {
          start_datetime?: string
          end_datetime?: string
          booking_type?: 'weekly_planning' | 'same_week_exceptional' | 'monthly_provisional'
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          justification?: string | null
          tokens_consumed?: number
          approved_by?: string | null
        }
      }
      availability_blocks: {
        Row: {
          id: string
          machine_id: string
          start_datetime: string
          end_datetime: string
          block_type: 'ima_internal' | 'maintenance' | 'training'
          created_by: string
          reason: string
          created_at: string
        }
        Insert: {
          machine_id: string
          start_datetime: string
          end_datetime: string
          block_type: 'ima_internal' | 'maintenance' | 'training'
          created_by: string
          reason: string
        }
        Update: {
          start_datetime?: string
          end_datetime?: string
          block_type?: 'ima_internal' | 'maintenance' | 'training'
          reason?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: 'create' | 'update' | 'delete'
          entity_type: 'machine' | 'machine_type' | 'user' | 'booking'
          entity_id: string
          description: string
          user_id: string | null
          user_name: string
          changes: any
          timestamp: string
        }
        Insert: {
          action: 'create' | 'update' | 'delete'
          entity_type: 'machine' | 'machine_type' | 'user' | 'booking'
          entity_id: string
          description: string
          user_name: string
          changes?: any
        }
        Update: never
      }
    }
  }
}