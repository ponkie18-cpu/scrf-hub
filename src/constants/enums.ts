/**
 * Application-wide enums and constant labels.
 */

export enum AuditSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFORMATIONAL = "informational",
}

export enum UrgencyLevel {
  RED = "red",
  AMBER = "amber",
  GREEN = "green",
}

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.RED]: "Immediate Action Required",
  [UrgencyLevel.AMBER]: "Needs Attention Soon",
  [UrgencyLevel.GREEN]: "On Track",
};

export const URGENCY_COLORS: Record<UrgencyLevel, { bg: string; text: string; icon: string }> = {
  [UrgencyLevel.RED]: { bg: "bg-destructive/10", text: "text-destructive", icon: "text-destructive" },
  [UrgencyLevel.AMBER]: { bg: "bg-amber-100 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: "text-amber-500" },
  [UrgencyLevel.GREEN]: { bg: "bg-green-100 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", icon: "text-green-500" },
};

export enum ActionPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export const PRIORITY_LABELS: Record<ActionPriority, string> = {
  [ActionPriority.HIGH]: "High Priority",
  [ActionPriority.MEDIUM]: "Medium Priority",
  [ActionPriority.LOW]: "Low Priority",
};
