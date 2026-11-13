BEGIN;
ALTER TABLE public.agent_knowledge_base
  ADD COLUMN status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','retired')),
  ADD COLUMN revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  ADD COLUMN scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','company')),
  ADD COLUMN company_id uuid REFERENCES public.companies(id),
  ADD COLUMN jurisdiction text NOT NULL DEFAULT 'unknown',
  ADD COLUMN effective_from timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN effective_to timestamptz,
  ADD COLUMN review_due_at timestamptz,
  ADD COLUMN approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN supersedes_id uuid REFERENCES public.agent_knowledge_base(id),
  ADD COLUMN publication_id uuid UNIQUE REFERENCES public.system_prompt_updates(id),
  ADD CONSTRAINT knowledge_scope_consistent CHECK (
    (scope = 'global' AND company_id IS NULL) OR (scope = 'company' AND company_id IS NOT NULL)),
  ADD CONSTRAINT knowledge_validity_order CHECK (effective_to IS NULL OR effective_to > effective_from),
  ADD CONSTRAINT approved_knowledge_has_provenance CHECK (
    status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL
      AND supporting_reference IS NOT NULL AND length(trim(supporting_reference)) > 0
      AND jurisdiction ~ '^([A-Z]{2}|\*)$'));

-- Existing knowledge stays draft, regardless of its old 'applied' flag.
ALTER TABLE public.system_prompt_updates
  ADD COLUMN submitted_by_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN approved_by_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN domain_snapshot text,
  ADD COLUMN reference_snapshot text;

