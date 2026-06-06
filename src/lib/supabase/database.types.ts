export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      match_events: {
        Row: {
          assist: string | null
          comments: string | null
          created_at: string
          detail: string | null
          elapsed: number | null
          elapsed_extra: number | null
          id: string
          match_number: number
          player: string | null
          side: string | null
          signature: string
          sort_index: number
          type: string
        }
        Insert: {
          assist?: string | null
          comments?: string | null
          created_at?: string
          detail?: string | null
          elapsed?: number | null
          elapsed_extra?: number | null
          id?: string
          match_number: number
          player?: string | null
          side?: string | null
          signature: string
          sort_index?: number
          type: string
        }
        Update: {
          assist?: string | null
          comments?: string | null
          created_at?: string
          detail?: string | null
          elapsed?: number | null
          elapsed_extra?: number | null
          id?: string
          match_number?: number
          player?: string | null
          side?: string | null
          signature?: string
          sort_index?: number
          type?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          actual_a: number | null
          actual_b: number | null
          api_fixture_id: number | null
          api_home_is_a: boolean | null
          completed_at: string | null
          group: string | null
          kickoff_at: string
          live_away: number | null
          live_elapsed: number | null
          live_elapsed_extra: number | null
          live_home: number | null
          live_status: string | null
          live_updated_at: string | null
          match_number: number
          team_a: string
          team_b: string
        }
        Insert: {
          actual_a?: number | null
          actual_b?: number | null
          api_fixture_id?: number | null
          api_home_is_a?: boolean | null
          completed_at?: string | null
          group?: string | null
          kickoff_at: string
          live_away?: number | null
          live_elapsed?: number | null
          live_elapsed_extra?: number | null
          live_home?: number | null
          live_status?: string | null
          live_updated_at?: string | null
          match_number: number
          team_a: string
          team_b: string
        }
        Update: {
          actual_a?: number | null
          actual_b?: number | null
          api_fixture_id?: number | null
          api_home_is_a?: boolean | null
          completed_at?: string | null
          group?: string | null
          kickoff_at?: string
          live_away?: number | null
          live_elapsed?: number | null
          live_elapsed_extra?: number | null
          live_home?: number | null
          live_status?: string | null
          live_updated_at?: string | null
          match_number?: number
          team_a?: string
          team_b?: string
        }
        Relationships: []
      }
      players: {
        Row: { avatar_url: string | null; created_at: string; id: string; name: string }
        Insert: { avatar_url?: string | null; created_at?: string; id?: string; name: string }
        Update: { avatar_url?: string | null; created_at?: string; id?: string; name?: string }
        Relationships: []
      }
      predictions: {
        Row: { match_number: number; player_id: string; pred_a: number; pred_b: number }
        Insert: { match_number: number; player_id: string; pred_a: number; pred_b: number }
        Update: { match_number?: number; player_id?: string; pred_a?: number; pred_b?: number }
        Relationships: []
      }
      winners: {
        Row: { declared_at: string; player_id: string }
        Insert: { declared_at?: string; player_id: string }
        Update: { declared_at?: string; player_id?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
