import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart, Shield, TrendingUp, Award, Flame, CheckCircle,
  AlertTriangle, ArrowRight, Sparkles
} from "lucide-react";

interface SlippySlopeProps {
  domainScores: Record<string, number | null>;
  actionItems: { domain: string; completed: boolean; priority: string; title?: string; created_at?: string }[];
  complianceMotivationScore?: number | null;
  lastAssessmentDate?: string | null;
}

type Zone = "voluntary" | "balanced" | "enforcement";

interface ZoneInfo {
  zone: Zone;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  description: string;
  icon: typeof Heart;
}

const ZONE_MAP: Record<Zone, ZoneInfo> = {
  voluntary: {
    zone: "voluntary",
    label: "Voluntary Compliance",
    color: "text-green-600",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
    description: "You're building sustainable, trust-based resilience habits",
    icon: Heart,
  },
  balanced: {
    zone: "balanced",
    label: "Balanced Approach",
    color: "text-amber-600",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    description: "A mix of trust-based and enforcement-driven compliance",
    icon: Shield,
  },
  enforcement: {
    zone: "enforcement",
    label: "Enforcement-Dependent",
    color: "text-destructive",
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/30",
    description: "Your compliance is primarily driven by external pressure",
    icon: AlertTriangle,
  },
};

function calculateCompliancePosition(
  actionItems: SlippySlopeProps["actionItems"],
  domainScores: Record<string, number | null>,
  complianceMotivationScore: number | null,
  lastAssessmentDate: string | null
): number {
  let score = 50; // baseline

  // 1. Action item completion rate (weight: 30)
  const total = actionItems.length;
  const completed = actionItems.filter(a => a.completed).length;
  if (total > 0) {
    score += ((completed / total) - 0.5) * 60; // -30 to +30
  }

  // 2. Tool engagement - how many domains assessed (weight: 20)
  const assessedDomains = Object.values(domainScores).filter(s => s !== null).length;
  score += (assessedDomains / 4) * 20;

  // 3. Compliance motivation score if available (weight: 20)
  if (complianceMotivationScore !== null && complianceMotivationScore !== undefined) {
    score += ((complianceMotivationScore / 100) - 0.5) * 40;
  }

  // 4. Recency of last assessment (weight: 10)
  if (lastAssessmentDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastAssessmentDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) score += 10;
    else if (daysSince <= 30) score += 5;
    else if (daysSince > 90) score -= 10;
  } else {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

const DynamicSlipperySlope = ({
  domainScores,
  actionItems,
  complianceMotivationScore = null,
  lastAssessmentDate = null,
}: SlippySlopeProps) => {
  const { user } = useAuth();
  const [previousZone, setPreviousZone] = useState<Zone | null>(null);
  const [showReward, setShowReward] = useState(false);

  const position = useMemo(
    () => calculateCompliancePosition(actionItems, domainScores, complianceMotivationScore, lastAssessmentDate),
    [actionItems, domainScores, complianceMotivationScore, lastAssessmentDate]
  );

  const currentZone: Zone = position >= 70 ? "voluntary" : position >= 40 ? "balanced" : "enforcement";
  const zoneInfo = ZONE_MAP[currentZone];
  const ZoneIcon = zoneInfo.icon;

  // Check for zone progression reward
  useEffect(() => {
    if (previousZone && previousZone !== currentZone) {
      const zoneOrder: Zone[] = ["enforcement", "balanced", "voluntary"];
      const prevIdx = zoneOrder.indexOf(previousZone);
      const currIdx = zoneOrder.indexOf(currentZone);
      if (currIdx > prevIdx) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 5000);
      }
    }
    setPreviousZone(currentZone);
  }, [currentZone]);

  // AI narrative based on position
  const narrative = useMemo(() => {
    if (currentZone === "voluntary") {
      const completedCount = actionItems.filter(a => a.completed).length;
      return `You're in the Voluntary Compliance zone — ${completedCount} completed actions and consistent engagement are keeping you here. Protect this position by maintaining your assessment cadence.`;
    }
    if (currentZone === "balanced") {
      const pendingHigh = actionItems.filter(a => !a.completed && a.priority === "high").length;
      return `You're in the Balanced zone. ${pendingHigh > 0 ? `Completing ${pendingHigh} high-priority action${pendingHigh > 1 ? "s" : ""} would move you toward Voluntary.` : "Keep engaging with tools regularly to build trust-based habits."}`;
    }
    const unassessed = Object.values(domainScores).filter(s => s === null).length;
    return `You've drifted toward Enforcement-Dependent. ${unassessed > 0 ? `${unassessed} domain${unassessed > 1 ? "s" : ""} remain unassessed.` : ""} Here are 3 quick actions to reverse this trend: complete an overdue action, run an assessment, and review your compliance motivation.`;
  }, [currentZone, actionItems, domainScores]);

  // Quick win suggestions
  const quickWins = useMemo(() => {
    const wins: { text: string; href: string }[] = [];
    const pendingHigh = actionItems.filter(a => !a.completed && a.priority === "high");
    if (pendingHigh.length > 0) {
      wins.push({ text: `Complete: "${pendingHigh[0].title || "high-priority action"}"`, href: "#" });
    }
    const unassessed = Object.entries(domainScores).filter(([, s]) => s === null).map(([k]) => k);
    if (unassessed.length > 0) {
      const domainHref: Record<string, string> = {
        operational: "/operational-risk",
        financial: "/financial-risk",
        compliance: "/compliance-risk",
        strategic: "/strategic-cyber-risk",
      };
      wins.push({ text: `Assess your ${unassessed[0]} domain`, href: domainHref[unassessed[0]] || "#" });
    }
    if (!complianceMotivationScore) {
      wins.push({ text: "Complete the Compliance Motivation Assessment", href: "/compliance-risk" });
    }
    return wins.slice(0, 3);
  }, [actionItems, domainScores, complianceMotivationScore]);

  return (
    <Card className={`${zoneInfo.borderClass} transition-all duration-700`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ZoneIcon className={`h-5 w-5 ${zoneInfo.color}`} />
          Compliance Position — Slippery Slope
        </CardTitle>
        <CardDescription className="text-xs">
          Dynamic compliance position based on your activity, engagement, and motivation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reward animation */}
        {showReward && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-700">Zone Progression! 🎉</p>
                <p className="text-xs text-green-600">
                  You've moved to {zoneInfo.label}. Keep building sustainable compliance habits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Animated Slope Visualisation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Enforcement
            </span>
            <span className="text-amber-600">Balanced</span>
            <span className="text-green-600 flex items-center gap-1">
              Voluntary <Heart className="h-3 w-3" />
            </span>
          </div>

          {/* The slope gradient */}
          <div className="relative h-6 rounded-full overflow-hidden"
            style={{
              background: "linear-gradient(90deg, hsl(0 72% 65%) 0%, hsl(40 90% 60%) 40%, hsl(45 90% 55%) 60%, hsl(142 70% 45%) 100%)",
            }}>
            {/* Position marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
              style={{ left: `calc(${position}% - 12px)` }}
            >
              <div className="w-6 h-6 rounded-full bg-background border-2 border-foreground shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-foreground" />
              </div>
            </div>

            {/* Zone labels */}
            <div className="absolute inset-0 flex items-center">
              <div className="flex-1 text-center">
                <span className="text-[9px] font-bold text-white/80 drop-shadow">⚠️</span>
              </div>
              <div className="flex-1 text-center">
                <span className="text-[9px] font-bold text-white/80 drop-shadow">⚖️</span>
              </div>
              <div className="flex-1 text-center">
                <span className="text-[9px] font-bold text-white/80 drop-shadow">✅</span>
              </div>
            </div>
          </div>

          {/* Current position badge */}
          <div className="flex justify-center">
            <Badge variant="outline" className={`${zoneInfo.color} text-xs`}>
              {zoneInfo.label} — Score: {position}/100
            </Badge>
          </div>
        </div>

        {/* AI Position Narrative */}
        <div className={`p-3 rounded-lg ${zoneInfo.bgClass} ${zoneInfo.borderClass} border`}>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <p className="text-xs font-medium mb-1">SCRF Agent Insight</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{narrative}</p>
            </div>
          </div>
        </div>

        {/* Quick wins for non-voluntary zones */}
        {currentZone !== "voluntary" && quickWins.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium">Quick Wins to Improve Position</p>
            {quickWins.map((win, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                <span className="flex-1">{win.text}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {/* Voluntary zone badge */}
        {currentZone === "voluntary" && (
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-500/10">
            <Award className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Compliance Champion</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicSlipperySlope;
