import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, ArrowRight, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function DailyBriefing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [briefingText, setBriefingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [timestamp, setTimestamp] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamBriefing = useCallback(async () => {
    if (!user) return;

    // Check if we already have a briefing from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: existing } = await supabase
      .from("agent_briefings")
      .select("briefing_text, created_at")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      // Show today's cached briefing with a typing effect
      const cached = existing[0].briefing_text;
      setTimestamp(existing[0].created_at ? new Date(existing[0].created_at) : new Date());
      let i = 0;
      setIsStreaming(true);
      const interval = setInterval(() => {
        i += 3;
        if (i >= cached.length) {
          setBriefingText(cached);
          setIsStreaming(false);
          setIsDone(true);
          clearInterval(interval);
        } else {
          setBriefingText(cached.slice(0, i));
        }
      }, 12);
      return;
    }

    // Generate a new briefing via streaming
    setIsStreaming(true);
    setTimestamp(new Date());

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ type: "briefing" }),
        }
      );

      if (!resp.ok || !resp.body) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

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
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setBriefingText(fullText);
            }
          } catch {
            // partial JSON
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setBriefingText(fullText);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error("Briefing generation failed:", err);
      // Graceful degradation: show most recent cached briefing if AI is unavailable
      const { data: fallback } = await supabase
        .from("agent_briefings")
        .select("briefing_text, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fallback && fallback.length > 0) {
        setBriefingText(fallback[0].briefing_text);
        setTimestamp(fallback[0].created_at ? new Date(fallback[0].created_at) : new Date());
        setError(null);
      } else {
        // Zero-data welcome message for brand new users
        setBriefingText("Welcome to SCRF Hub! I'm your AI-powered risk intelligence agent. Start by completing your first assessment tool — I'll use your results to generate personalised daily briefings with actionable insights for your business.");
        setTimestamp(new Date());
        setError(null);
      }
    } finally {
      setIsStreaming(false);
      setIsDone(true);
    }
  }, [user]);

  useEffect(() => {
    streamBriefing();
  }, [streamBriefing]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  if (error) {
    return (
      <Card className="border-amber-300/50 bg-slate-900 text-white">
        <CardContent className="py-4 text-sm text-amber-200">
          <BrainCircuit className="inline h-4 w-4 mr-1" /> Briefing unavailable — {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-400/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg overflow-hidden">
      {/* Gold accent top bar */}
      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
            <BrainCircuit className="h-5 w-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-amber-100 uppercase">
              Daily Intelligence Briefing
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>SCRF Agent</span>
              {timestamp && (
                <>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(timestamp)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Badge className="bg-amber-400/15 text-amber-300 border-amber-400/30 text-[10px] uppercase tracking-wider font-semibold">
          Pro
        </Badge>
      </div>

      {/* Briefing body */}
      <CardContent className="px-5 pb-4 pt-2">
        <div className="min-h-[72px] text-sm leading-relaxed text-slate-200 font-serif">
          {briefingText || (
            <span className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing your risk landscape…
            </span>
          )}
          {isStreaming && <span className="inline-block w-0.5 h-4 bg-amber-400 ml-0.5 animate-pulse align-text-bottom" />}
        </div>

        {isDone && !error && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-300 hover:text-amber-100 hover:bg-amber-400/10 text-xs gap-1.5"
              onClick={() => {
                const el = document.getElementById("agent-chat-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Full Analysis
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
