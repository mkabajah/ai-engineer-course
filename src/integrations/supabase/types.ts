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
      challenge_submissions: {
        Row: {
          ai_confidence: string | null
          ai_review: string | null
          ai_score: number | null
          challenge_id: string
          created_at: string
          edit_token: string
          eval_status: string
          github_username: string
          id: string
          instructor_notes: string | null
          instructor_score: number | null
          link_type: string
          link_url: string
          merge_state: string | null
          participant_name: string
          repo_full_name: string | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: string | null
          ai_review?: string | null
          ai_score?: number | null
          challenge_id: string
          created_at?: string
          edit_token?: string
          eval_status?: string
          github_username: string
          id?: string
          instructor_notes?: string | null
          instructor_score?: number | null
          link_type: string
          link_url: string
          merge_state?: string | null
          participant_name: string
          repo_full_name?: string | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: string | null
          ai_review?: string | null
          ai_score?: number | null
          challenge_id?: string
          created_at?: string
          edit_token?: string
          eval_status?: string
          github_username?: string
          id?: string
          instructor_notes?: string | null
          instructor_score?: number | null
          link_type?: string
          link_url?: string
          merge_state?: string | null
          participant_name?: string
          repo_full_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          duration_minutes: number
          end_at: string | null
          goal: string | null
          id: string
          paused_at: string | null
          repos: Json
          slug: string
          start_at: string | null
          state: string
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          end_at?: string | null
          goal?: string | null
          id?: string
          paused_at?: string | null
          repos?: Json
          slug: string
          start_at?: string | null
          state?: string
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          end_at?: string | null
          goal?: string | null
          id?: string
          paused_at?: string | null
          repos?: Json
          slug?: string
          start_at?: string | null
          state?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          challenge_id: string
          created_at: string
          domain_scores: Json | null
          edit_token: string
          email: string
          id: string
          mcq_points: number | null
          participant_name: string
          passed: boolean | null
          status: string
          submitted_at: string | null
          task_feedback: Json | null
          task_points: number | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          challenge_id: string
          created_at?: string
          domain_scores?: Json | null
          edit_token?: string
          email: string
          id?: string
          mcq_points?: number | null
          participant_name: string
          passed?: boolean | null
          status?: string
          submitted_at?: string | null
          task_feedback?: Json | null
          task_points?: number | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          challenge_id?: string
          created_at?: string
          domain_scores?: Json | null
          edit_token?: string
          email?: string
          id?: string
          mcq_points?: number | null
          participant_name?: string
          passed?: boolean | null
          status?: string
          submitted_at?: string | null
          task_feedback?: Json | null
          task_points?: number | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          active: boolean
          choices: Json | null
          correct_answer: Json | null
          created_at: string
          domain: string
          exam_slug: string
          exhibit: string | null
          explanation: string
          id: string
          kind: string
          order_index: number
          points: number
          presentation: string | null
          prompt: string
          rubric: string | null
          scenario: string | null
          starter: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          choices?: Json | null
          correct_answer?: Json | null
          created_at?: string
          domain: string
          exam_slug: string
          exhibit?: string | null
          explanation?: string
          id: string
          kind: string
          order_index?: number
          points?: number
          presentation?: string | null
          prompt: string
          rubric?: string | null
          scenario?: string | null
          starter?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          choices?: Json | null
          correct_answer?: Json | null
          created_at?: string
          domain?: string
          exam_slug?: string
          exhibit?: string | null
          explanation?: string
          id?: string
          kind?: string
          order_index?: number
          points?: number
          presentation?: string | null
          prompt?: string
          rubric?: string | null
          scenario?: string | null
          starter?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_slug_fkey"
            columns: ["exam_slug"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["slug"]
          },
        ]
      }
      obp_adjustments: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          stage_id: number | null
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          stage_id?: number | null
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          stage_id?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_adjustments_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "obp_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obp_adjustments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_adjustments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_adjustments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_adjustments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_adjustments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_adjustments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_announcements: {
        Row: {
          created_at: string
          id: string
          kind: string
          message_md: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          message_md: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message_md?: string
        }
        Relationships: []
      }
      obp_auto_scores: {
        Row: {
          commit_sha: string | null
          rows: Json
          scored_at: string
          stage_id: number
          team_id: string
          total: number
        }
        Insert: {
          commit_sha?: string | null
          rows: Json
          scored_at?: string
          stage_id: number
          team_id: string
          total: number
        }
        Update: {
          commit_sha?: string | null
          rows?: Json
          scored_at?: string
          stage_id?: number
          team_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "obp_auto_scores_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "obp_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obp_auto_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_auto_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_auto_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_auto_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_auto_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_auto_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_badges: {
        Row: {
          description: string
          emoji: string
          id: string
          title: string
        }
        Insert: {
          description: string
          emoji: string
          id: string
          title: string
        }
        Update: {
          description?: string
          emoji?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      obp_challenge_rubrics: {
        Row: {
          auto_approve: boolean
          challenge_id: string
          max: number
          rubric_md: string
        }
        Insert: {
          auto_approve?: boolean
          challenge_id: string
          max: number
          rubric_md: string
        }
        Update: {
          auto_approve?: boolean
          challenge_id?: string
          max?: number
          rubric_md?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_challenge_rubrics_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: true
            referencedRelation: "obp_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_challenges: {
        Row: {
          description_md: string
          fields: Json
          id: string
          kind: string
          points_max: number
          repeatable: boolean
          sort_order: number
          stage_id: number
          title: string
          visible: boolean
        }
        Insert: {
          description_md: string
          fields?: Json
          id: string
          kind: string
          points_max?: number
          repeatable?: boolean
          sort_order?: number
          stage_id: number
          title: string
          visible?: boolean
        }
        Update: {
          description_md?: string
          fields?: Json
          id?: string
          kind?: string
          points_max?: number
          repeatable?: boolean
          sort_order?: number
          stage_id?: number
          title?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "obp_challenges_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "obp_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_exam_answers: {
        Row: {
          choice: Json
          flagged: boolean
          question_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          choice?: Json
          flagged?: boolean
          question_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          choice?: Json
          flagged?: boolean
          question_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obp_exam_answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_exam_attempts: {
        Row: {
          correct: number | null
          domain_results: Json | null
          ends_at: string
          passed: boolean | null
          question_order: Json
          scaled: number | null
          started_at: string
          submitted_at: string | null
          tab_switches: number
          team_id: string
          total: number | null
        }
        Insert: {
          correct?: number | null
          domain_results?: Json | null
          ends_at: string
          passed?: boolean | null
          question_order: Json
          scaled?: number | null
          started_at?: string
          submitted_at?: string | null
          tab_switches?: number
          team_id: string
          total?: number | null
        }
        Update: {
          correct?: number | null
          domain_results?: Json | null
          ends_at?: string
          passed?: boolean | null
          question_order?: Json
          scaled?: number | null
          started_at?: string
          submitted_at?: string | null
          tab_switches?: number
          team_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obp_exam_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_exam_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_exam_questions: {
        Row: {
          active: boolean
          code: string | null
          correct: Json
          domain: string
          domain_title: string
          explanation_md: string
          id: string
          kind: string
          options: Json
          prompt_md: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code?: string | null
          correct: Json
          domain: string
          domain_title: string
          explanation_md: string
          id: string
          kind: string
          options: Json
          prompt_md: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string | null
          correct?: Json
          domain?: string
          domain_title?: string
          explanation_md?: string
          id?: string
          kind?: string
          options?: Json
          prompt_md?: string
          sort_order?: number
        }
        Relationships: []
      }
      obp_first_blood_tests: {
        Row: {
          bonus: number
          label: string
          test_id: string
        }
        Insert: {
          bonus?: number
          label: string
          test_id: string
        }
        Update: {
          bonus?: number
          label?: string
          test_id?: string
        }
        Relationships: []
      }
      obp_hint_purchases: {
        Row: {
          created_at: string
          hint_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          hint_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          hint_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_hint_purchases_hint_id_fkey"
            columns: ["hint_id"]
            isOneToOne: false
            referencedRelation: "obp_hints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obp_hint_purchases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_hint_purchases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_hint_purchases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_hint_purchases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_hint_purchases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_hint_purchases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_hints: {
        Row: {
          body: string
          cost: number
          id: string
          stage_id: number
          title: string
        }
        Insert: {
          body: string
          cost: number
          id: string
          stage_id: number
          title: string
        }
        Update: {
          body?: string
          cost?: number
          id?: string
          stage_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_hints_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "obp_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_reports: {
        Row: {
          created_at: string
          id: string
          kind: string
          local_summary: Json | null
          note: Json | null
          snapshot_bytes: number | null
          snapshot_path: string | null
          snapshot_sha256: string | null
          status: string
          team_id: string
          verified_at: string | null
          verified_stage: number | null
          verified_total: number | null
          verify_error: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          local_summary?: Json | null
          note?: Json | null
          snapshot_bytes?: number | null
          snapshot_path?: string | null
          snapshot_sha256?: string | null
          status?: string
          team_id: string
          verified_at?: string | null
          verified_stage?: number | null
          verified_total?: number | null
          verify_error?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          local_summary?: Json | null
          note?: Json | null
          snapshot_bytes?: number | null
          snapshot_path?: string | null
          snapshot_sha256?: string | null
          status?: string
          team_id?: string
          verified_at?: string | null
          verified_stage?: number | null
          verified_total?: number | null
          verify_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obp_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_settings: {
        Row: {
          current_stage: number
          download_url: string | null
          event_code: string
          event_title: string
          exam_minutes: number
          exam_open: boolean
          exam_pass_scaled: number
          exam_points_per_correct: number
          exam_review_open: boolean
          frozen_at: string | null
          frozen_snapshot: Json | null
          id: number
          leaderboard_frozen: boolean
          registration_open: boolean
          updated_at: string
        }
        Insert: {
          current_stage?: number
          download_url?: string | null
          event_code?: string
          event_title?: string
          exam_minutes?: number
          exam_open?: boolean
          exam_pass_scaled?: number
          exam_points_per_correct?: number
          exam_review_open?: boolean
          frozen_at?: string | null
          frozen_snapshot?: Json | null
          id?: number
          leaderboard_frozen?: boolean
          registration_open?: boolean
          updated_at?: string
        }
        Update: {
          current_stage?: number
          download_url?: string | null
          event_code?: string
          event_title?: string
          exam_minutes?: number
          exam_open?: boolean
          exam_pass_scaled?: number
          exam_points_per_correct?: number
          exam_review_open?: boolean
          frozen_at?: string | null
          frozen_snapshot?: Json | null
          id?: number
          leaderboard_frozen?: boolean
          registration_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      obp_stages: {
        Row: {
          duration_minutes: number
          ends_at: string | null
          id: number
          position: number
          started_at: string | null
          status: string
          subtitle: string | null
          title: string
        }
        Insert: {
          duration_minutes: number
          ends_at?: string | null
          id: number
          position?: number
          started_at?: string | null
          status?: string
          subtitle?: string | null
          title: string
        }
        Update: {
          duration_minutes?: number
          ends_at?: string | null
          id?: number
          position?: number
          started_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      obp_submissions: {
        Row: {
          ai_feedback: Json | null
          ai_score: number | null
          ai_scored_at: string | null
          challenge_id: string
          created_at: string
          id: string
          payload: Json
          points_awarded: number
          reviewed_at: string | null
          reviewer_note: string | null
          status: string
          team_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          ai_score?: number | null
          ai_scored_at?: string | null
          challenge_id: string
          created_at?: string
          id?: string
          payload: Json
          points_awarded?: number
          reviewed_at?: string | null
          reviewer_note?: string | null
          status?: string
          team_id: string
        }
        Update: {
          ai_feedback?: Json | null
          ai_score?: number | null
          ai_scored_at?: string | null
          challenge_id?: string
          created_at?: string
          id?: string
          payload?: Json
          points_awarded?: number
          reviewed_at?: string | null
          reviewer_note?: string | null
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "obp_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obp_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_team_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          team_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          team_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_team_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "obp_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obp_team_badges_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_team_badges_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_team_badges_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_team_badges_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_team_badges_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_team_badges_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      obp_teams: {
        Row: {
          color: string
          created_at: string
          email: string | null
          emoji: string
          id: string
          join_code: string
          name: string
          registered_at: string | null
          token: string
        }
        Insert: {
          color?: string
          created_at?: string
          email?: string | null
          emoji?: string
          id?: string
          join_code: string
          name: string
          registered_at?: string | null
          token?: string
        }
        Update: {
          color?: string
          created_at?: string
          email?: string | null
          emoji?: string
          id?: string
          join_code?: string
          name?: string
          registered_at?: string | null
          token?: string
        }
        Relationships: []
      }
      obp_test_passes: {
        Row: {
          first_passed_at: string
          team_id: string
          test_id: string
        }
        Insert: {
          first_passed_at?: string
          team_id: string
          test_id: string
        }
        Update: {
          first_passed_at?: string
          team_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obp_test_passes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_board"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_test_passes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_exam_progress"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_test_passes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_first_bloods"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_test_passes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_leaderboard"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_test_passes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_reports_feed"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "obp_test_passes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "obp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          active: boolean
          choices: Json
          correct_index: number
          created_at: string
          id: string
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      obp_exam_board: {
        Row: {
          color: string | null
          correct: number | null
          emoji: string | null
          name: string | null
          passed: boolean | null
          scaled: number | null
          seconds_used: number | null
          submitted_at: string | null
          team_id: string | null
          total: number | null
        }
        Relationships: []
      }
      obp_exam_progress: {
        Row: {
          answered: number | null
          emoji: string | null
          ends_at: string | null
          flagged: number | null
          name: string | null
          passed: boolean | null
          scaled: number | null
          started_at: string | null
          submitted_at: string | null
          tab_switches: number | null
          team_id: string | null
          total: number | null
        }
        Relationships: []
      }
      obp_first_bloods: {
        Row: {
          bonus: number | null
          color: string | null
          emoji: string | null
          first_passed_at: string | null
          label: string | null
          name: string | null
          team_id: string | null
          test_id: string | null
        }
        Relationships: []
      }
      obp_leaderboard: {
        Row: {
          adjustment_points: number | null
          approved_count: number | null
          badges: Json | null
          challenge_points: number | null
          color: string | null
          emoji: string | null
          exam_points: number | null
          first_blood_points: number | null
          hidden_test_points: number | null
          hint_cost: number | null
          last_scored_at: string | null
          name: string | null
          score: number | null
          team_id: string | null
        }
        Relationships: []
      }
      obp_reports_feed: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string | null
          kind: string | null
          local_summary: Json | null
          name: string | null
          note: Json | null
          snapshot_bytes: number | null
          status: string | null
          team_id: string | null
          verified_stage: number | null
          verified_total: number | null
          verify_error: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      obp_buy_hint: {
        Args: { p_code: string; p_hint: string }
        Returns: string
      }
      obp_claim_pending_reports: { Args: { p_limit?: number }; Returns: Json }
      obp_exam_blur: { Args: { p_code: string }; Returns: undefined }
      obp_exam_extend: {
        Args: { p_minutes: number; p_team: string }
        Returns: undefined
      }
      obp_exam_finalize_all: { Args: { p_force?: boolean }; Returns: number }
      obp_exam_get: { Args: { p_code: string }; Returns: Json }
      obp_exam_grade: { Args: { p_team: string }; Returns: undefined }
      obp_exam_review: { Args: { p_code: string }; Returns: Json }
      obp_exam_save: {
        Args: {
          p_choice: Json
          p_code: string
          p_flagged: boolean
          p_question: string
        }
        Returns: string
      }
      obp_exam_start: { Args: { p_code: string }; Returns: Json }
      obp_exam_submit: { Args: { p_code: string }; Returns: Json }
      obp_extend_stage: {
        Args: { p_minutes: number; p_stage: number }
        Returns: undefined
      }
      obp_hint_shop: { Args: { p_code: string }; Returns: Json }
      obp_import_content: { Args: { p: Json }; Returns: Json }
      obp_my_dashboard: { Args: { p_code: string }; Returns: Json }
      obp_my_submissions: { Args: { p_code: string }; Returns: Json }
      obp_open_stage: { Args: { p_stage: number }; Returns: undefined }
      obp_publish_auto_score_team: {
        Args: {
          p_commit: string
          p_rows: Json
          p_stage: number
          p_team: string
          p_total: number
        }
        Returns: undefined
      }
      obp_publish_judged_score: {
        Args: {
          p_challenge: string
          p_note: string
          p_points: number
          p_team_code: string
        }
        Returns: string
      }
      obp_record_ai_verdict: {
        Args: {
          p_feedback: Json
          p_final: boolean
          p_note: string
          p_score: number
          p_submission: string
        }
        Returns: undefined
      }
      obp_record_report: {
        Args: {
          p_bytes: number
          p_kind: string
          p_local: Json
          p_note: Json
          p_path: string
          p_sha: string
          p_token: string
        }
        Returns: Json
      }
      obp_register_participant: {
        Args: { p_email: string; p_event_code: string; p_name: string }
        Returns: Json
      }
      obp_report_status: { Args: { p_token: string }; Returns: Json }
      obp_reset_event: { Args: never; Returns: undefined }
      obp_set_frozen: { Args: { p_frozen: boolean }; Returns: undefined }
      obp_submit_answer: {
        Args: { p_challenge: string; p_code: string; p_payload: Json }
        Returns: string
      }
      obp_team_by_code: { Args: { p_code: string }; Returns: Json }
      obp_team_by_token: { Args: { p_token: string }; Returns: Json }
      obp_team_id: { Args: { p_code: string }; Returns: string }
      obp_verify_report: {
        Args: {
          p_error: string
          p_report: string
          p_rows: Json
          p_stage: number
          p_total: number
        }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
