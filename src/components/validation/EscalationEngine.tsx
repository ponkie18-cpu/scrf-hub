import { supabase } from "@/integrations/supabase/client";

export interface EscalationResult {
  level: "critical" | "high" | "acceptable" | "below_threshold";
  reason: string;
  blocked: boolean;
}

export function evaluateReview(review: {
  accuracy_score: number;
  sa_compliance_score: number;
  completeness_score: number;
  sme_accessibility_score: number;
  is_advice_harmful: boolean;
  is_advice_misleading: boolean;
  is_advice_incomplete: boolean;
}): EscalationResult {
  // CRITICAL: block immediately
  if (review.is_advice_harmful) {
    return { level: "critical", reason: "Harmful advice detected — blocked immediately", blocked: true };
  }
  if (review.accuracy_score === 1) {
    return { level: "critical", reason: "Accuracy score = 1 — critical inaccuracy, blocked", blocked: true };
  }

  // HIGH: escalate to domain lead
  if (review.sa_compliance_score === 1) {
    return { level: "high", reason: "SA compliance score = 1 — escalated to domain lead", blocked: false };
  }
  if (review.is_advice_misleading) {
    return { level: "high", reason: "Misleading advice detected — escalated", blocked: false };
  }

  // ACCEPTABLE THRESHOLD: all scores ≥ 3, not harmful, not misleading
  const allScoresAbove3 =
    review.accuracy_score >= 3 &&
    review.sa_compliance_score >= 3 &&
    review.completeness_score >= 3 &&
    review.sme_accessibility_score >= 3;

  if (allScoresAbove3 && !review.is_advice_harmful && !review.is_advice_misleading) {
    return { level: "acceptable", reason: "Meets production threshold", blocked: false };
  }

  return {
    level: "below_threshold",
    reason: "Below acceptable threshold — flagged: 'This guidance is under expert review. Consult a qualified professional.'",
    blocked: false,
  };
}

export async function createEscalation(
  responseId: string,
  reviewId: string,
  result: EscalationResult
) {
  if (result.level === "critical" || result.level === "high") {
    await supabase.from("response_escalations" as any).insert({
      response_id: responseId,
      review_id: reviewId,
      escalation_level: result.level,
      reason: result.reason,
    });
  }
}

export async function autoCreateCorrections(
  reviewId: string,
  review: {
    specific_errors: string;
    missing_content: string;
    is_advice_harmful: boolean;
    accuracy_score: number;
    sa_compliance_score: number;
    reviewer_domain: string;
  }
) {
  const corrections: any[] = [];

  if (review.specific_errors?.trim()) {
    const severity = review.is_advice_harmful
      ? "critical"
      : review.accuracy_score <= 2
      ? "high"
      : "medium";

    corrections.push({
      review_id: reviewId,
      domain: review.reviewer_domain,
      correction_type: "factual_error",
      original_agent_statement: review.specific_errors.slice(0, 500),
      corrected_statement: "Pending expert correction",
      severity,
    });
  }

  if (review.missing_content?.trim()) {
    const severity = review.sa_compliance_score <= 2 ? "high" : "medium";

    corrections.push({
      review_id: reviewId,
      domain: review.reviewer_domain,
      correction_type: "missing_context",
      original_agent_statement: "Content omitted by agent",
      corrected_statement: review.missing_content.slice(0, 500),
      severity,
    });
  }

  if (corrections.length > 0) {
    await supabase.from("knowledge_corrections").insert(corrections as any);
  }

  return corrections.length;
}

export const SCORE_GUIDANCE = {
  accuracy: [
    "1 = Contains factually wrong information that could harm the business owner",
    "2 = Contains significant inaccuracies that could lead to wrong decisions",
    "3 = Mostly accurate with minor errors that don't affect the outcome",
    "4 = Accurate with only trivial issues or omissions",
    "5 = Completely accurate, could be used as reference material",
  ],
  sa_compliance: [
    "1 = Contradicts South African law or could cause legal liability",
    "2 = Misrepresents key legal requirements or thresholds",
    "3 = Generally compliant but misses some SA-specific nuances",
    "4 = Good SA law compliance with minor gaps",
    "5 = Fully aligned with current SA legislation and regulations",
  ],
  completeness: [
    "1 = Addresses less than 30% of what the question requires",
    "2 = Addresses some aspects but misses critical information",
    "3 = Covers the main points but lacks important details",
    "4 = Comprehensive with only minor gaps",
    "5 = Thoroughly addresses all aspects of the question",
  ],
  sme_accessibility: [
    "1 = Uses jargon/complexity that SME owners would not understand",
    "2 = Somewhat understandable but requires professional knowledge",
    "3 = Reasonably clear for an educated business owner",
    "4 = Clear and actionable for most SME owners",
    "5 = Exceptionally clear, any business owner could follow this guidance",
  ],
};
