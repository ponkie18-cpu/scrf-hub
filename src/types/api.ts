/**
 * Shared API contract types for edge function requests/responses.
 * Mirrors the envelope defined in supabase/functions/_shared/response.ts.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: { timestamp: string; cached?: boolean };
}

export interface ApiErrorResponse {
  success: false;
  errorCode: string;
  message: string;
  retryable: boolean;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// --- Scoring engine ---

export interface DomainScoreRequest {
  type: "calculate_domain";
  domain: string;
  answers: Record<string, unknown>;
  toolId?: string;
}

export interface OverallScoreRequest {
  type: "calculate_overall";
}

export interface DashboardRequest {
  type: "get_dashboard";
}

export type ScoringEngineRequest = DomainScoreRequest | OverallScoreRequest | DashboardRequest;

// --- Contact email ---

export interface ContactEmailRequest {
  name: string;
  email: string;
  company: string;
  message: string;
}

// --- Feedback email ---

export interface FeedbackEmailRequest {
  name: string;
  email: string;
  overallExperience: number;
  toolUsefulness: number;
  perceivedValue: number;
  easeOfUse: number;
  mostUsefulFeature: string;
  improvementSuggestions: string;
  wouldRecommend: boolean;
  additionalComments: string;
}

// --- Advisor report ---

export interface AdvisorReportRequest {
  advisorEmail: string;
  advisorName?: string;
  personalMessage?: string;
  reportType: string;
  reportName: string;
  summaryData: {
    score?: number;
    highlights?: string[];
    recommendations?: string[];
    completedAt?: string;
  };
}

// --- Contract analyser ---

export interface ContractAnalyserRequest {
  contractText: string;
  maxClauses?: number;
}

// --- Agent ---

export interface AgentRequest {
  type?: string;
  message?: string;
  sessionId?: string;
  conversationHistory?: { role: string; content: string }[];
  context?: Record<string, unknown>;
}
