import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Crown, Check, Loader2, Shield, TrendingUp,
  Target, Sparkles, Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    PaystackPop?: {
      new (): {
        resumeTransaction: (
          accessCode: string,
          callbacks: {
            onSuccess: (transaction: { reference: string }) => void;
            onCancel: () => void;
          }
        ) => void;
      };
    };
  }
}

interface UpgradeFlowProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const plans = [
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 'R299',
    period: '/month',
    amount: 29900,
    description: 'Full access, cancel anytime',
    popular: false,
  },
  {
    id: 'annual',
    name: 'Pro Annual',
    price: 'R2,990',
    period: '/year',
    amount: 299000,
    description: 'Save 17% — best value',
    popular: true,
  },
];

const proFeatures = [
  { icon: Target, text: 'All 16 risk assessment tools' },
  { icon: TrendingUp, text: 'Dashboard with progress tracking' },
  { icon: Shield, text: 'AI-powered resilience agent' },
  { icon: Sparkles, text: 'Unlimited saves & PDF exports' },
];

export function UpgradeFlow({ onSuccess, onCancel }: UpgradeFlowProps) {
  const { user } = useAuth();
  const { refetch } = usePlanAccess();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Initialize transaction on server
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          plan: selectedPlan,
          callback_url: `${window.location.origin}/settings?payment=success`,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Payment initialization failed');
      }

      const { access_code } = data;

      // Ensure Paystack JS is loaded
      if (!window.PaystackPop) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v2/inline.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load payment processor'));
          document.head.appendChild(script);
        });
      }

      const popup = new window.PaystackPop!();
      popup.resumeTransaction(access_code, {
        onSuccess: async (transaction) => {
          try {
            const { data: activateData } = await supabase.functions.invoke('activate-paid-subscription', {
              body: { reference: transaction.reference, plan: selectedPlan },
            });

            if (activateData?.success) {
              toast({
                title: 'Pro Subscription Activated! 🎉',
                description: `Your ${selectedPlan === 'annual' ? 'annual' : 'monthly'} plan is now active.`,
              });
            } else {
              toast({
                title: 'Payment received',
                description: 'Your subscription is being activated...',
              });
            }
          } catch {
            toast({
              title: 'Payment received',
              description: 'Your subscription will be activated shortly.',
            });
          }

          await refetch();
          onSuccess?.();
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
          onCancel?.();
        },
      });
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Payment error', description: message, variant: 'destructive' });
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader>
        <CardTitle className="font-display text-2xl flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          Upgrade to Pro
        </CardTitle>
        <CardDescription>Choose a plan that works for your business</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground text-[10px]">
                  <Zap className="h-3 w-3 mr-0.5" />
                  Best value
                </Badge>
              )}
              <p className="font-bold text-lg">{plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.period}</p>
              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
            </button>
          ))}
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {proFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button size="lg" className="w-full gap-2" onClick={handleCheckout} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
          Subscribe — {plans.find(p => p.id === selectedPlan)?.price}{plans.find(p => p.id === selectedPlan)?.period}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Secure payment via Paystack · Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}
