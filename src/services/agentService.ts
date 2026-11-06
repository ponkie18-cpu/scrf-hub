import { supabase } from "@/integrations/supabase/client";

export interface AgentResponseData {
  insight: string;
  recommendation: string;
  urgencyLevel: "red" | "amber" | "green";
  relatedTools: string[];
  nextAction: string;
  _logId?: string;
}

export interface AgentRequestContext {
  currentDomain?: string;
  currentToolId?: string;
  toolResults?: Record<string, unknown>;
}

export interface ConversationMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  structuredData?: AgentResponseData;
  createdAt?: string;
}

export async function askAgent(
  message: string,
  context?: AgentRequestContext
): Promise<AgentResponseData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("You must be signed in to use the SCRF Agent.");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message, context }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Agent request failed (${response.status})`);
  }

  return response.json();
}

export async function streamAgentConversation(
  message: string,
  sessionId: string,
  conversationHistory: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onStructured: (data: AgentResponseData) => void,
  onDone: () => void,
  context?: AgentRequestContext
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("You must be signed in to use the SCRF Agent.");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        type: "conversation",
        message,
        sessionId,
        conversationHistory,
        context,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error(body.message || "You've used all your daily AI responses. Upgrade to Pro for unlimited access.");
    }
    if (response.status === 503) {
      throw new Error(body.message || "The SCRF Agent is temporarily unavailable. Please try again in a moment.");
    }
    throw new Error(body.message || body.error || `Agent request failed (${response.status})`);
  }

  if (!response.body) throw new Error("No response stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === "chunk" && parsed.text) {
          onChunk(parsed.text);
        } else if (parsed.type === "structured" && parsed.data) {
          onStructured(parsed.data);
        }
      } catch {
        // partial JSON, wait for more
      }
    }
  }

  onDone();
}

export async function askAgentConversation(
  message: string,
  sessionId: string,
  conversationHistory: { role: string; content: string }[],
  context?: AgentRequestContext
): Promise<AgentResponseData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("You must be signed in to use the SCRF Agent.");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        type: "conversation",
        message,
        sessionId,
        conversationHistory,
        context,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error(body.message || "You've used all your daily AI responses. Upgrade to Pro for unlimited access.");
    }
    if (response.status === 503) {
      throw new Error(body.message || "The SCRF Agent is temporarily unavailable. Please try again in a moment.");
    }
    throw new Error(body.message || body.error || `Agent request failed (${response.status})`);
  }

  return response.json();
}

export async function loadConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("agent_conversations")
    .select("id, role, content, structured_data, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load conversation:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    structuredData: row.structured_data as unknown as AgentResponseData | undefined,
    createdAt: row.created_at ?? undefined,
  }));
}

export async function getLatestSessionId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("agent_conversations")
    .select("session_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    // Check if the session is from today
    const { data: sessionMessages } = await supabase
      .from("agent_conversations")
      .select("created_at")
      .eq("session_id", data[0].session_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessionMessages && sessionMessages.length > 0) {
      const createdAt = sessionMessages[0].created_at;
      if (createdAt) {
        const lastMessageDate = new Date(createdAt);
        const today = new Date();
        if (lastMessageDate.toDateString() === today.toDateString()) {
          return data[0].session_id;
        }
      }
    }
  }
  return null;
}

// Tool ID to display name mapping
export const TOOL_LABELS: Record<string, { label: string; href: string }> = {
  spof: { label: "Find Your Biggest Vulnerability", href: "/operational-risk" },
  "process-doc": { label: "Process Doc Builder", href: "/operational-risk" },
  bia: { label: "BIA Lite", href: "/operational-risk" },
  "financial-health": { label: "Financial Health Scorecard", href: "/financial-risk" },
  "cashflow-stress": { label: "Test Your Business's Survival", href: "/financial-risk" },
  "compliance-motivation": { label: "Compliance Motivation", href: "/compliance-risk" },
  "contract-checker": { label: "Contract Risk Checker", href: "/compliance-risk" },
  "regulatory-tracker": { label: "Regulatory Tracker", href: "/compliance-risk" },
  "data-protection": { label: "Data Protection Audit", href: "/compliance-risk" },
  "cyber-scorecard": { label: "Cyber Resilience Scorecard", href: "/strategic-cyber-risk" },
  "horizon-scanner": { label: "Horizon Scanner", href: "/strategic-cyber-risk" },
  "incident-playbook": { label: "Incident Playbook", href: "/strategic-cyber-risk" },
  "risk-heatmap": { label: "Risk Heat Map", href: "/" },
  "risk-register": { label: "Risk Register", href: "/" },
  "bcp-builder": { label: "BCP Builder", href: "/" },
  "vendor-assessment": { label: "Vendor Assessment", href: "/" },
};
