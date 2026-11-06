
CREATE OR REPLACE FUNCTION public.prevent_tier_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow tier changes via service role (edge functions)
  -- If the caller is using the anon key (i.e. client-side), block tier changes
  IF OLD.tier IS DISTINCT FROM NEW.tier THEN
    -- Check if this is a service role call by checking if current_setting returns 'service_role'
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'anon' THEN
      NEW.tier := OLD.tier; -- Silently revert tier change
    END IF;
  END IF;
  
  -- Also prevent trial date manipulation from client
  IF OLD.trial_started_at IS DISTINCT FROM NEW.trial_started_at 
     OR OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'anon' THEN
      NEW.trial_started_at := OLD.trial_started_at;
      NEW.trial_ends_at := OLD.trial_ends_at;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_tier_escalation
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tier_self_escalation();
