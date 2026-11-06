-- Fix: Remove overly permissive INSERT policy on payment_history
-- Service role bypasses RLS, so no INSERT policy needed for edge functions
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payment_history;