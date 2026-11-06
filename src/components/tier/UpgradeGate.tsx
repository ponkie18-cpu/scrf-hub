import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTierAccess, TOOL_INFO, isFreeTool } from '@/hooks/useTierAccess';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UpgradeFlow } from '@/components/billing/UpgradeFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Lock, Sparkles, Check, ArrowRight, Crown,
  TrendingUp, Target, Shield, Loader2,
  Users, Star, Flame, BarChart3,
} from 'lucide-react';

interface UpgradeGateProps {
  toolId: string;
  children: React.ReactNode;
  toolName?: string;
  toolDescription?: string;
  features?: string[];
}

const proFeatures = [
  { icon: Target, text: 'Unlock your complete Resilience Plan' },
  { icon: TrendingUp, text: 'Track your progress to peace of mind' },
  { icon: Shield, text: 'Personalized action plans & reminders' },
  { icon: Sparkles, text: 'Clarity and control over every risk domain' },
];

const socialProofStats = [
  { value: '2,400+', label: 'SMEs assessed' },
  { value: '87%', label: 'improved in 30 days' },
  { value: '4.8/5', label: 'user satisfaction' },
];

export function UpgradeGate({ toolId, children, toolName, toolDescription, features }: UpgradeGateProps) {
  const { tier, startTrial, loading, savesUsed, maxSaves, trialExpired } = useTierAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const toolInfo = TOOL_INFO[toolId];
  const isFree = isFreeTool(toolId);
  const displayName = toolName || toolInfo?.name || 'Premium Tool';
  const displayDescription = toolDescription || toolInfo?.description || 'This tool is available with a Pro subscription';

  if (isFree || tier === 'pro') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      const { data, error } = await supabase.functions.invoke('activate-pro-trial');
      if (error || !data?.success) {
        console.error('Trial activation failed:', data?.error || error);
      } else {
        // Refetch tier state
        window.location.reload();
      }
    } catch (err) {
      console.error('Trial activation error:', err);
    }
    setIsStartingTrial(false);
  };

  // Progress preview for free users
  const progressPercent = user ? Math.min((savesUsed / maxSaves) * 100, 100) : 0;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

      <CardHeader className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Crown className="h-3 w-3 mr-1" />
            Pro Feature
          </Badge>
        </div>
        <CardTitle className="font-display text-2xl flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          {displayName}
        </CardTitle>
        <CardDescription className="text-base">
          {displayDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Social Proof Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {socialProofStats.map((stat, idx) => (
            <div key={idx} className="text-center p-3 bg-background/80 rounded-lg border">
              <p className="text-lg font-bold text-primary">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Preview (for registered users) */}
        {user && savesUsed > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Your journey so far</span>
              </div>
              <span className="text-xs text-muted-foreground">{savesUsed}/{maxSaves} assessments saved</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Upgrade to continue tracking your progress and unlock unlimited saves
            </p>
          </div>
        )}

        {/* Feature Preview */}
        <div className="p-4 bg-muted/50 rounded-lg border border-muted-foreground/10">
          <h4 className="font-semibold mb-3">{features ? 'What this tool gives you:' : 'Unlock your complete resilience journey:'}</h4>
          <ul className="space-y-2">
            {features ? (
              features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))
            ) : (
              proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <feature.icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          {user ? (
            trialExpired ? (
              /* Trial expired — show Paystack payment */
              <UpgradeFlow />
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleStartTrial}
                  disabled={isStartingTrial}
                >
                  {isStartingTrial ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Start Your Free 14-Day Trial
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  No credit card required · Cancel anytime · Full access to all 16 tools
                </p>
                {/* Urgency nudge */}
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-muted-foreground">
                    Join <strong className="text-foreground">340+ SMEs</strong> who started their trial this month
                  </span>
                </div>
              </>
            )
          ) : (
            <>
              <Button size="lg" className="w-full gap-2" onClick={() => navigate('/auth')}>
                <ArrowRight className="h-4 w-4" />
                Create Free Account
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Sign up to save results and unlock Pro features
              </p>
            </>
          )}
        </div>

        {/* Free tools hint */}
        <div className="pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Try our <span className="font-medium text-foreground">free diagnostic tools</span> first:
            <br />
            SPOF Finder · Compliance Motivation · Financial Health Scorecard
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper for inline upgrade prompts within free tools
 */
interface SaveGateProps {
  onSave: () => void;
  children?: React.ReactNode;
}

export function SaveGate({ onSave, children }: SaveGateProps) {
  const { tier, canSaveNow, savesUsed, maxSaves, startTrial } = useTierAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  if (tier === 'pro') {
    return (
      <Button onClick={onSave} className="w-full">
        {children || 'Save to Dashboard'}
      </Button>
    );
  }

  if (tier === 'anonymous') {
    return (
      <div className="space-y-2">
        <Button onClick={() => navigate('/auth')} className="w-full">
          Create Free Account to Save
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Free accounts can save up to 3 assessment results
        </p>
      </div>
    );
  }

  if (canSaveNow) {
    return (
      <div className="space-y-2">
        <Button onClick={onSave} className="w-full">
          {children || 'Save to Dashboard'}
        </Button>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500" />
            <span>{maxSaves - savesUsed} saves remaining</span>
          </div>
          <button
            onClick={async () => {
              setIsStartingTrial(true);
              await startTrial();
              setIsStartingTrial(false);
            }}
            className="text-primary hover:underline"
            disabled={isStartingTrial}
          >
            {isStartingTrial ? 'Starting...' : 'Upgrade for unlimited'}
          </button>
        </div>
        <Progress value={(savesUsed / maxSaves) * 100} className="h-1" />
      </div>
    );
  }

  // Out of saves
  return (
    <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-amber-600" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          You've used all {maxSaves} free saves
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Your data isn't lost — upgrade to save future results and access your full history.
      </p>
      <Button
        onClick={async () => {
          setIsStartingTrial(true);
          await startTrial();
          setIsStartingTrial(false);
        }}
        className="w-full"
        disabled={isStartingTrial}
      >
        {isStartingTrial ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Start Free Pro Trial for Unlimited Saves
      </Button>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>87% of users who upgrade see improvement within 30 days</span>
      </div>
    </div>
  );
}
