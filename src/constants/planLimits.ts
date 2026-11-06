/**
 * Subscription plan limits and configuration.
 * Single source of truth for tier-based feature gating.
 */

export const PLAN_LIMITS = {
  FREE: {
    maxSaves: 3,
    aiCallsPerDay: 10,
    maxConversationHistory: 20,
    maxActionItems: 50,
    maxPartners: 5,
  },
  PRO: {
    maxSaves: Infinity,
    aiCallsPerDay: Infinity,
    maxConversationHistory: 100,
    maxActionItems: Infinity,
    maxPartners: Infinity,
  },
} as const;

export const TRIAL_DURATION_DAYS = 30;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DASHBOARD_ACTIONS_LIMIT: 100,
  SCORE_HISTORY_LIMIT: 100,
  NOTIFICATIONS_LIMIT: 30,
  CONVERSATIONS_LIMIT: 50,
} as const;

export const CACHE_DURATIONS = {
  /** Stale-while-revalidate for dashboard queries (ms) */
  SWR_STALE_TIME: 30_000,
  /** Garbage collection time for React Query (ms) */
  GC_TIME: 5 * 60_000,
  /** Briefing cache window (hours) */
  BRIEFING_CACHE_HOURS: 6,
  /** Score history time decay threshold (days) */
  SCORE_DECAY_THRESHOLD_DAYS: 90,
} as const;
