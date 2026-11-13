import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'anonymous' | 'free_registered' | 'pro';

interface TierFeatures {
  canAccessDashboard: boolean;
  canAccessFullDashboard: boolean;
  canSaveResults: boolean;
  canAccessAllTools: boolean;
  canTrackProgress: boolean;
  canViewBehavioralInsights: boolean;
  savesRemaining: number | 'unlimited';
  isOnTrial: boolean;
  trialEndsAt: Date | null;
}

interface TierAccessState {
  tier: SubscriptionTier;
  loading: boolean;
  features: TierFeatures;
  savesUsed: number;
  maxSaves: number;
  canSaveNow: boolean;
  incrementSave: () => Promise<boolean>;
  startTrial: () => Promise<boolean>;
  refetch: () => Promise<void>;
  trialExpired: boolean;
  subscriptionActive: boolean;
}

// Free tools that are accessible without Pro
export const FREE_TOOLS = ['spof-finder', 'compliance-motivation', 'financial-health-scorecard'];

// Tool display information
export const TOOL_INFO: Record<string, { name: string; domain: string; description: string }> = {
  'spof-finder': { 
    name: 'Find Your Biggest Vulnerability', 
    domain: 'operational',
    description: 'Identify the single point that could break your business in 10 minutes'
  },
  'compliance-motivation': { 
    name: 'Compliance Motivation Assessment', 
    domain: 'compliance',
    description: 'Understand what truly drives compliance behaviour in your team'
  },
  'financial-health-scorecard': { 
    name: 'Financial Health Scorecard', 
    domain: 'financial',
    description: 'Get clarity on your business\'s financial resilience in minutes'
  },
  'cashflow-stress-test': { 
    name: 'Test Your Business\'s Survival', 
    domain: 'financial',
    description: 'See if your cash flow can survive a bad month'
  },
  'process-doc-builder': { 
    name: 'Process Documentation Builder', 
    domain: 'operational',
    description: 'Capture critical knowledge before it walks out the door'
  },
  'bia-lite': { 
    name: 'Business Impact Analysis', 
    domain: 'operational',
    description: 'Know which processes to protect first'
  },
  'contract-risk-checker': { 
    name: 'Contract Risk Checker', 
    domain: 'compliance',
    description: 'Spot hidden liabilities before you sign'
  },
  'regulatory-tracker': { 
    name: 'Regulatory Tracker', 
    domain: 'compliance',
    description: 'Never be caught off-guard by changing rules'
  },
  'data-protection-audit': { 
    name: 'Data Protection Audit', 
    domain: 'compliance',
    description: 'Know exactly where you stand on privacy compliance'
  },
  'cyber-resilience-scorecard': { 
    name: 'Cyber Resilience Scorecard', 
    domain: 'strategic',
    description: 'Understand your digital security without the jargon'
  },
  'horizon-scanner': { 
    name: 'Horizon Scanner', 
    domain: 'strategic',
    description: 'See threats and opportunities before they arrive'
  },
  'incident-playbook': { 
    name: 'Incident Response Playbook Builder', 
    domain: 'strategic',
    description: 'Be ready to respond calmly when crisis hits'
  },
  'vendor-assessment': { 
    name: 'Vendor Risk Assessment', 
    domain: 'operational',
    description: 'Evaluate supplier reliability before they become a problem'
  },
  'nash-equilibrium-simulator': {
    name: 'Strategic Scenario Simulator',
    domain: 'strategic',
    description: 'Nash Equilibrium game theory analysis for competitive strategy'
  },
  'collaboration-risk-auditor': {
    name: 'Collaboration Risk Auditor',
    domain: 'strategic',
    description: 'Prisoner\'s Dilemma partnership analysis with defection risk scoring'
  },
  'market-entry-advisor': {
    name: 'Market Entry Advisor',
    domain: 'strategic',
    description: 'Game theory strategic positioning for market entry decisions'
  },
  'partner-reliability-tracker': {
    name: 'Partner Reliability Tracker',
    domain: 'strategic',
    description: 'Track partner reliability using repeated-interaction game theory'
  },
  'cognitive-bias-detector': {
    name: 'Know Your Risk Psychology',
    domain: 'compliance',
    description: 'Identify cognitive biases that affect your business decisions'
  },
  'pre-mortem-exercise': {
    name: 'Pre-Mortem Exercise',
    domain: 'strategic',
    description: 'Imagine future failure and work backward to prevent it'
  },
};

