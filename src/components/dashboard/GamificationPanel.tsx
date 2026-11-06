import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Trophy, Star, Flame, Shield, Target, Zap, Award,
  CheckCircle2, BookOpen, TrendingUp, Lock,
} from "lucide-react";

interface GamificationProps {
  assessmentsCompleted: number;
  actionsCompleted: number;
  domainsAssessed: number;
  overallScore: number;
  streakDays: number;
  scoreHistory: { domain: string; score: number; recorded_at: string }[];
}

interface MilestoneBadge {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  progress: number;
  target: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

const tierColors = {
  bronze: { bg: "bg-orange-100 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", ring: "ring-orange-300" },
  silver: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-600 dark:text-slate-300", border: "border-slate-300 dark:border-slate-700", ring: "ring-slate-300" },
  gold: { bg: "bg-amber-100 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", ring: "ring-amber-300" },
  platinum: { bg: "bg-violet-100 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800", ring: "ring-violet-300" },
};

export default function GamificationPanel({
  assessmentsCompleted,
  actionsCompleted,
  domainsAssessed,
  overallScore,
  streakDays,
  scoreHistory,
}: GamificationProps) {
  const badges: MilestoneBadge[] = useMemo(() => [
    {
      id: "first-step", name: "First Step", description: "Complete your first assessment",
      icon: Star, unlocked: assessmentsCompleted >= 1, progress: Math.min(assessmentsCompleted, 1), target: 1, tier: "bronze",
    },
    {
      id: "explorer", name: "Risk Explorer", description: "Assess all 4 risk domains",
      icon: Target, unlocked: domainsAssessed >= 4, progress: domainsAssessed, target: 4, tier: "silver",
    },
    {
      id: "action-hero", name: "Action Hero", description: "Complete 5 action items",
      icon: Zap, unlocked: actionsCompleted >= 5, progress: Math.min(actionsCompleted, 5), target: 5, tier: "bronze",
    },
    {
      id: "resilient", name: "Resilience Builder", description: "Achieve an overall score of 60+",
      icon: Shield, unlocked: overallScore >= 60, progress: Math.min(overallScore, 60), target: 60, tier: "silver",
    },
    {
      id: "veteran", name: "Risk Veteran", description: "Complete 10 assessments",
      icon: Award, unlocked: assessmentsCompleted >= 10, progress: Math.min(assessmentsCompleted, 10), target: 10, tier: "gold",
    },
    {
      id: "streak-3", name: "Consistency", description: "3-day activity streak",
      icon: Flame, unlocked: streakDays >= 3, progress: Math.min(streakDays, 3), target: 3, tier: "bronze",
    },
    {
      id: "streak-7", name: "Dedicated", description: "7-day activity streak",
      icon: Flame, unlocked: streakDays >= 7, progress: Math.min(streakDays, 7), target: 7, tier: "silver",
    },
    {
      id: "mastery", name: "Risk Master", description: "Score 80+ across all domains",
      icon: Trophy, unlocked: overallScore >= 80 && domainsAssessed >= 4, progress: Math.min(overallScore, 80), target: 80, tier: "platinum",
    },
  ], [assessmentsCompleted, actionsCompleted, domainsAssessed, overallScore, streakDays]);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const nextBadge = badges.find(b => !b.unlocked);

  // Calculate streak from score history
  const xpPoints = useMemo(() => {
    return (assessmentsCompleted * 100) + (actionsCompleted * 50) + (unlockedCount * 200);
  }, [assessmentsCompleted, actionsCompleted, unlockedCount]);

  const level = Math.floor(xpPoints / 500) + 1;
  const xpInLevel = xpPoints % 500;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" />
            Achievements
          </div>
          <div className="flex items-center gap-2">
            {streakDays > 0 && (
              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200">
                <Flame className="h-3 w-3" />
                {streakDays}d streak
              </Badge>
            )}
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Lv.{level}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{xpPoints} XP</span>
            <span>Level {level + 1} at {level * 500 + 500} XP</span>
          </div>
          <Progress value={(xpInLevel / 500) * 100} className="h-2" />
        </div>

        {/* Badge Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {badges.map((badge) => {
              const Icon = badge.icon;
              const colors = tierColors[badge.tier];
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`relative flex flex-col items-center p-2 rounded-lg border transition-all ${
                        badge.unlocked
                          ? `${colors.bg} ${colors.border} shadow-sm`
                          : "bg-muted/30 border-dashed border-muted-foreground/20 opacity-50"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        badge.unlocked ? colors.bg : "bg-muted"
                      }`}>
                        {badge.unlocked ? (
                          <Icon className={`h-4 w-4 ${colors.text}`} />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[9px] font-medium text-center mt-1 leading-tight">
                        {badge.name}
                      </span>
                      {!badge.unlocked && badge.progress > 0 && (
                        <div className="w-full mt-1">
                          <Progress value={(badge.progress / badge.target) * 100} className="h-0.5" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {!badge.unlocked && (
                      <p className="text-xs text-primary mt-1">{badge.progress}/{badge.target}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Next Badge */}
        {nextBadge && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <nextBadge.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs font-medium">Next: {nextBadge.name}</p>
                <p className="text-[10px] text-muted-foreground">{nextBadge.description}</p>
              </div>
              <span className="text-xs text-primary font-medium">
                {nextBadge.progress}/{nextBadge.target}
              </span>
            </div>
            <Progress value={(nextBadge.progress / nextBadge.target) * 100} className="h-1 mt-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
