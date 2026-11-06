import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { saveAssessmentAndActions, type SaveAssessmentParams, type AssessmentRecommendation } from "@/services/assessmentService";
import { useToast } from "@/hooks/use-toast";

interface UseAssessmentSaveOptions {
  onSuccess?: (assessmentId: string) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
  navigateToDashboard?: boolean;
}

/**
 * Hook for saving assessment results to the dashboard.
 * Provides state management for saving status and toast notifications.
 * 
 * Usage:
 * ```tsx
 * const { saveAssessment, isSaving, savedToDb } = useAssessmentSave();
 * 
 * // When tool is complete:
 * await saveAssessment({
 *   domain: "operational",
 *   toolId: "spof-finder",
 *   answers: { ... },
 *   score: 75,
 *   insights: ["..."],
 *   recommendations: [{ title: "...", priority: "high" }]
 * });
 * ```
 */
export function useAssessmentSave(options: UseAssessmentSaveOptions = {}) {
  const { onSuccess, onError, showToast = true, navigateToDashboard = false } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const saveAssessment = useCallback(async (params: SaveAssessmentParams) => {
    if (isSaving || savedToDb) return { success: false, error: "Already saving or saved" };

    setIsSaving(true);
    const result = await saveAssessmentAndActions(params);
    setIsSaving(false);

    if (result.success && result.assessmentId) {
      setSavedToDb(true);
      setAssessmentId(result.assessmentId);
      
      if (showToast) {
        toast({
          title: "Assessment saved",
          description: "Results added to your dashboard",
        });
      }
      
      onSuccess?.(result.assessmentId);
      
      if (navigateToDashboard) {
        navigate("/dashboard");
      }
    } else if (result.error) {
      if (showToast && result.error !== "Not authenticated") {
        toast({
          title: "Save failed",
          description: result.error,
          variant: "destructive",
        });
      }
      onError?.(result.error);
    }

    return result;
  }, [isSaving, savedToDb, toast, showToast, onSuccess, onError, navigateToDashboard, navigate]);

  const reset = useCallback(() => {
    setSavedToDb(false);
    setAssessmentId(null);
  }, []);

  return {
    saveAssessment,
    isSaving,
    savedToDb,
    assessmentId,
    reset,
  };
}

/**
 * Helper to build recommendations from identified issues.
 */
export function buildRecommendations(
  issues: Array<{ category: string; priority: "high" | "medium" | "low"; actionVerb?: string }>
): AssessmentRecommendation[] {
  return issues.map(issue => ({
    title: `${issue.actionVerb || "Address"} ${issue.category}`,
    priority: issue.priority,
    description: `Review and improve ${issue.category.toLowerCase()}`,
  }));
}
