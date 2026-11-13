-- The newer billing mirror is read by get-billing-status/usePlanAccess and must
-- be backend-owned just like user_subscriptions. Forward-only; no rows rewritten.
BEGIN;

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO service_role;

-- Defense in depth if a future migration accidentally restores UPDATE grants
-- and an owner policy. Verified service-role billing and signup RPCs still work.
CREATE OR REPLACE FUNCTION public.protect_billing_subscription_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Billing changes require an authorized backend operation'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_billing_subscription_authority_before_update
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.protect_billing_subscription_authority();

COMMIT;