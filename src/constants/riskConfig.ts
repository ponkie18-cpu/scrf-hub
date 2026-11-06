/**
 * Risk scoring thresholds and configuration.
 * Single source of truth for all score-based UI decisions.
 */

export const RISK_THRESHOLDS = {
  CRITICAL: 30,
  HIGH: 50,
  MEDIUM: 70,
  GOOD: 85,
} as const;

export type RiskLevel = "critical" | "high" | "medium" | "low";

export function getRiskLevel(score: number): RiskLevel {
  if (score < RISK_THRESHOLDS.CRITICAL) return "critical";
  if (score < RISK_THRESHOLDS.HIGH) return "high";
  if (score < RISK_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  critical: "Critical",
  high: "High Risk",
  medium: "Medium",
  low: "Low Risk",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive" },
  high: { bg: "bg-amber-100 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500" },
  medium: { bg: "bg-yellow-100 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-500" },
  low: { bg: "bg-green-100 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-500" },
};

export const DOMAIN_CONFIG = {
  operational: { label: "Operational", weight: 0.25 },
  financial: { label: "Financial & Tax", weight: 0.25 },
  compliance: { label: "Compliance & Legal", weight: 0.25 },
  strategic: { label: "Strategic & Cyber", weight: 0.25 },
} as const;

export type RiskDomain = keyof typeof DOMAIN_CONFIG;

export const RISK_DOMAINS: RiskDomain[] = ["operational", "financial", "compliance", "strategic"];
