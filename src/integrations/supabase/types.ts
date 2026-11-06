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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          company_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          domain: string
          due_date: string | null
          id: string
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          domain: string
          due_date?: string | null
          id?: string
          priority?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          domain?: string
          due_date?: string | null
          id?: string
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_accuracy_logs: {
        Row: {
          context_fetch_latency_ms: number | null
          context_fields_fetched: number | null
          context_fields_total: number | null
          context_injection_success: boolean | null
          created_at: string
          grounding_used: boolean | null
          id: string
          model_used: string | null
          query_type: string | null
          response_latency_ms: number | null
          session_id: string | null
          total_tokens: number | null
          user_id: string
          user_rating: number | null
          validation_flags: Json | null
        }
        Insert: {
          context_fetch_latency_ms?: number | null
          context_fields_fetched?: number | null
          context_fields_total?: number | null
          context_injection_success?: boolean | null
          created_at?: string
          grounding_used?: boolean | null
          id?: string
          model_used?: string | null
          query_type?: string | null
          response_latency_ms?: number | null
          session_id?: string | null
          total_tokens?: number | null
          user_id: string
          user_rating?: number | null
          validation_flags?: Json | null
        }
        Update: {
          context_fetch_latency_ms?: number | null
          context_fields_fetched?: number | null
          context_fields_total?: number | null
          context_injection_success?: boolean | null
          created_at?: string
          grounding_used?: boolean | null
          id?: string
          model_used?: string | null
          query_type?: string | null
          response_latency_ms?: number | null
          session_id?: string | null
          total_tokens?: number | null
          user_id?: string
          user_rating?: number | null
          validation_flags?: Json | null
        }
        Relationships: []
      }
      agent_briefings: {
        Row: {
          briefing_text: string
          created_at: string | null
          domain_scores: Json | null
          id: string
          overdue_actions: number | null
          user_id: string
        }
        Insert: {
          briefing_text: string
          created_at?: string | null
          domain_scores?: Json | null
          id?: string
          overdue_actions?: number | null
          user_id: string
        }
        Update: {
          briefing_text?: string
          created_at?: string | null
          domain_scores?: Json | null
          id?: string
          overdue_actions?: number | null
          user_id?: string
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          structured_data: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id?: string
          structured_data?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          structured_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      agent_evaluations: {
        Row: {
          accuracy_score: number | null
          agent_response: string
          clarity_score: number | null
          eval_category: string
          eval_run_id: string
          evaluated_at: string | null
          evaluator_notes: string | null
          evaluator_type: string | null
          gemini_model_used: string | null
          generic_response: boolean | null
          grounding_score: number | null
          hallucination_detected: boolean | null
          id: string
          incorrect_sa_law: boolean | null
          overall_score: number | null
          question_id: string | null
          question_text: string
          response_latency_ms: number | null
          sa_context_score: number | null
          scope_score: number | null
          scope_violation: boolean | null
          tokens_used: number | null
          user_context_used: Json | null
        }
        Insert: {
          accuracy_score?: number | null
          agent_response: string
          clarity_score?: number | null
          eval_category: string
          eval_run_id: string
          evaluated_at?: string | null
          evaluator_notes?: string | null
          evaluator_type?: string | null
          gemini_model_used?: string | null
          generic_response?: boolean | null
          grounding_score?: number | null
          hallucination_detected?: boolean | null
          id?: string
          incorrect_sa_law?: boolean | null
          overall_score?: number | null
          question_id?: string | null
          question_text: string
          response_latency_ms?: number | null
          sa_context_score?: number | null
          scope_score?: number | null
          scope_violation?: boolean | null
          tokens_used?: number | null
          user_context_used?: Json | null
        }
        Update: {
          accuracy_score?: number | null
          agent_response?: string
          clarity_score?: number | null
          eval_category?: string
          eval_run_id?: string
          evaluated_at?: string | null
          evaluator_notes?: string | null
          evaluator_type?: string | null
          gemini_model_used?: string | null
          generic_response?: boolean | null
          grounding_score?: number | null
          hallucination_detected?: boolean | null
          id?: string
          incorrect_sa_law?: boolean | null
          overall_score?: number | null
          question_id?: string | null
          question_text?: string
          response_latency_ms?: number | null
          sa_context_score?: number | null
          scope_score?: number | null
          scope_violation?: boolean | null
          tokens_used?: number | null
          user_context_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_evaluations_eval_run_id_fkey"
            columns: ["eval_run_id"]
            isOneToOne: false
            referencedRelation: "eval_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_evaluations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "eval_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_base: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          corrected_statement: string
          correction_id: string | null
          domain: string
          id: string
          supporting_reference: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          corrected_statement: string
          correction_id?: string | null
          domain: string
          id?: string
          supporting_reference?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          corrected_statement?: string
          correction_id?: string | null
          domain?: string
          id?: string
          supporting_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_base_correction_id_fkey"
            columns: ["correction_id"]
            isOneToOne: false
            referencedRelation: "knowledge_corrections"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rate_limits: {
        Row: {
          call_count: number
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          call_count?: number
          created_at?: string
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          call_count?: number
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          company_id: string | null
          created_at: string
          dismissed: boolean | null
          domain: string | null
          id: string
          message: string | null
          priority: string | null
          snoozed_until: string | null
          title: string
          type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          dismissed?: boolean | null
          domain?: string | null
          id?: string
          message?: string | null
          priority?: string | null
          snoozed_until?: string | null
          title: string
          type?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          dismissed?: boolean | null
          domain?: string | null
          id?: string
          message?: string | null
          priority?: string | null
          snoozed_until?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          amount_rands: number | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          paystack_reference: string | null
          user_id: string
        }
        Insert: {
          amount_rands?: number | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          paystack_reference?: string | null
          user_id: string
        }
        Update: {
          amount_rands?: number | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          paystack_reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_failure_retries: {
        Row: {
          attempt_number: number
          attempted_at: string | null
          failure_reason: string | null
          id: string
          next_retry_at: string | null
          resolved: boolean | null
          subscription_id: string
          user_id: string
        }
        Insert: {
          attempt_number: number
          attempted_at?: string | null
          failure_reason?: string | null
          id?: string
          next_retry_at?: string | null
          resolved?: boolean | null
          subscription_id: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          attempted_at?: string | null
          failure_reason?: string | null
          id?: string
          next_retry_at?: string | null
          resolved?: boolean | null
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_failure_retries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          country: string | null
          created_at: string
          id: string
          industry: string
          legal_structure: string | null
          name: string
          operating_regions: string[] | null
          region: string | null
          revenue_band: string | null
          size: string
          subscription_expires_at: string | null
          subscription_features: Json | null
          subscription_tier: string
          updated_at: string
          years_operating: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string
          legal_structure?: string | null
          name: string
          operating_regions?: string[] | null
          region?: string | null
          revenue_band?: string | null
          size?: string
          subscription_expires_at?: string | null
          subscription_features?: Json | null
          subscription_tier?: string
          updated_at?: string
          years_operating?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string
          legal_structure?: string | null
          name?: string
          operating_regions?: string[] | null
          region?: string | null
          revenue_band?: string | null
          size?: string
          subscription_expires_at?: string | null
          subscription_features?: Json | null
          subscription_tier?: string
          updated_at?: string
          years_operating?: number | null
        }
        Relationships: []
      }
      compliance_log: {
        Row: {
          anonymised_ref: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          anonymised_ref: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          anonymised_ref?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      eval_baselines: {
        Row: {
          authored_by: string | null
          baseline_response: string
          baseline_score: number | null
          created_at: string | null
          domain_expert: string | null
          id: string
          question_id: string | null
        }
        Insert: {
          authored_by?: string | null
          baseline_response: string
          baseline_score?: number | null
          created_at?: string | null
          domain_expert?: string | null
          id?: string
          question_id?: string | null
        }
        Update: {
          authored_by?: string | null
          baseline_response?: string
          baseline_score?: number | null
          created_at?: string | null
          domain_expert?: string | null
          id?: string
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_baselines_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "eval_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_questions: {
        Row: {
          category: string
          created_at: string | null
          difficulty: string | null
          domain: string | null
          expected_behaviour: string
          id: string
          is_active: boolean | null
          question_text: string
          red_flags: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          expected_behaviour: string
          id?: string
          is_active?: boolean | null
          question_text: string
          red_flags?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          expected_behaviour?: string
          id?: string
          is_active?: boolean | null
          question_text?: string
          red_flags?: string[] | null
        }
        Relationships: []
      }
      eval_runs: {
        Row: {
          avg_accuracy: number | null
          avg_clarity: number | null
          avg_grounding: number | null
          avg_overall: number | null
          avg_sa_context: number | null
          avg_scope: number | null
          completed_at: string | null
          critical_flags: number | null
          id: string
          pass_threshold: number | null
          passed: boolean | null
          run_type: string | null
          started_at: string | null
          total_questions: number | null
          triggered_by: string | null
        }
        Insert: {
          avg_accuracy?: number | null
          avg_clarity?: number | null
          avg_grounding?: number | null
          avg_overall?: number | null
          avg_sa_context?: number | null
          avg_scope?: number | null
          completed_at?: string | null
          critical_flags?: number | null
          id?: string
          pass_threshold?: number | null
          passed?: boolean | null
          run_type?: string | null
          started_at?: string | null
          total_questions?: number | null
          triggered_by?: string | null
        }
        Update: {
          avg_accuracy?: number | null
          avg_clarity?: number | null
          avg_grounding?: number | null
          avg_overall?: number | null
          avg_sa_context?: number | null
          avg_scope?: number | null
          completed_at?: string | null
          critical_flags?: number | null
          id?: string
          pass_threshold?: number | null
          passed?: boolean | null
          run_type?: string | null
          started_at?: string | null
          total_questions?: number | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      expert_reviewers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          qualification: string
          registration_number: string | null
          regulatory_domain: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          qualification: string
          registration_number?: string | null
          regulatory_domain: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          qualification?: string
          registration_number?: string | null
          regulatory_domain?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expert_reviews: {
        Row: {
          accuracy_score: number | null
          completeness_score: number | null
          correct_answer_summary: string | null
          id: string
          is_advice_harmful: boolean | null
          is_advice_incomplete: boolean | null
          is_advice_misleading: boolean | null
          missing_content: string | null
          response_id: string
          review_status: string | null
          reviewed_at: string | null
          reviewer_domain: string
          reviewer_name: string
          reviewer_qualification: string
          sa_compliance_score: number | null
          sa_references_to_add: string[] | null
          sme_accessibility_score: number | null
          specific_errors: string | null
        }
        Insert: {
          accuracy_score?: number | null
          completeness_score?: number | null
          correct_answer_summary?: string | null
          id?: string
          is_advice_harmful?: boolean | null
          is_advice_incomplete?: boolean | null
          is_advice_misleading?: boolean | null
          missing_content?: string | null
          response_id: string
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_domain: string
          reviewer_name: string
          reviewer_qualification: string
          sa_compliance_score?: number | null
          sa_references_to_add?: string[] | null
          sme_accessibility_score?: number | null
          specific_errors?: string | null
        }
        Update: {
          accuracy_score?: number | null
          completeness_score?: number | null
          correct_answer_summary?: string | null
          id?: string
          is_advice_harmful?: boolean | null
          is_advice_incomplete?: boolean | null
          is_advice_misleading?: boolean | null
          missing_content?: string | null
          response_id?: string
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_domain?: string
          reviewer_name?: string
          reviewer_qualification?: string
          sa_compliance_score?: number | null
          sa_references_to_add?: string[] | null
          sme_accessibility_score?: number | null
          specific_errors?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_reviews_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "validation_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          additional_comments: string | null
          created_at: string
          ease_of_use: number | null
          email: string
          id: string
          improvement_suggestions: string | null
          most_useful_feature: string | null
          name: string | null
          overall_experience: number | null
          perceived_value: number | null
          tool_usefulness: number | null
          user_id: string | null
          would_recommend: boolean | null
        }
        Insert: {
          additional_comments?: string | null
          created_at?: string
          ease_of_use?: number | null
          email: string
          id?: string
          improvement_suggestions?: string | null
          most_useful_feature?: string | null
          name?: string | null
          overall_experience?: number | null
          perceived_value?: number | null
          tool_usefulness?: number | null
          user_id?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          additional_comments?: string | null
          created_at?: string
          ease_of_use?: number | null
          email?: string
          id?: string
          improvement_suggestions?: string | null
          most_useful_feature?: string | null
          name?: string | null
          overall_experience?: number | null
          perceived_value?: number | null
          tool_usefulness?: number | null
          user_id?: string | null
          would_recommend?: boolean | null
        }
        Relationships: []
      }
      industry_benchmarks: {
        Row: {
          business_size: string
          efficiency_median: number
          id: string
          industry_code: string
          liquidity_median: number
          preparedness_median: number
          profitability_median: number
          sample_size: number | null
          updated_at: string
        }
        Insert: {
          business_size?: string
          efficiency_median?: number
          id?: string
          industry_code: string
          liquidity_median?: number
          preparedness_median?: number
          profitability_median?: number
          sample_size?: number | null
          updated_at?: string
        }
        Update: {
          business_size?: string
          efficiency_median?: number
          id?: string
          industry_code?: string
          liquidity_median?: number
          preparedness_median?: number
          profitability_median?: number
          sample_size?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_corrections: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          applied_to_system_prompt: boolean | null
          corrected_statement: string
          correction_type: string | null
          domain: string
          id: string
          original_agent_statement: string
          review_id: string
          severity: string | null
          supporting_reference: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          applied_to_system_prompt?: boolean | null
          corrected_statement: string
          correction_type?: string | null
          domain: string
          id?: string
          original_agent_statement: string
          review_id: string
          severity?: string | null
          supporting_reference?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          applied_to_system_prompt?: boolean | null
          corrected_statement?: string
          correction_type?: string | null
          domain?: string
          id?: string
          original_agent_statement?: string
          review_id?: string
          severity?: string | null
          supporting_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_corrections_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "expert_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          company_id: string | null
          created_at: string
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_interactions: {
        Row: {
          commitments_honoured: string
          communication_score: number
          created_at: string
          id: string
          incident_notes: string | null
          interaction_date: string
          on_time: string
          partner_id: string
          user_id: string
        }
        Insert: {
          commitments_honoured?: string
          communication_score?: number
          created_at?: string
          id?: string
          incident_notes?: string | null
          interaction_date?: string
          on_time?: string
          partner_id: string
          user_id: string
        }
        Update: {
          commitments_honoured?: string
          communication_score?: number
          created_at?: string
          id?: string
          incident_notes?: string | null
          interaction_date?: string
          on_time?: string
          partner_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_interactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          contract_value_band: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          relationship_type: string
          reliability_score: number | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_value_band?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          relationship_type?: string
          reliability_score?: number | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_value_band?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          relationship_type?: string
          reliability_score?: number | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          paystack_status: string
          plan_code: string | null
          reference: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paystack_status: string
          plan_code?: string | null
          reference: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paystack_status?: string
          plan_code?: string | null
          reference?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          digest_frequency: string | null
          goals: string | null
          id: string
          industry_code: string | null
          jurisdiction: string | null
          last_login_at: string | null
          name: string | null
          notification_email: boolean | null
          notification_push: boolean | null
          risk_maturity_score: number | null
          role: string
          top_concerns: string[] | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          digest_frequency?: string | null
          goals?: string | null
          id: string
          industry_code?: string | null
          jurisdiction?: string | null
          last_login_at?: string | null
          name?: string | null
          notification_email?: boolean | null
          notification_push?: boolean | null
          risk_maturity_score?: number | null
          role?: string
          top_concerns?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          digest_frequency?: string | null
          goals?: string | null
          id?: string
          industry_code?: string | null
          jurisdiction?: string | null
          last_login_at?: string | null
          name?: string | null
          notification_email?: boolean | null
          notification_push?: boolean | null
          risk_maturity_score?: number | null
          role?: string
          top_concerns?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_accuracy_reports: {
        Row: {
          generated_at: string | null
          generated_by: string | null
          id: string
          quarter: string
          report_data: Json
        }
        Insert: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          quarter: string
          report_data?: Json
        }
        Update: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          quarter?: string
          report_data?: Json
        }
        Relationships: []
      }
      regulatory_updates: {
        Row: {
          ai_summary: string | null
          category: string
          created_at: string
          description: string
          effective_date: string | null
          id: string
          impact: string
          industries: string[]
          jurisdictions: string[]
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          description: string
          effective_date?: string | null
          id?: string
          impact?: string
          industries?: string[]
          jurisdictions?: string[]
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          description?: string
          effective_date?: string | null
          id?: string
          impact?: string
          industries?: string[]
          jurisdictions?: string[]
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      response_escalations: {
        Row: {
          created_at: string | null
          escalation_level: string
          id: string
          reason: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          response_id: string
          review_id: string
        }
        Insert: {
          created_at?: string | null
          escalation_level?: string
          id?: string
          reason: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_id: string
          review_id: string
        }
        Update: {
          created_at?: string | null
          escalation_level?: string
          id?: string
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_escalations_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "validation_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_escalations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "expert_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          assessment_data: Json | null
          company_id: string | null
          confidence: number | null
          created_at: string
          domain: string
          id: string
          insights: Json | null
          recommendations: Json | null
          score: number
          tool_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_data?: Json | null
          company_id?: string | null
          confidence?: number | null
          created_at?: string
          domain: string
          id?: string
          insights?: Json | null
          recommendations?: Json | null
          score: number
          tool_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_data?: Json | null
          company_id?: string | null
          confidence?: number | null
          created_at?: string
          domain?: string
          id?: string
          insights?: Json | null
          recommendations?: Json | null
          score?: number
          tool_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      score_history: {
        Row: {
          domain: string
          id: string
          recorded_at: string
          score: number
          user_id: string
        }
        Insert: {
          domain: string
          id?: string
          recorded_at?: string
          score: number
          user_id: string
        }
        Update: {
          domain?: string
          id?: string
          recorded_at?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      scoring_config: {
        Row: {
          category_weights: Json | null
          company_id: string | null
          created_at: string
          domain_weights: Json
          id: string
          industry_multipliers: Json | null
          recency_bias: number | null
          updated_at: string
        }
        Insert: {
          category_weights?: Json | null
          company_id?: string | null
          created_at?: string
          domain_weights?: Json
          id?: string
          industry_multipliers?: Json | null
          recency_bias?: number | null
          updated_at?: string
        }
        Update: {
          category_weights?: Json | null
          company_id?: string | null
          created_at?: string
          domain_weights?: Json
          id?: string
          industry_multipliers?: Json | null
          recency_bias?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          created_at: string | null
          id: string
          last_payment_date: string | null
          monthly_amount_rands: number | null
          next_billing_date: string | null
          payment_failure_count: number | null
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          plan_type: string
          subscription_end_date: string | null
          subscription_start_date: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          created_at?: string | null
          id?: string
          last_payment_date?: string | null
          monthly_amount_rands?: number | null
          next_billing_date?: string | null
          payment_failure_count?: number | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_type?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          created_at?: string | null
          id?: string
          last_payment_date?: string | null
          monthly_amount_rands?: number | null
          next_billing_date?: string | null
          payment_failure_count?: number | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_type?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_prompt_updates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          correction_id: string
          current_knowledge_snapshot: string | null
          id: string
          proposed_addition: string
          rejection_reason: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          correction_id: string
          current_knowledge_snapshot?: string | null
          id?: string
          proposed_addition: string
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          correction_id?: string
          current_knowledge_snapshot?: string | null
          id?: string
          proposed_addition?: string
          rejection_reason?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_prompt_updates_correction_id_fkey"
            columns: ["correction_id"]
            isOneToOne: false
            referencedRelation: "knowledge_corrections"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_definitions: {
        Row: {
          category: string
          complexity: string | null
          created_at: string
          description: string | null
          domain: string
          estimated_time: number | null
          icon: string | null
          id: string
          inputs: Json | null
          name: string
          outputs: Json | null
        }
        Insert: {
          category?: string
          complexity?: string | null
          created_at?: string
          description?: string | null
          domain: string
          estimated_time?: number | null
          icon?: string | null
          id: string
          inputs?: Json | null
          name: string
          outputs?: Json | null
        }
        Update: {
          category?: string
          complexity?: string | null
          created_at?: string
          description?: string | null
          domain?: string
          estimated_time?: number | null
          icon?: string | null
          id?: string
          inputs?: Json | null
          name?: string
          outputs?: Json | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          onboarding_completed: boolean
          quick_tools: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean
          quick_tools?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean
          quick_tools?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          last_payment_reference: string | null
          max_saves: number
          paystack_customer_code: string | null
          paystack_email_token: string | null
          paystack_subscription_code: string | null
          plan_code: string | null
          saves_used: number
          subscription_active: boolean
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          last_payment_reference?: string | null
          max_saves?: number
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan_code?: string | null
          saves_used?: number
          subscription_active?: boolean
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          last_payment_reference?: string | null
          max_saves?: number
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan_code?: string | null
          saves_used?: number
          subscription_active?: boolean
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      validation_metrics: {
        Row: {
          avg_accessibility_score: number | null
          avg_accuracy_score: number | null
          avg_completeness_score: number | null
          avg_compliance_score: number | null
          corrections_applied: number | null
          corrections_pending: number | null
          created_at: string | null
          domain: string
          harmful_count: number | null
          id: string
          misleading_count: number | null
          report_month: string
          total_reviews: number | null
        }
        Insert: {
          avg_accessibility_score?: number | null
          avg_accuracy_score?: number | null
          avg_completeness_score?: number | null
          avg_compliance_score?: number | null
          corrections_applied?: number | null
          corrections_pending?: number | null
          created_at?: string | null
          domain: string
          harmful_count?: number | null
          id?: string
          misleading_count?: number | null
          report_month: string
          total_reviews?: number | null
        }
        Update: {
          avg_accessibility_score?: number | null
          avg_accuracy_score?: number | null
          avg_completeness_score?: number | null
          avg_compliance_score?: number | null
          corrections_applied?: number | null
          corrections_pending?: number | null
          created_at?: string | null
          domain?: string
          harmful_count?: number | null
          id?: string
          misleading_count?: number | null
          report_month?: string
          total_reviews?: number | null
        }
        Relationships: []
      }
      validation_questions: {
        Row: {
          created_at: string | null
          difficulty: string | null
          domain: string
          expected_topic_coverage: string | null
          id: string
          is_active: boolean | null
          question_context: string | null
          question_text: string
          sa_law_references: string[] | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          domain: string
          expected_topic_coverage?: string | null
          id?: string
          is_active?: boolean | null
          question_context?: string | null
          question_text: string
          sa_law_references?: string[] | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          domain?: string
          expected_topic_coverage?: string | null
          id?: string
          is_active?: boolean | null
          question_context?: string | null
          question_text?: string
          sa_law_references?: string[] | null
        }
        Relationships: []
      }
      validation_responses: {
        Row: {
          agent_model_version: string | null
          agent_response: string
          id: string
          question_id: string
          response_generated_at: string | null
          user_context_used: Json | null
        }
        Insert: {
          agent_model_version?: string | null
          agent_response: string
          id?: string
          question_id: string
          response_generated_at?: string | null
          user_context_used?: Json | null
        }
        Update: {
          agent_model_version?: string | null
          agent_response?: string
          id?: string
          question_id?: string
          response_generated_at?: string | null
          user_context_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "validation_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "validation_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_paid_subscription: {
        Args: {
          _current_period_end: string
          _paystack_customer_code: string
          _paystack_subscription_code: string
          _plan_code: string
          _user_id: string
        }
        Returns: boolean
      }
      can_user_save: { Args: { _user_id: string }; Returns: boolean }
      deactivate_subscription: { Args: { _user_id: string }; Returns: boolean }
      get_user_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_saves_used: { Args: { _user_id: string }; Returns: boolean }
      insert_regulatory_notification: {
        Args: {
          _action_url?: string
          _message: string
          _title: string
          _urgency?: string
          _user_id: string
        }
        Returns: string
      }
      start_pro_trial: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_tier: "anonymous" | "free_registered" | "pro"
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
      app_role: ["admin", "moderator", "user"],
      subscription_tier: ["anonymous", "free_registered", "pro"],
    },
  },
} as const
