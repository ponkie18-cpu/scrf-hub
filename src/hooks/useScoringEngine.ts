import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DomainResult {
  score: number;
  confidence: number;
  breakdown: { category: string; score: number; weight: number; reasons: string[] }[];
  insights: string[];
  recommendations: { priority: string; action: string; estimatedTime: number; domain: string }[];
  overallScore?: number;
  assessmentId?: string;
}

interface DashboardData {
  overallScore: number;
  domains: Record<string, { score: number; trend: string; lastUpdated: string }>;
  trend: { direction: string; change: number };
  weeklyActivity: { date: string; assessments: number; actionsCompleted: number }[];
  actions: {
    critical: unknown[];
    highPriority: unknown[];
    upcoming: unknown[];
    recentlyCompleted: unknown[];
    stats: {
      total: number;
      completedThisWeek: number;
      overdue: number;
      completionRate: number;
    };
  };
  alerts: unknown[];
  unreadNotifications: number;
  scoreHistory: { domain: string; score: number; recorded_at: string }[];
}

export const useScoringEngine = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const calculateDomainScore = useCallback(async (
    domain: string,
    answers: Record<string, unknown>,
    toolId?: string
  ): Promise<DomainResult | null> => {
    setIsCalculating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scoring-engine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "calculate_domain",
            domain,
            answers,
            toolId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to calculate score");
      }

      const result: DomainResult = await response.json();
      
      toast({
        title: "Score Calculated",
        description: `Your ${domain} score is ${result.score}/100`,
      });

      return result;
    } catch (error) {
      console.error("Scoring engine error:", error);
      toast({
        title: "Calculation Error",
        description: error instanceof Error ? error.message : "Failed to calculate score",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [toast]);

  const getOverallScore = useCallback(async (): Promise<{ score: number; domains: Record<string, unknown> } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scoring-engine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ type: "calculate_overall" }),
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Failed to get overall score:", error);
      return null;
    }
  }, []);

  const getDashboardData = useCallback(async (): Promise<DashboardData | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scoring-engine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ type: "get_dashboard" }),
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Failed to get dashboard data:", error);
      return null;
    }
  }, []);

  return {
    calculateDomainScore,
    getOverallScore,
    getDashboardData,
    isCalculating,
  };
};