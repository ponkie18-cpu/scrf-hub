/**
 * Standardised edge-function response envelope.
 *
 * Success: { success: true, data: T, meta: { timestamp, cached? } }
 * Error:   { success: false, errorCode: string, message: string, retryable: boolean }
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export interface SuccessEnvelope<T = unknown> {
  success: true;
  data: T;
  meta: { timestamp: string; cached?: boolean };
}

export interface ErrorEnvelope {
  success: false;
  errorCode: string;
  message: string;
  retryable: boolean;
}

export function createSuccessResponse<T>(data: T, status = 200, cached = false): Response {
  const body: SuccessEnvelope<T> = {
    success: true,
    data,
    meta: { timestamp: new Date().toISOString(), cached },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function createErrorResponse(
  message: string,
  status = 500,
  errorCode = "INTERNAL_ERROR",
  retryable = false,
): Response {
  const body: ErrorEnvelope = { success: false, errorCode, message, retryable };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
