-- Forward-only authorization fixes. Apply before deploying the updated agent.
-- No application rows are removed or rewritten by this migration.
BEGIN;

-- Entitlements are backend-owned. Keep client reads and existing signup provisioning.
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
REVOKE INSERT, UPDATE, DELETE ON public.user_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO service_role;

-- Defense in depth if client UPDATE privileges are accidentally restored later.
-- Invoker security is intentional: authorized SECURITY DEFINER RPCs run as their
-- trusted owner, whereas a direct authenticated UPDATE must never change this row.
CREATE OR REPLACE FUNCTION public.prevent_tier_self_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Subscription changes require an authorized backend operation'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Payment activation/cancellation is reserved to verified backend payment flows.
REVOKE ALL ON FUNCTION public.activate_paid_subscription(uuid,text,text,text,timestamptz)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deactivate_subscription(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_paid_subscription(uuid,text,text,text,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.deactivate_subscription(uuid) TO service_role;

-- Repair a missing legacy signup row without accepting caller-supplied identity,
-- tier, trial dates or limits. A repeated call cannot reset existing entitlements.
CREATE OR REPLACE FUNCTION public.ensure_own_subscription()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated account required' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_subscriptions(user_id, tier)
    VALUES (auth.uid(), 'free_registered') ON CONFLICT (user_id) DO NOTHING;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_own_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_own_subscription() TO authenticated;

-- Preserve the existing own-account trial/save APIs without permitting arbitrary
-- target users. Trial duration remains the currently shipped 14 days.
CREATE OR REPLACE FUNCTION public.start_pro_trial(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id) THEN
    RAISE EXCEPTION 'Own account required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.user_subscriptions
    SET trial_started_at = now(), trial_ends_at = now() + interval '14 days', updated_at = now()
    WHERE user_id = _user_id AND trial_started_at IS NULL;
  RETURN FOUND;
END;
$$;
CREATE OR REPLACE FUNCTION public.increment_saves_used(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id) THEN
    RAISE EXCEPTION 'Own account required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.user_subscriptions SET saves_used = saves_used + 1, updated_at = now()
    WHERE user_id = _user_id AND saves_used < max_saves AND tier <> 'pro'
      AND (trial_ends_at IS NULL OR trial_ends_at <= now());
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.start_pro_trial(uuid), public.increment_saves_used(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_pro_trial(uuid), public.increment_saves_used(uuid)
  TO authenticated, service_role;

-- Read-only SECURITY DEFINER helpers must not reveal another user's entitlements.
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id uuid)
RETURNS public.subscription_tier LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT CASE
    WHEN tier = 'pro' OR (tier = 'free_registered' AND trial_ends_at > now())
      THEN 'pro'::public.subscription_tier ELSE tier END
    FROM public.user_subscriptions WHERE user_id = _user_id
      AND (auth.uid() = _user_id OR auth.role() = 'service_role')),
    'anonymous'::public.subscription_tier)
$$;
CREATE OR REPLACE FUNCTION public.can_user_save(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT tier = 'pro'
    OR (tier = 'free_registered' AND trial_ends_at > now()) OR saves_used < max_saves
    FROM public.user_subscriptions WHERE user_id = _user_id
      AND (auth.uid() = _user_id OR auth.role() = 'service_role')), false)
$$;
REVOKE ALL ON FUNCTION public.get_user_tier(uuid), public.can_user_save(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tier(uuid), public.can_user_save(uuid)
  TO authenticated, service_role;

-- Server-generated assistant history must not be forgeable by a direct client.
-- Both user and assistant messages are already persisted by the authenticated
-- Edge Function using service_role. Existing rows are intentionally untouched.
ALTER TABLE public.agent_conversations ADD COLUMN server_verified boolean NOT NULL DEFAULT false;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.agent_conversations;
REVOKE INSERT, UPDATE ON public.agent_conversations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.agent_conversations TO authenticated;
GRANT SELECT, INSERT ON public.agent_conversations TO service_role;

-- Every chargeable agent mode reserves quota through this single atomic UPSERT.
-- Identity comes from the Edge Function's verified user; clients cannot call this
-- RPC or choose a tier/limit. Limits retain the existing 10/free, 999999/pro policy.
CREATE OR REPLACE FUNCTION public.reserve_agent_quota(_user_id uuid)
RETURNS TABLE(allowed boolean, remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  daily_limit integer;
  used integer;
  window_day timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR _user_id IS NULL THEN
    RAISE EXCEPTION 'Backend role required' USING ERRCODE = '42501';
  END IF;
  SELECT CASE WHEN s.tier = 'pro' OR s.trial_ends_at > now() THEN 999999 ELSE 10 END
    INTO daily_limit FROM public.user_subscriptions s WHERE s.user_id = _user_id;
  daily_limit := COALESCE(daily_limit, 10);
  INSERT INTO public.ai_rate_limits AS q(user_id, call_count, window_start)
    VALUES (_user_id, 1, window_day)
    ON CONFLICT (user_id) DO UPDATE
      SET call_count = CASE WHEN q.window_start < window_day THEN 1 ELSE q.call_count + 1 END,
          window_start = window_day
      WHERE q.window_start < window_day OR q.call_count < daily_limit
    RETURNING call_count INTO used;
  RETURN QUERY SELECT used IS NOT NULL,
    CASE WHEN used IS NULL THEN 0 ELSE GREATEST(0, daily_limit - used) END;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_agent_quota(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_agent_quota(uuid) TO service_role;
COMMIT;