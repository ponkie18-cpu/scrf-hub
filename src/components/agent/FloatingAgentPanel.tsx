import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BrainCircuit,
  X,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  streamAgentConversation,
  loadConversationHistory,
  getLatestSessionId,
  TOOL_LABELS,
  type ConversationMessage,
  type AgentResponseData,
} from "@/services/agentService";

const QUICK_CHIPS = [
  "What's my biggest risk today?",
  "Am I compliant?",
  "Run a cash flow stress check",
  "Explain my SPOF score",
];

const urgencyConfig = {
  red: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", label: "Critical" },
  amber: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", label: "Attention" },
  green: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", label: "On Track" },
};

function InlineAgentResponse({ data }: { data: AgentResponseData }) {
  const navigate = useNavigate();
  const config = urgencyConfig[data.urgencyLevel] || urgencyConfig.amber;
  const Icon = config.icon;

  return (
    <div className={`rounded-lg p-3 space-y-2 ${config.bg} ${config.border} border`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
      </div>
      <p className="text-sm leading-relaxed">{data.insight}</p>
      <div className="bg-background/50 rounded p-2">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">RECOMMENDATION</p>
        <p className="text-sm">{data.recommendation}</p>
      </div>
      <div className="flex items-start gap-1.5 text-sm">
        <ArrowRight className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
        <span className="font-medium">{data.nextAction}</span>
      </div>
      {data.relatedTools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.relatedTools.map((toolId) => {
            const tool = TOOL_LABELS[toolId];
            if (!tool) return null;
            return (
              <Button
                key={toolId}
                variant="outline"
                size="sm"
                className="text-[10px] h-6 gap-1 px-2"
                onClick={() => navigate(tool.href)}
              >
                <ExternalLink className="h-2.5 w-2.5" />
                {tool.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FloatingAgentPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Generate or load session
  useEffect(() => {
    if (!user || !isOpen) return;
    setIsInitializing(true);

    (async () => {
      try {
        const existingSession = await getLatestSessionId(user.id);
        if (existingSession) {
          setSessionId(existingSession);
          const history = await loadConversationHistory(existingSession);
          setMessages(history);
        } else {
          setSessionId(crypto.randomUUID());
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to init session:", e);
        setSessionId(crypto.randomUUID());
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [user, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading || !user) return;

    setInput("");
    setError(null);

    const userMessage: ConversationMessage = { role: "user", content: msg, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Add a placeholder assistant message for streaming
    const streamingMessage: ConversationMessage = {
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, streamingMessage]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.role === "assistant" ? (m.structuredData ? `${m.structuredData.insight} ${m.structuredData.recommendation}` : m.content) : m.content }));

      await streamAgentConversation(
        msg,
        sessionId,
        history,
        // onChunk — update the last message's content progressively
        (chunkText) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + chunkText };
            }
            return updated;
          });
        },
        // onStructured — replace the placeholder with the full structured response
        (data) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: data.insight, structuredData: data };
            }
            return updated;
          });
        },
        // onDone
        () => {
          setIsLoading(false);
        },
      );
    } catch (err) {
      // Remove the empty streaming placeholder on error
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1]?.structuredData) {
          updated.pop();
        }
        return updated;
      });
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      if (errMsg.includes("429") || errMsg.includes("rate_limit") || errMsg.includes("daily AI")) {
        setError("You've used all your daily AI responses. Upgrade to Pro for unlimited access.");
        setIsRateLimited(true);
      } else if (errMsg.includes("503") || errMsg.includes("unavailable")) {
        setError("The SCRF Agent is temporarily unavailable. Please try again in a moment.");
      } else {
        setError(errMsg);
      }
      setIsLoading(false);
    }
  }, [input, isLoading, user, messages, sessionId]);

  const handleNewSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setError(null);
    setIsRateLimited(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full bg-slate-900 shadow-lg shadow-slate-900/25 flex items-center justify-center hover:scale-105 transition-transform group"
          aria-label="Ask SCRF Agent"
        >
          <BrainCircuit className="h-5 w-5 md:h-6 md:w-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel — full-screen on mobile, floating card on desktop */}
      <div
        className={`fixed z-[60] transition-transform duration-300 ease-out
          inset-0 md:inset-auto
          md:bottom-6 md:right-6 md:h-[calc(100vh-3rem)] md:max-h-[700px] md:w-full md:max-w-md md:rounded-xl md:shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full bg-background md:border md:border-border md:rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <BrainCircuit className="h-4 w-4 text-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold">SCRF Agent</h3>
                <p className="text-[10px] text-slate-400">Virtual CFO • Cost Accountant • Auditor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={handleNewSession}
                title="New conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3" ref={scrollRef} role="log" aria-label="Conversation messages" aria-live="polite">
            <div className="space-y-3">
              {/* Empty state */}
              {messages.length === 0 && !isInitializing && (
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <BrainCircuit className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">How can I help you today?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      I have access to your risk scores, action items, and assessment history.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_CHIPS.map((chip) => (
                      <Button
                        key={chip}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleSend(chip)}
                      >
                        {chip}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {isInitializing && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Loading conversation…</span>
                </div>
              )}

              {/* Message list */}
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[92%] space-y-1">
                      {msg.structuredData ? (
                        <InlineAgentResponse data={msg.structuredData} />
                      ) : (
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2">
                          <p className="text-sm">{msg.content}{isLoading && i === messages.length - 1 && !msg.structuredData && <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle rounded-sm" />}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator — only show before first chunk arrives */}
              {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role !== "assistant") && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Error / rate-limit state */}
              {error && (
                <div className="flex justify-start">
                  <div className={`rounded-lg px-3 py-2 max-w-[85%] ${isRateLimited ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                    <p className={`text-sm ${isRateLimited ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{error}</p>
                    {isRateLimited && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs mt-2 h-7 border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => window.open('/settings', '_blank')}
                      >
                        Upgrade to Pro
                      </Button>
                    )}
                    {!isRateLimited && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs mt-1 h-6 text-red-600"
                        onClick={() => setError(null)}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick chips when conversation is active */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto shrink-0 border-t border-border/50">
              {QUICK_CHIPS.slice(0, 3).map((chip) => (
                <Button
                  key={chip}
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 shrink-0 text-muted-foreground"
                  onClick={() => handleSend(chip)}
                >
                  {chip}
                </Button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-border shrink-0 pb-safe">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your virtual CFO…"
                aria-label="Message to SCRF Agent"
                className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[40px] max-h-[100px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || isRateLimited}
              />
              <Button
                size="icon"
                className="shrink-0 h-10 w-10 bg-slate-900 hover:bg-slate-800 text-amber-400"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {/* Disclaimer footnote */}
            <p className="text-[9px] text-muted-foreground/60 mt-1.5 leading-tight px-1">
              SCRF Agent provides general guidance only. This does not constitute legal or financial advice. Consult qualified professionals for decisions specific to your jurisdiction. Tax advice is not within the scope of this platform. Any tax questions will be redirected to a qualified tax practitioner.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default FloatingAgentPanel;
