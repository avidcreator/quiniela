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
      phase_one_match_events: {
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
        Relationships: [
          {
            foreignKeyName: "phase_one_match_events_match_number_fkey"
            columns: ["match_number"]
            isOneToOne: false
            referencedRelation: "phase_one_matches"
            referencedColumns: ["match_number"]
          },
        ]
      }
      phase_one_matches: {
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
      phase_one_players: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      phase_one_predictions: {
        Row: {
          match_number: number
          player_id: string
          pred_a: number
          pred_b: number
        }
        Insert: {
          match_number: number
          player_id: string
          pred_a: number
          pred_b: number
        }
        Update: {
          match_number?: number
          player_id?: string
          pred_a?: number
          pred_b?: number
        }
        Relationships: [
          {
            foreignKeyName: "phase_one_predictions_match_number_fkey"
            columns: ["match_number"]
            isOneToOne: false
            referencedRelation: "phase_one_matches"
            referencedColumns: ["match_number"]
          },
          {
            foreignKeyName: "phase_one_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "phase_one_players"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_one_winners: {
        Row: {
          declared_at: string
          player_id: string
        }
        Insert: {
          declared_at?: string
          player_id: string
        }
        Update: {
          declared_at?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_one_winners_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "phase_one_players"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_two_match_events: {
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
        Relationships: [
          {
            foreignKeyName: "phase_two_match_events_match_number_fkey"
            columns: ["match_number"]
            isOneToOne: false
            referencedRelation: "phase_two_matches"
            referencedColumns: ["match_number"]
          },
        ]
      }
      phase_two_matches: {
        Row: {
          actual_a: number | null
          actual_b: number | null
          api_fixture_id: number | null
          api_home_is_a: boolean | null
          completed_at: string | null
          final_a: number | null
          final_b: number | null
          kickoff_at: string
          live_away: number | null
          live_elapsed: number | null
          live_elapsed_extra: number | null
          live_home: number | null
          live_status: string | null
          live_updated_at: string | null
          match_number: number
          pen_a: number | null
          pen_b: number | null
          round: string
          team_a: string
          team_b: string
        }
        Insert: {
          actual_a?: number | null
          actual_b?: number | null
          api_fixture_id?: number | null
          api_home_is_a?: boolean | null
          completed_at?: string | null
          final_a?: number | null
          final_b?: number | null
          kickoff_at: string
          live_away?: number | null
          live_elapsed?: number | null
          live_elapsed_extra?: number | null
          live_home?: number | null
          live_status?: string | null
          live_updated_at?: string | null
          match_number: number
          pen_a?: number | null
          pen_b?: number | null
          round: string
          team_a: string
          team_b: string
        }
        Update: {
          actual_a?: number | null
          actual_b?: number | null
          api_fixture_id?: number | null
          api_home_is_a?: boolean | null
          completed_at?: string | null
          final_a?: number | null
          final_b?: number | null
          kickoff_at?: string
          live_away?: number | null
          live_elapsed?: number | null
          live_elapsed_extra?: number | null
          live_home?: number | null
          live_status?: string | null
          live_updated_at?: string | null
          match_number?: number
          pen_a?: number | null
          pen_b?: number | null
          round?: string
          team_a?: string
          team_b?: string
        }
        Relationships: []
      }
      phase_two_players: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      phase_two_predictions: {
        Row: {
          match_number: number
          player_id: string
          pred_a: number
          pred_b: number
        }
        Insert: {
          match_number: number
          player_id: string
          pred_a: number
          pred_b: number
        }
        Update: {
          match_number?: number
          player_id?: string
          pred_a?: number
          pred_b?: number
        }
        Relationships: [
          {
            foreignKeyName: "phase_two_predictions_match_number_fkey"
            columns: ["match_number"]
            isOneToOne: false
            referencedRelation: "phase_two_matches"
            referencedColumns: ["match_number"]
          },
          {
            foreignKeyName: "phase_two_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "phase_two_players"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_two_winners: {
        Row: {
          declared_at: string
          player_id: string
        }
        Insert: {
          declared_at?: string
          player_id: string
        }
        Update: {
          declared_at?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_two_winners_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "phase_two_players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
