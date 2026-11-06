import { createContext, useContext, useCallback, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { supabase } from "@/integrations/supabase/client";

export interface RiskAssessment {
  domain: string;
  score: number;
  updated_at: string;
}

export interface ActionItem {
  id: string;
  domain: string;
  title: string;
  description?: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
}

export interface ScoreHistory {
  domain: string;
  score: number;
  recorded_at: string;
}

export interface UserPreferences {
  quick_tools: string[];
  onboarding_completed: boolean;
}

export type DomainScores = Record<string, number | null>;

interface DashboardContextValue {
  assessments: RiskAssessment[];
  actionItems: ActionItem[];
  scoreHistory: ScoreHistory[];
  preferences: UserPreferences | null;
  isLoading: boolean;
  isStale: boolean;
  overallScore: number;
  pendingActions: number;
  domainScores: DomainScores;
  getDomainScore: (domain: string) => number | null;
  calculateStreak: () => number;
  getRelativeTime: (dateString: string) => string;
  refetchAll: () => void;
  handleActionComplete: () => void;
  handleQuickToolsUpdate: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// --- Data fetchers ---

const fetchPreferences = async (userId: string) => {
  const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
  return data;
};

const fetchAssessments = async (userId: string): Promise<RiskAssessment[]> => {
  const { data } = await supabase
    .from("risk_assessments")
    .select("domain, score, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  const latestByDomain: Record<string, RiskAssessment> = {};
  (data || []).forEach((a: RiskAssessment) => {
    if (!latestByDomain[a.domain]) latestByDomain[a.domain] = a;
  });
  return Object.values(latestByDomain);
};

const fetchActionItems = async (userId: string): Promise<ActionItem[]> => {
  const { data } = await supabase
    .from("action_items")
    .select("id, domain, title, description, priority, due_date, completed")
    .eq("user_id", userId)
    .order("due_date", { ascending: true })
    .limit(100);
  return (data || []) as ActionItem[];
};

const fetchScoreHistory = async (userId: string): Promise<ScoreHistory[]> => {
  const { data } = await supabase
    .from("score_history")
    .select("domain, score, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(100);
  return (data || []) as ScoreHistory[];
};

// --- Provider ---

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { loading: tierLoading } = useTierAccess();
  const queryClient = useQueryClient();

  const userId = user?.id;

  const { data: prefData, isLoading: prefLoading } = useQuery({
    queryKey: ["userPreferences", userId],
    queryFn: () => fetchPreferences(userId!),
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: assessments = [], isLoading: assessmentsLoading, dataUpdatedAt: assessmentsUpdatedAt } = useQuery({
    queryKey: ["riskAssessments", userId],
    queryFn: () => fetchAssessments(userId!),
    enabled: !!userId,
    staleTime: 10000,
  });

  const { data: actionItems = [], isLoading: actionsLoading, dataUpdatedAt: actionsUpdatedAt } = useQuery({
    queryKey: ["actionItems", userId],
    queryFn: () => fetchActionItems(userId!),
    enabled: !!userId,
    staleTime: 10000,
  });

  const { data: scoreHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["scoreHistory", userId],
    queryFn: () => fetchScoreHistory(userId!),
    enabled: !!userId,
    staleTime: 10000,
  });

  // Track data staleness — if data is >60s old, show indicator
  const oldestUpdate = Math.min(assessmentsUpdatedAt || Date.now(), actionsUpdatedAt || Date.now());
  const isStale = oldestUpdate > 0 && (Date.now() - oldestUpdate) > 60000;

  // Realtime invalidation
  const handleScoreUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["scoreHistory", userId] });
    queryClient.invalidateQueries({ queryKey: ["riskAssessments", userId] });
  }, [queryClient, userId]);

  const handleActionUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["actionItems", userId] });
  }, [queryClient, userId]);

  useRealtimeUpdates({ onScoreUpdate: handleScoreUpdate, onActionUpdate: handleActionUpdate });

  // Derived state
  const preferences: UserPreferences | null = prefData
    ? {
        quick_tools: (prefData.quick_tools as string[]) || ["spof", "cashflow", "contract", "cyber", "regulatory", "bia"],
        onboarding_completed: prefData.onboarding_completed,
      }
    : null;

  const getDomainScore = useCallback(
    (domain: string) => assessments.find((a) => a.domain === domain)?.score ?? null,
    [assessments]
  );

  const domainScores: DomainScores = {
    operational: getDomainScore("operational"),
    financial: getDomainScore("financial"),
    compliance: getDomainScore("compliance"),
    strategic: getDomainScore("strategic"),
  };

  const overallScore = assessments.length === 0 ? 0 : Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length);
  const pendingActions = actionItems.filter((a) => !a.completed).length;

  const calculateStreak = useCallback(() => {
    if (scoreHistory.length === 0) return 0;
    const dates = [...new Set(scoreHistory.map((h) => new Date(h.recorded_at).toDateString()))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toDateString()) streak++;
      else break;
    }
    return streak;
  }, [scoreHistory]);

  const getRelativeTime = useCallback((dateString: string) => {
    const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  }, []);

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["riskAssessments", userId] });
    queryClient.invalidateQueries({ queryKey: ["actionItems", userId] });
    queryClient.invalidateQueries({ queryKey: ["scoreHistory", userId] });
    queryClient.invalidateQueries({ queryKey: ["userPreferences", userId] });
  }, [queryClient, userId]);

  const handleActionComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["actionItems", userId] });
  }, [queryClient, userId]);

  const handleQuickToolsUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["userPreferences", userId] });
  }, [queryClient, userId]);

  const isLoading = prefLoading || assessmentsLoading || actionsLoading || historyLoading || tierLoading;

  return (
    <DashboardContext.Provider
      value={{
        assessments,
        actionItems,
        scoreHistory,
        preferences,
        isLoading,
        isStale,
        overallScore,
        pendingActions,
        domainScores,
        getDomainScore,
        calculateStreak,
        getRelativeTime,
        refetchAll,
        handleActionComplete,
        handleQuickToolsUpdate,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
