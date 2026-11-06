-- Performance indexes for scalability audit
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_created ON public.agent_conversations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_user_completed_priority ON public.action_items (user_id, completed, priority);
CREATE INDEX IF NOT EXISTS idx_action_items_pending_due ON public.action_items (user_id, due_date ASC) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_interactions_user_partner_date ON public.partner_interactions (user_id, partner_id, interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_domain_updated ON public.risk_assessments (user_id, domain, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_user_domain_recorded ON public.score_history (user_id, domain, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_code_size ON public.industry_benchmarks (industry_code, business_size);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_user ON public.ai_rate_limits (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON public.audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_briefings_user_created ON public.agent_briefings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles (company_id) WHERE company_id IS NOT NULL;