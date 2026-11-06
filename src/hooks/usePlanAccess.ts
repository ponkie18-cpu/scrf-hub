import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface PlanAccess {
  isPro: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  isFree: boolean;
  daysRemaining: number | null;
  planType: string;
  nextBillingDate: string | null;
  paymentFailureCount: number;
  accessUntil: string | null;
  canActivateTrial: boolean;
  billingInterval: string | null;
  monthlyAmountRands: number | null;
  loading: boolean;
  refetch: () => Promise<void>;
  canAccessFeature: (featureName: string) => boolean;
}

// Features available per plan
const PRO_FEATURES = [
  'dashboard', 'full-dashboard', 'save-results', 'all-tools', 'track-progress',
  'behavioral-insights', 'ai-agent', 'pdf-export', 'unlimited-saves',
  'partner-tracker', 'audit-agent', 'game-theory',
];

const FREE_FEATURES = ['spof-finder', 'compliance-motivation', 'financial-health-scorecard'];

const REVALIDATION_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export function usePlanAccess(): PlanAccess {
  const { user, loading: authLoading } = useAuth();
  const [billingStatus, setBillingStatus] = useState<{
    planType: string;
    trialDaysRemaining: number | null;
    nextBillingDate: string | null;
    paymentFailureCount: number;
    accessUntil: string | null;
    canActivateTrial: boolean;
    billingInterval: string | null;
    monthlyAmountRands: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBillingStatus = useCallback(async () => {
    if (!user) {
      setBillingStatus(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-billing-status');

      if (error) {
        console.error('Billing status fetch error:', error);
        // Fallback to subscriptions table directly
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (sub) {
          const now = new Date();
          let trialDaysRemaining: number | null = null;
          if (sub.plan_type === 'trial' && sub.trial_end_date) {
            const diff = new Date(sub.trial_end_date).getTime() - now.getTime();
            trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
          }
          setBillingStatus({
            planType: sub.plan_type,
            trialDaysRemaining,
            nextBillingDate: sub.next_billing_date,
            paymentFailureCount: sub.payment_failure_count || 0,
            accessUntil: sub.subscription_end_date || sub.trial_end_date || null,
            canActivateTrial: !sub.trial_start_date,
            billingInterval: sub.billing_interval || null,
            monthlyAmountRands: sub.monthly_amount_rands || null,
          });
        }
      } else if (data?.success) {
        setBillingStatus({
          planType: data.planType,
          trialDaysRemaining: data.trialDaysRemaining,
          nextBillingDate: data.nextBillingDate,
          paymentFailureCount: data.paymentFailureCount,
          accessUntil: data.accessUntil,
          canActivateTrial: data.canActivateTrial,
          billingInterval: data.billingInterval,
          monthlyAmountRands: data.monthlyAmountRands,
        });
      }

      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Billing status error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (!authLoading) {
      fetchBillingStatus();
    }
  }, [authLoading, fetchBillingStatus]);

  // Re-validate every 15 minutes (CRITICAL requirement)
  useEffect(() => {
    if (!user) return;

    intervalRef.current = setInterval(() => {
      fetchBillingStatus();
    }, REVALIDATION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchBillingStatus]);

  // Also listen for realtime subscription changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBillingStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBillingStatus]);

  const planType = billingStatus?.planType || 'free';
  const isPro = planType === 'pro' || planType === 'trial';
  const isTrial = planType === 'trial';
  const isExpired = planType === 'expired';
  const isCancelled = planType === 'cancelled';
  const isFree = planType === 'free';

  // Cancelled users still have access until subscription_end_date
  const hasAccess = isPro || (isCancelled && billingStatus?.accessUntil && new Date(billingStatus.accessUntil) > new Date());

  const canAccessFeature = useCallback((featureName: string) => {
    if (hasAccess) return true;
    return FREE_FEATURES.includes(featureName);
  }, [hasAccess]);

  return {
    isPro: !!hasAccess,
    isTrial,
    isExpired,
    isCancelled,
    isFree,
    daysRemaining: billingStatus?.trialDaysRemaining ?? null,
    planType,
    nextBillingDate: billingStatus?.nextBillingDate ?? null,
    paymentFailureCount: billingStatus?.paymentFailureCount ?? 0,
    accessUntil: billingStatus?.accessUntil ?? null,
    canActivateTrial: billingStatus?.canActivateTrial ?? !user,
    billingInterval: billingStatus?.billingInterval ?? null,
    monthlyAmountRands: billingStatus?.monthlyAmountRands ?? null,
    loading: authLoading || loading,
    refetch: fetchBillingStatus,
    canAccessFeature,
  };
}
