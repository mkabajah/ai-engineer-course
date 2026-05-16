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
      ai_scores: {
        Row: {
          application_id: string
          created_at: string
          dimension: string
          id: string
          rationale: string | null
          score: number
        }
        Insert: {
          application_id: string
          created_at?: string
          dimension: string
          id?: string
          rationale?: string | null
          score: number
        }
        Update: {
          application_id?: string
          created_at?: string
          dimension?: string
          id?: string
          rationale?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string
          education_degree: string | null
          education_institution: string | null
          email: string
          employment_role: string | null
          employment_status: string | null
          english_level: number | null
          english_sample: string | null
          essay_curiosity: string | null
          essay_fit: string | null
          essay_shipping: string | null
          financial_ack: boolean | null
          full_name: string
          github_url: string | null
          graduation_year: number | null
          id: string
          languages: string | null
          linkedin_url: string | null
          llm_experience: boolean | null
          llm_experience_desc: string | null
          location_pref: string | null
          phone: string | null
          portfolio_url: string | null
          quiz_avg_time_seconds: number | null
          quiz_completed_at: string | null
          quiz_correct_count: number | null
          quiz_total_count: number | null
          stage: string
          status: string
          time_commitment_note: string | null
          time_commitment_ok: boolean | null
          total_score: number | null
          updated_at: string
          video_path: string | null
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          education_degree?: string | null
          education_institution?: string | null
          email: string
          employment_role?: string | null
          employment_status?: string | null
          english_level?: number | null
          english_sample?: string | null
          essay_curiosity?: string | null
          essay_fit?: string | null
          essay_shipping?: string | null
          financial_ack?: boolean | null
          full_name: string
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          languages?: string | null
          linkedin_url?: string | null
          llm_experience?: boolean | null
          llm_experience_desc?: string | null
          location_pref?: string | null
          phone?: string | null
          portfolio_url?: string | null
          quiz_avg_time_seconds?: number | null
          quiz_completed_at?: string | null
          quiz_correct_count?: number | null
          quiz_total_count?: number | null
          stage?: string
          status?: string
          time_commitment_note?: string | null
          time_commitment_ok?: boolean | null
          total_score?: number | null
          updated_at?: string
          video_path?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          education_degree?: string | null
          education_institution?: string | null
          email?: string
          employment_role?: string | null
          employment_status?: string | null
          english_level?: number | null
          english_sample?: string | null
          essay_curiosity?: string | null
          essay_fit?: string | null
          essay_shipping?: string | null
          financial_ack?: boolean | null
          full_name?: string
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          languages?: string | null
          linkedin_url?: string | null
          llm_experience?: boolean | null
          llm_experience_desc?: string | null
          location_pref?: string | null
          phone?: string | null
          portfolio_url?: string | null
          quiz_avg_time_seconds?: number | null
          quiz_completed_at?: string | null
          quiz_correct_count?: number | null
          quiz_total_count?: number | null
          stage?: string
          status?: string
          time_commitment_note?: string | null
          time_commitment_ok?: boolean | null
          total_score?: number | null
          updated_at?: string
          video_path?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          active: boolean
          choices: Json
          correct_index: number
          created_at: string
          id: string
          order_index: number
          question: string
          time_limit_seconds: number
        }
        Insert: {
          active?: boolean
          choices: Json
          correct_index: number
          created_at?: string
          id?: string
          order_index?: number
          question: string
          time_limit_seconds?: number
        }
        Update: {
          active?: boolean
          choices?: Json
          correct_index?: number
          created_at?: string
          id?: string
          order_index?: number
          question?: string
          time_limit_seconds?: number
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          application_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_index: number | null
          time_taken_seconds: number | null
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_index?: number | null
          time_taken_seconds?: number | null
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_index?: number | null
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