export function useTierAccess(): TierAccessState {
  const { user, loading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<{
    tier: SubscriptionTier;
    savesUsed: number;
    maxSaves: number;
    trialStartedAt: Date | null;
    trialEndsAt: Date | null;
    subscriptionActive: boolean;
    trialExpired: boolean;
    currentPeriodEnd: Date | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionData(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier, saves_used, max_saves, trial_started_at, trial_ends_at, subscription_active, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscriptionData({
          tier: 'free_registered',
          savesUsed: 0,
          maxSaves: 3,
          trialStartedAt: null,
          trialEndsAt: null,
          subscriptionActive: false,
          trialExpired: false,
          currentPeriodEnd: null,
        });
      } else if (data) {
        const isOnActiveTrial = data.trial_ends_at && new Date(data.trial_ends_at) > new Date();
        const trialExpired = data.trial_started_at != null && data.trial_ends_at != null && new Date(data.trial_ends_at) <= new Date();
        const isPaidActive = data.subscription_active && data.tier === 'pro';
        setSubscriptionData({
          tier: (isPaidActive || isOnActiveTrial) ? 'pro' : (data.tier as SubscriptionTier),
          savesUsed: data.saves_used,
          maxSaves: data.max_saves,
          trialStartedAt: data.trial_started_at ? new Date(data.trial_started_at) : null,
          trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
          subscriptionActive: data.subscription_active ?? false,
          trialExpired: trialExpired && !isPaidActive,
          currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
        });
      } else {
        const { error: insertError } = await supabase
          .rpc('ensure_own_subscription');
        
        if (!insertError) {
          setSubscriptionData({
            tier: 'free_registered',
            savesUsed: 0,
            maxSaves: 3,
            trialStartedAt: null,
            trialEndsAt: null,
            subscriptionActive: false,
            trialExpired: false,
            currentPeriodEnd: null,
          });
        }
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  const tier: SubscriptionTier = useMemo(() => {
    if (!user) return 'anonymous';
    if (!subscriptionData) return 'free_registered';
    return subscriptionData.tier;
  }, [user, subscriptionData]);

  const features: TierFeatures = useMemo(() => {
    const isPro = tier === 'pro';
    const isFreeRegistered = tier === 'free_registered';
    const isAnonymous = tier === 'anonymous';

    const savesRemaining = isPro 
      ? 'unlimited' 
      : (subscriptionData ? subscriptionData.maxSaves - subscriptionData.savesUsed : 0);

    return {
      canAccessDashboard: !isAnonymous,
      canAccessFullDashboard: isPro,
      canSaveResults: !isAnonymous && (isPro || (typeof savesRemaining === 'number' && savesRemaining > 0)),
      canAccessAllTools: isPro,
      canTrackProgress: isPro,
      canViewBehavioralInsights: isPro,
      savesRemaining,
      isOnTrial: subscriptionData?.trialEndsAt ? new Date(subscriptionData.trialEndsAt) > new Date() : false,
      trialEndsAt: subscriptionData?.trialEndsAt || null,
    };
  }, [tier, subscriptionData]);

  const canSaveNow = useMemo(() => {
    if (tier === 'pro') return true;
    if (tier === 'anonymous') return false;
    return subscriptionData ? subscriptionData.savesUsed < subscriptionData.maxSaves : false;
  }, [tier, subscriptionData]);

  const incrementSave = useCallback(async (): Promise<boolean> => {
    if (!user || tier === 'anonymous') return false;
    if (tier === 'pro') return true; // Pro users don't need to track saves

    try {
      const { data, error } = await supabase.rpc('increment_saves_used', { _user_id: user.id });
      if (!error && data === true) {
        await fetchSubscription();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user, tier, fetchSubscription]);

  const startTrial = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('start_pro_trial', { _user_id: user.id });
      if (!error && data === true) {
        // Reactively update local state immediately — no page reload needed
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        setSubscriptionData({
          tier: 'pro',
          savesUsed: subscriptionData?.savesUsed ?? 0,
          maxSaves: subscriptionData?.maxSaves ?? 3,
          trialStartedAt: now,
          trialEndsAt: trialEnd,
          subscriptionActive: false,
          trialExpired: false,
          currentPeriodEnd: null,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user, subscriptionData]);

  return {
    tier,
    loading: authLoading || loading,
    features,
    savesUsed: subscriptionData?.savesUsed ?? 0,
    maxSaves: subscriptionData?.maxSaves ?? 3,
    canSaveNow,
    incrementSave,
    startTrial,
    refetch: fetchSubscription,
    trialExpired: subscriptionData?.trialExpired ?? false,
    subscriptionActive: subscriptionData?.subscriptionActive ?? false,
  };
}

/**
 * Check if a tool is free (accessible to all tiers)
 */
export function isFreeTool(toolId: string): boolean {
  return FREE_TOOLS.includes(toolId);
}

/**
 * Check if a user can access a specific tool
 */
export function canAccessTool(tier: SubscriptionTier, toolId: string): boolean {
  if (tier === 'pro') return true;
  return isFreeTool(toolId);
}
