import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";
import ResilienceScore from "@/components/dashboard/ResilienceScore";
import ResilienceRadar from "@/components/dashboard/ResilienceRadar";
import ResilienceAuditAgent from "@/components/dashboard/ResilienceAuditAgent";
import KanbanActions from "@/components/dashboard/KanbanActions";
import FinancialPulse from "@/components/dashboard/FinancialPulse";
import QuickTools from "@/components/dashboard/QuickTools";
import BehavioralInsights from "@/components/dashboard/BehavioralInsights";
import DynamicSlipperySlope from "@/components/behavioral/DynamicSlipperySlope";
import GamificationPanel from "@/components/dashboard/GamificationPanel";
import IndustryBenchmark from "@/components/dashboard/IndustryBenchmark";
import FreeDashboard from "@/components/tier/FreeDashboard";
import { TierBadge } from "@/components/tier/TierBadge";
import AgentChat from "@/components/agent/AgentChat";
import DailyBriefing from "@/components/agent/DailyBriefing";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { BillingStatusBanner } from "@/components/billing/BillingStatusBanner";
import { TrialExpiryModal } from "@/components/billing/TrialExpiryModal";
import {
  Shield, Target, TrendingUp, FileText, Compass,
  LogOut, Loader2, Home, Settings,
} from "lucide-react";

const domainConfig = {
  operational: { label: "Operational", icon: Target, color: "bg-blue-500", href: "/operational-risk" },
  financial: { label: "Financial & Tax", icon: TrendingUp, color: "bg-green-500", href: "/financial-risk" },
  compliance: { label: "Compliance & Legal", icon: FileText, color: "bg-purple-500", href: "/compliance-risk" },
  strategic: { label: "Strategic & Cyber", icon: Compass, color: "bg-amber-500", href: "/strategic-cyber-risk" },
};

/** Inner component that consumes DashboardContext */
function DashboardContent() {
  const { user, loading, signOut } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("overview");

  const {
    assessments,
    actionItems,
    scoreHistory,
    preferences,
    isLoading,
    isStale,
    overallScore,
    pendingActions,
    domainScores,
    getDomainScore,
    calculateStreak,
    getRelativeTime,
    refetchAll,
    handleActionComplete,
    handleQuickToolsUpdate,
  } = useDashboard();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (preferences !== undefined) setShowOnboarding(!preferences?.onboarding_completed);
  }, [preferences]);

  const handleOnboardingComplete = () => { setShowOnboarding(false); refetchAll(); };

  if (loading || isLoading || tierLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tier !== "pro") return <FreeDashboard />;

  return (
    <div className="min-h-screen bg-muted/30">
      <TrialExpiryModal />
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-display text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="hidden xs:inline">SCRF Hub</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <TierBadge showDetails />
            <NotificationBell />
            <span className="text-sm text-muted-foreground hidden lg:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="hidden sm:flex">
              <Settings className="h-4 w-4 mr-2" />Settings
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="sm:hidden h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden sm:flex">
              <Home className="h-4 w-4 mr-2" />Home
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="sm:hidden h-8 w-8">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="sm:hidden h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Stale data indicator */}
        {isStale && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Data may be slightly delayed — refreshing in the background
          </div>
        )}

        {/* Billing status banner */}
        <div className="mb-4"><BillingStatusBanner /></div>

        {/* Daily Intelligence Briefing */}
        <div className="mb-8"><DailyBriefing /></div>

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's your risk management overview
            {pendingActions > 0 && (
              <span className="ml-2">
                • <span className="text-amber-600 font-medium">{pendingActions} actions pending</span>
              </span>
            )}
          </p>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="mb-8">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs sm:text-sm">Actions</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4 sm:mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div><ResilienceRadar domainScores={domainScores} /></div>
              <div>
                <ResilienceScore
                  currentScore={overallScore}
                  domainScores={domainScores}
                  scoreHistory={scoreHistory}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1 space-y-4 sm:space-y-6">
                <FinancialPulse
                  financialScore={getDomainScore("financial")}
                  scoreHistory={scoreHistory}
                  pendingFinancialActions={actionItems.filter(a => a.domain === "financial" && !a.completed).length}
                />
                <GamificationPanel
                  assessmentsCompleted={assessments.length}
                  actionsCompleted={actionItems.filter(a => a.completed).length}
                  domainsAssessed={Object.values(domainScores).filter(s => s !== null).length}
                  overallScore={overallScore}
                  streakDays={calculateStreak()}
                  scoreHistory={scoreHistory}
                />
              </div>
            </div>

            {/* Domain Status Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Domain Status</CardTitle>
                <CardDescription>Your progress across risk domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(domainConfig).map(([key, config]) => {
                    const score = getDomainScore(key);
                    const assessment = assessments.find((a) => a.domain === key);
                    const Icon = config.icon;
                    const actionCount = actionItems.filter((a) => a.domain === key && !a.completed).length;
                    const domainHistory = scoreHistory
                      .filter((h) => h.domain === key).slice(0, 10).reverse().map((h) => ({ score: h.score }));

                    return (
                      <Link key={key} to={config.href}>
                        <div className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{config.label}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {assessment && <span>{getRelativeTime(assessment.updated_at)}</span>}
                                {actionCount > 0 && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1">{actionCount}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            {domainHistory.length >= 2 && (
                              <div className="w-16 h-6">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={domainHistory}>
                                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                            {score !== null ? (
                              <Badge className={
                                score >= 70 ? "bg-green-100 text-green-700" :
                                score >= 50 ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }>{score}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">—</Badge>
                            )}
                          </div>
                          {score !== null && <Progress value={score} className="h-1.5" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {preferences && (
              <QuickTools selectedTools={preferences.quick_tools} onUpdate={handleQuickToolsUpdate} />
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-6 mt-6">
            <ErrorBoundary>
              <KanbanActions
                actions={actionItems}
                onActionComplete={handleActionComplete}
                onRefresh={refetchAll}
              />
            </ErrorBoundary>
            <div id="agent-chat-section">
              <ErrorBoundary><AgentChat context={{ currentDomain: "dashboard" }} /></ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6 mt-6">
            <ErrorBoundary>
              <ResilienceAuditAgent domainScores={domainScores} actionItems={actionItems} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-6">
            <ErrorBoundary>
              <DynamicSlipperySlope domainScores={domainScores} actionItems={actionItems} />
            </ErrorBoundary>
            <ErrorBoundary>
              <IndustryBenchmark domainScores={domainScores} industry="general" />
            </ErrorBoundary>
            <ErrorBoundary>
              <BehavioralInsights domainScores={domainScores} actionItems={actionItems} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/** Wrapper that provides the DashboardContext */
const Dashboard = () => (
  <DashboardProvider>
    <DashboardContent />
  </DashboardProvider>
);

export default Dashboard;
