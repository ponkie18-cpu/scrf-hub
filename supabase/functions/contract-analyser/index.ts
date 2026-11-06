import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
} from "../_shared/response.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("Missing authorization", 401, "AUTH_MISSING");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return createErrorResponse("Unauthorized", 401, "AUTH_INVALID");
    }

    const { contractText, maxClauses } = await req.json();

    if (!contractText || typeof contractText !== "string" || contractText.trim().length < 50) {
      return createErrorResponse("Contract text must be at least 50 characters.", 400, "VALIDATION_ERROR");
    }

    const truncatedText = contractText.slice(0, 60000);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return createErrorResponse("AI service not configured", 500, "CONFIG_ERROR");
    }

    const clauseLimit = maxClauses || 99;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a commercial contracts specialist advising SMEs. Analyse contracts and identify risks using structured tool calls. Be thorough but explain in plain English. Limit your analysis to the ${clauseLimit} most critical clauses.`,
          },
          {
            role: "user",
            content: `Analyse this contract for an SME and identify:
(a) High-risk clauses with plain-English explanation
(b) Missing standard protections (limitation of liability, IP ownership, termination rights)
(c) Unusual or one-sided terms
(d) Up to 3 recommended amendments with suggested replacement wording

Contract text:
${truncatedText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_contract_analysis",
              description: "Return structured contract clause analysis",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "2-3 sentence executive summary of the contract and its overall risk level" },
                  clauses: {
                    type: "array",
                    description: "List of identified clauses with risk assessment",
                    items: {
                      type: "object",
                      properties: {
                        clauseTitle: { type: "string" },
                        clauseText: { type: "string" },
                        riskLevel: { type: "string", enum: ["high", "medium", "low"] },
                        explanation: { type: "string" },
                        recommendation: { type: "string" },
                        category: { type: "string", enum: ["liability", "termination", "ip_ownership", "indemnification", "payment", "confidentiality", "data_protection", "dispute_resolution", "scope", "auto_renewal", "other"] },
                      },
                      required: ["clauseTitle", "clauseText", "riskLevel", "explanation", "recommendation", "category"],
                      additionalProperties: false,
                    },
                  },
                  missingProtections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        protection: { type: "string" },
                        importance: { type: "string", enum: ["critical", "important", "recommended"] },
                        suggestedWording: { type: "string" },
                      },
                      required: ["protection", "importance", "suggestedWording"],
                      additionalProperties: false,
                    },
                  },
                  amendments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        currentWording: { type: "string" },
                        suggestedWording: { type: "string" },
                        rationale: { type: "string" },
                      },
                      required: ["currentWording", "suggestedWording", "rationale"],
                      additionalProperties: false,
                    },
                  },
                  overallRisk: { type: "string", enum: ["high", "medium", "low"] },
                  overallScore: { type: "number", description: "Numeric risk score 0-100 where 100 is lowest risk" },
                },
                required: ["summary", "clauses", "missingProtections", "amendments", "overallRisk", "overallScore"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_contract_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return createErrorResponse("Rate limit exceeded. Please try again later.", 429, "RATE_LIMIT", true);
      }
      if (response.status === 402) {
        return createErrorResponse("AI credits exhausted.", 402, "CREDITS_EXHAUSTED");
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return createErrorResponse("AI analysis failed", 500, "AI_ERROR", true);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return createErrorResponse("AI did not return structured analysis", 500, "AI_PARSE_ERROR", true);
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    return createSuccessResponse({ analysis });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("contract-analyser error:", message);
    return createErrorResponse(message, 500, "INTERNAL_ERROR", true);
  }
});