DROP POLICY IF EXISTS "Authenticated read agent_knowledge_base" ON public.agent_knowledge_base;
CREATE POLICY "Read eligible knowledge or administer" ON public.agent_knowledge_base
FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR (
    status = 'approved' AND effective_from <= now()
    AND (effective_to IS NULL OR effective_to > now())
    AND (review_due_at IS NULL OR review_due_at > now())
    AND (scope = 'global' OR company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()))
  )
);
-- Privileged RPCs below are the only publication writers. No direct authenticated writes.
DROP POLICY IF EXISTS "Admins submit prompt updates" ON public.system_prompt_updates;
DROP POLICY IF EXISTS "Admins approve prompt updates" ON public.system_prompt_updates;
DROP POLICY IF EXISTS "Authenticated read system_prompt_updates" ON public.system_prompt_updates;
CREATE POLICY "Admins read prompt updates" ON public.system_prompt_updates
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated read knowledge_corrections" ON public.knowledge_corrections;
CREATE POLICY "Admins read knowledge corrections" ON public.knowledge_corrections
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.submit_knowledge_correction(_correction_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.knowledge_corrections%ROWTYPE; update_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO STRICT c FROM public.knowledge_corrections WHERE id = _correction_id FOR UPDATE;
  IF c.supporting_reference IS NULL OR length(trim(c.supporting_reference)) = 0 THEN
    RAISE EXCEPTION 'A supporting reference is required';
  END IF;
  IF length(c.corrected_statement) > 8000 THEN RAISE EXCEPTION 'Correction is too long'; END IF;
  SELECT id INTO update_id FROM public.system_prompt_updates
    WHERE correction_id = c.id AND status = 'pending'
      AND submitted_by_user_id IS NOT NULL
      AND proposed_addition = c.corrected_statement
      AND reference_snapshot IS NOT DISTINCT FROM c.supporting_reference
      AND domain_snapshot = c.domain ORDER BY submitted_at DESC LIMIT 1;
  IF update_id IS NOT NULL THEN RETURN update_id; END IF;
  INSERT INTO public.system_prompt_updates
    (correction_id, proposed_addition, submitted_by, submitted_by_user_id, domain_snapshot, reference_snapshot)
  VALUES (c.id, c.corrected_statement, auth.uid()::text, auth.uid(), c.domain, c.supporting_reference)
  RETURNING id INTO update_id;
  RETURN update_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_knowledge_correction(
  _update_id uuid, _jurisdiction text, _review_due_at timestamptz
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u public.system_prompt_updates%ROWTYPE; c public.knowledge_corrections%ROWTYPE;
  previous public.agent_knowledge_base%ROWTYPE; knowledge_id uuid; correction_uuid uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator role required' USING ERRCODE = '42501';
  END IF;
  -- Always lock correction before proposal to keep submit/approve lock order consistent.
  SELECT correction_id INTO STRICT correction_uuid FROM public.system_prompt_updates WHERE id = _update_id;
  SELECT * INTO STRICT c FROM public.knowledge_corrections WHERE id = correction_uuid FOR UPDATE;
  SELECT * INTO STRICT u FROM public.system_prompt_updates WHERE id = _update_id FOR UPDATE;
  IF u.submitted_by_user_id IS NULL OR u.submitted_by_user_id = auth.uid() THEN
    RAISE EXCEPTION 'A different verified administrator must approve' USING ERRCODE = '42501';
  END IF;
  IF u.status = 'approved' THEN
    SELECT id INTO knowledge_id FROM public.agent_knowledge_base WHERE publication_id = u.id;
    IF knowledge_id IS NOT NULL THEN RETURN knowledge_id; END IF;
  END IF;
  IF u.status <> 'pending' THEN RAISE EXCEPTION 'Proposal is not pending'; END IF;
  IF _jurisdiction IS NULL OR _jurisdiction !~ '^([A-Z]{2}|\*)$'
    OR _review_due_at IS NULL OR _review_due_at <= now() THEN
    RAISE EXCEPTION 'Explicit jurisdiction and future review date required';
  END IF;
  IF u.proposed_addition IS DISTINCT FROM c.corrected_statement
    OR u.reference_snapshot IS DISTINCT FROM c.supporting_reference
    OR u.domain_snapshot IS DISTINCT FROM c.domain THEN
    RAISE EXCEPTION 'Correction changed since submission; resubmit for review';
  END IF;
  SELECT * INTO previous FROM public.agent_knowledge_base
    WHERE correction_id = c.id ORDER BY revision DESC, applied_at DESC LIMIT 1 FOR UPDATE;
  IF previous.status = 'approved' THEN
    UPDATE public.agent_knowledge_base SET status = 'retired' WHERE id = previous.id;
  END IF;
  INSERT INTO public.agent_knowledge_base
    (correction_id, domain, corrected_statement, supporting_reference, applied_by,
     status, revision, jurisdiction, review_due_at, approved_by, approved_at, supersedes_id, publication_id)
  VALUES (c.id, c.domain, c.corrected_statement, c.supporting_reference, auth.uid()::text,
    'approved', COALESCE(previous.revision, 0) + 1, _jurisdiction, _review_due_at, auth.uid(), now(), previous.id, u.id)
  RETURNING id INTO knowledge_id;
  UPDATE public.system_prompt_updates SET status = 'approved', approved_by = auth.uid()::text,
    approved_by_user_id = auth.uid(), approved_at = now() WHERE id = u.id;
  UPDATE public.knowledge_corrections SET applied_to_system_prompt = true,
    applied_by = auth.uid()::text, applied_at = now() WHERE id = c.id;
  UPDATE public.expert_reviews SET review_status = 'correction_applied' WHERE id = c.review_id;
  INSERT INTO public.audit_log(user_id, action, resource_type, resource_id, metadata)
    VALUES (auth.uid(), 'knowledge_correction_published', 'agent_knowledge_base', knowledge_id::text,
      jsonb_build_object('proposal_id', u.id, 'jurisdiction', _jurisdiction));
  RETURN knowledge_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_knowledge_correction(_update_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator role required' USING ERRCODE = '42501';
  END IF;
  IF length(trim(COALESCE(_reason, ''))) = 0 THEN RAISE EXCEPTION 'Rejection reason required'; END IF;
  UPDATE public.system_prompt_updates SET status = 'rejected', rejection_reason = _reason,
    approved_by = auth.uid()::text, approved_by_user_id = auth.uid(), approved_at = now()
    WHERE id = _update_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Pending proposal not found'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_knowledge_correction(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_knowledge_correction(uuid,text,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_knowledge_correction(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_knowledge_correction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_knowledge_correction(uuid,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_knowledge_correction(uuid,text) TO authenticated;

CREATE INDEX agent_knowledge_context_idx ON public.agent_knowledge_base
  (status, scope, company_id, jurisdiction, domain, effective_from DESC);
COMMIT;