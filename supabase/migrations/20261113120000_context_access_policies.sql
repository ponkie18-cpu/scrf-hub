-- Review in staging before applying. No application data is removed.
BEGIN;

-- A profile's company is used to scope context. Ordinary users must not change
-- membership or self-promote via the otherwise editable profile row.
CREATE OR REPLACE FUNCTION public.protect_profile_authority()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin')
     AND (NEW.company_id IS DISTINCT FROM OLD.company_id
          OR NEW.role IS DISTINCT FROM OLD.role) THEN
    RAISE EXCEPTION 'Company membership and role require administrator approval';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_profile_authority_before_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_authority();

-- Signup's SECURITY DEFINER provisioning remains the profile creation path.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Admins provision profiles" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Knowledge publication and its approval workflow are privileged operations.
DROP POLICY IF EXISTS "Authenticated insert knowledge_corrections" ON public.knowledge_corrections;
DROP POLICY IF EXISTS "Authenticated update knowledge_corrections" ON public.knowledge_corrections;
CREATE POLICY "Admins insert knowledge corrections" ON public.knowledge_corrections
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update knowledge corrections" ON public.knowledge_corrections
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated insert system_prompt_updates" ON public.system_prompt_updates;
DROP POLICY IF EXISTS "Authenticated update system_prompt_updates" ON public.system_prompt_updates;
CREATE POLICY "Admins submit prompt updates" ON public.system_prompt_updates
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins approve prompt updates" ON public.system_prompt_updates
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS risk_assessments_context_latest_idx
  ON public.risk_assessments(user_id, domain, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS action_items_context_open_idx
  ON public.action_items(user_id, due_date, id) WHERE completed = false;
CREATE INDEX IF NOT EXISTS alerts_context_company_idx
  ON public.alerts(company_id, created_at DESC) WHERE dismissed = false;
COMMIT;