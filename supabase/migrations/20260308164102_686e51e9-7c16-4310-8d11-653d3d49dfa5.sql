
CREATE OR REPLACE FUNCTION public.start_pro_trial(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_subscriptions 
  SET 
    trial_started_at = now(),
    trial_ends_at = now() + INTERVAL '14 days',
    updated_at = now()
  WHERE user_id = _user_id 
    AND trial_started_at IS NULL;
  RETURN FOUND;
END;
$function$;
