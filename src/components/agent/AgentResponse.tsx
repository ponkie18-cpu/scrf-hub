import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  ArrowRight,
  Wrench,
} from "lucide-react";
import type { AgentResponseData } from "@/services/agentService";
import { TOOL_LABELS } from "@/services/agentService";
import AgentRating from "./AgentRating";

const urgencyConfig = {
  red: {
    label: "Immediate Action Required",
    icon: ShieldAlert,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    accent: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
  },
  amber: {
    label: "Needs Attention",
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    accent: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  green: {
    label: "On Track",
    icon: CheckCircle2,
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    accent: "text-green-600 dark:text-green-400",
    bar: "bg-green-500",
  },
};

interface AgentResponseProps {
  data: AgentResponseData;
  logId?: string;
  className?: string;
}

export default function AgentResponse({ data, logId, className = "" }: AgentResponseProps) {
  const config = urgencyConfig[data.urgencyLevel] || urgencyConfig.amber;
  const UrgencyIcon = config.icon;

  return (
    <Card className={`${config.bg} ${config.border} border ${className}`}>
      {/* Urgency bar */}
      <div className={`h-1.5 rounded-t-lg ${config.bar}`} />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UrgencyIcon className={`h-5 w-5 ${config.accent}`} />
            SCRF Agent
          </CardTitle>
          <Badge className={config.badge}>{config.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Insight */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <Lightbulb className="h-3.5 w-3.5" />
            INSIGHT
          </div>
          <p className="text-sm leading-relaxed">{data.insight}</p>
        </div>

        {/* Recommendation */}
        <div className="bg-background/60 rounded-lg p-3">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            RECOMMENDATION
          </div>
          <p className="text-sm font-medium leading-relaxed">{data.recommendation}</p>
        </div>

        {/* Next Action */}
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${config.border}`}>
          <ArrowRight className={`h-4 w-4 mt-0.5 shrink-0 ${config.accent}`} />
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              NEXT STEP
            </div>
            <p className="text-sm font-semibold">{data.nextAction}</p>
          </div>
        </div>

        {/* Related Tools */}
        {data.relatedTools.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <Wrench className="h-3.5 w-3.5" />
              RELATED TOOLS
            </div>
            <div className="flex flex-wrap gap-2">
              {data.relatedTools.map((toolId) => {
                const tool = TOOL_LABELS[toolId];
                if (!tool) return null;
                return (
                  <Link key={toolId} to={tool.href}>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      {tool.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {data.sources && data.sources.length > 0 && (
          <section className="text-xs text-muted-foreground" aria-label="Answer sources">
            <p className="font-medium">Based on</p>
            <ul className="list-disc pl-4">
              {data.sources.map((source) => (
                <li key={source.id}>{source.kind} · {source.id}
                  {source.revision ? ` · revision ${source.revision}` : ""}
                  {` · as of ${new Date(source.observedAt).toLocaleDateString()}`}
                </li>
              ))}
            </ul>
          </section>
        )}
        {data.dataWarnings && data.dataWarnings.length > 0 && (
          <section className="text-xs text-muted-foreground" aria-label="Data limitations">
            <p className="font-medium">Data limitations</p>
            <ul className="list-disc pl-4">
              {data.dataWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
            </ul>
          </section>
        )}
        {/* Rating */}
        <div className="flex justify-end pt-2 border-t border-border/50">
          <AgentRating logId={logId} />
        </div>
      </CardContent>
    </Card>
  );
}
