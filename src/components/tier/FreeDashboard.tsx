import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTierAccess, FREE_TOOLS, TOOL_INFO } from '@/hooks/useTierAccess';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Lock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  FileText,
  Compass,
  Home,
  LogOut,
  CheckCircle2,
  Loader2,
  Crown,
  BookOpen,
  BarChart3,
  ListTodo,
  Clock,
} from 'lucide-react';

interface RiskAssessment {
  domain: string;
  score: number;
  tool_id: string | null;
  updated_at: string;
}

const domainConfig = {
  operational: { label: 'Operational', icon: Target, color: 'bg-blue-500', href: '/operational-risk' },
  financial: { label: 'Financial', icon: TrendingUp, color: 'bg-green-500', href: '/financial-risk' },
  compliance: { label: 'Compliance', icon: FileText, color: 'bg-purple-500', href: '/compliance-risk' },
  strategic: { label: 'Strategic', icon: Compass, color: 'bg-amber-500', href: '/strategic-cyber-risk' },
};

const lockedFeatures = [
  { icon: BarChart3, title: 'Progress History', description: 'Track your scores over time' },
  { icon: ListTodo, title: 'Action Plans', description: 'Personalized task management' },
  { icon: Sparkles, title: 'Behavioral Insights', description: 'Trust vs power analysis' },
  { icon: Clock, title: 'Score Trends', description: 'Visual progress charts' },
];

const FreeDashboard = () => {
  const { user, signOut } = useAuth();
  const { tier, savesUsed, maxSaves, startTrial, features } = useTierAccess();
  const navigate = useNavigate();
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  // Fetch only free tool assessments
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['freeAssessments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('risk_assessments')
        .select('domain, score, tool_id, updated_at')
        .eq('user_id', user.id)
        .in('tool_id', FREE_TOOLS)
        .order('updated_at', { ascending: false });
      
      // Get latest per tool
      const latestByTool: Record<string, RiskAssessment> = {};
      (data || []).forEach((a) => {
        if (!latestByTool[a.tool_id || '']) {
          latestByTool[a.tool_id || ''] = a;
        }
      });
      return Object.values(latestByTool);
    },
    enabled: !!user,
  });

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    const success = await startTrial();
    setIsStartingTrial(false);
    // No reload needed — tier state updates reactively
    if (!success) {
      console.error('Trial activation failed');
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const calculateAverageScore = () => {
    if (assessments.length === 0) return null;
    const total = assessments.reduce((sum, a) => sum + a.score, 0);
    return Math.round(total / assessments.length);
  };

  const avgScore = calculateAverageScore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SCRF Hub
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:flex gap-1">
              <BookOpen className="h-3 w-3" />
              Free Account
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Upgrade Banner */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 via-background to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold mb-1">Unlock Your Full Dashboard</h2>
                  <p className="text-muted-foreground text-sm">
                    Get access to all 12 tools, progress tracking, and personalized action plans
                  </p>
                </div>
              </div>
              <Button size="lg" onClick={handleStartTrial} disabled={isStartingTrial} className="shrink-0">
                {isStartingTrial ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Start 14-Day Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Your Resilience Overview</h1>
          <p className="text-muted-foreground">
            {assessments.length > 0 
              ? `You've completed ${assessments.length} free assessment${assessments.length > 1 ? 's' : ''}`
              : 'Start with a free diagnostic tool below'}
            <span className="ml-2">• {maxSaves - savesUsed} saves remaining</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Score Summary */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Quick Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {avgScore !== null ? (
                <div className="text-center">
                  <div className={`text-5xl font-display font-bold mb-2 ${
                    avgScore >= 70 ? 'text-green-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {avgScore}
                  </div>
                  <p className="text-sm text-muted-foreground">Average from free tools</p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" />
                      Upgrade for full resilience score
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">Complete a free tool to see your score</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/operational-risk#tools')}>
                    Start Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Assessments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Free Assessments</CardTitle>
              <CardDescription>Results from SPOF Finder, Compliance Motivation, and Financial Health</CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length > 0 ? (
                <div className="space-y-3">
                  {assessments.map((assessment, idx) => {
                    const toolInfo = TOOL_INFO[assessment.tool_id || ''];
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{toolInfo?.name || assessment.tool_id}</p>
                            <p className="text-xs text-muted-foreground">{getRelativeTime(assessment.updated_at)}</p>
                          </div>
                        </div>
                        <Badge className={
                          assessment.score >= 70 ? 'bg-green-100 text-green-700' :
                          assessment.score >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {assessment.score}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No assessments completed yet</p>
                  <p className="text-sm">Try our free diagnostic tools on the Risk Domain pages</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Locked Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Locked Pro Features
            </CardTitle>
            <CardDescription>Upgrade to unlock these capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lockedFeatures.map((feature, idx) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 opacity-60">
                  <feature.icon className="h-8 w-8 text-muted-foreground mb-3" />
                  <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Free Tools Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Try More Free Tools</CardTitle>
            <CardDescription>These diagnostic tools are free for all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {FREE_TOOLS.map((toolId) => {
                const tool = TOOL_INFO[toolId];
                const domain = domainConfig[tool?.domain as keyof typeof domainConfig];
                const hasCompleted = assessments.some(a => a.tool_id === toolId);
                
                return (
                  <Link 
                    key={toolId}
                    to={`${domain?.href || '/'}#tools`}
                    className="block"
                  >
                    <div className={`p-4 rounded-lg border hover:shadow-md transition-all ${hasCompleted ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'hover:border-primary/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {hasCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        <Badge variant="outline" className="text-xs">
                          {domain?.label}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{tool?.name}</h4>
                      <p className="text-xs text-muted-foreground">{tool?.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to access all 12 tools and track your progress over time?
          </p>
          <Button size="lg" onClick={handleStartTrial} disabled={isStartingTrial}>
            {isStartingTrial ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
            Upgrade to Pro – 14 Days Free
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FreeDashboard;
