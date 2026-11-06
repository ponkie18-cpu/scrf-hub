import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { askAgent, type AgentResponseData, type AgentRequestContext } from "@/services/agentService";
import AgentResponse from "./AgentResponse";

interface AgentChatProps {
  context?: AgentRequestContext;
  placeholder?: string;
  className?: string;
}

const QUICK_PROMPTS = [
  "What's my biggest risk right now?",
  "Where should I focus this week?",
  "Am I compliant with key regulations?",
  "How healthy is my cash flow position?",
];

export default function AgentChat({
  context,
  placeholder = "Ask your virtual CFO anything about your business resilience…",
  className = "",
}: AgentChatProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AgentResponseData | null>(null);
  const { toast } = useToast();

  const handleAsk = async (message?: string) => {
    const text = message || query.trim();
    if (!text) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const result = await askAgent(text, context);
      setResponse(result);
    } catch (err) {
      toast({
        title: "Agent Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            SCRF Agent — Your Virtual CFO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                disabled={isLoading}
                onClick={() => {
                  setQuery(prompt);
                  handleAsk(prompt);
                }}
              >
                {prompt}
              </Button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleAsk()}
              disabled={isLoading || !query.trim()}
              size="icon"
              className="shrink-0 h-[60px] w-10"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Analysing your business context…</p>
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {response && !isLoading && <AgentResponse data={response} logId={response._logId} />}
    </div>
  );
}
