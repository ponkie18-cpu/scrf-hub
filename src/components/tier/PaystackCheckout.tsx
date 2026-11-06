import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTierAccess } from '@/hooks/useTierAccess';
import { useAuth } from '@/hooks/useAuth';
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

interface PaystackCheckoutProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: 'full' | 'compact';
}

const plans = [
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 'R499',
    period: '/month',
    description: 'Full access, cancel anytime',
    popular: false,
  },
  {
    id: 'annual',
    name: 'Pro Annual',
    price: 'R4,999',
    period: '/year',
    description: 'Save R989 — best value',
    popular: true,
  },
];

const proFeatures = [
  { icon: Target, text: 'All 16 risk assessment tools' },
  { icon: TrendingUp, text: 'Dashboard with progress tracking' },
  { icon: Shield, text: 'AI-powered resilience agent' },
  { icon: Sparkles, text: 'Unlimited saves & PDF exports' },
];

export function PaystackCheckout({ onSuccess, onCancel, variant = 'full' }: PaystackCheckoutProps) {
  const { user } = useAuth();
  const { refetch } = useTierAccess();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Initialize transaction on server
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          plan: selectedPlan,
          callback_url: `${window.location.origin}/settings?payment=success`,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Payment initialization failed');
      }

      const { access_code, reference } = data;

      // 2. Load Paystack popup
      if (!window.PaystackPop) {
        // Fallback: Load script dynamically
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
          // 3. Verify payment server-side
          try {
            const { data: verifyData } = await supabase.functions.invoke('paystack-verify', {
              body: { reference: transaction.reference },
            });

            if (verifyData?.success) {
              toast({
                title: 'Pro Subscription Activated! 🎉',
                description: 'You now have full access to all SCRF tools.',
              });
              await refetch();
              onSuccess?.();
            } else {
              // Webhook will handle it
              toast({
                title: 'Payment received',
                description: 'Your subscription is being activated...',
              });
              // Poll for activation
              setTimeout(async () => {
                await refetch();
                onSuccess?.();
              }, 3000);
            }
          } catch {
            // Webhook should still process it
            toast({
              title: 'Payment received',
              description: 'Your subscription will be activated shortly.',
            });
            setTimeout(async () => {
              await refetch();
              onSuccess?.();
            }, 5000);
          }
        },
        onCancel: () => {
          setIsLoading(false);
          onCancel?.();
          toast({
            title: 'Payment cancelled',
            description: 'No charges were made.',
            variant: 'destructive',
          });
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({
        title: 'Payment error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <Button onClick={handleCheckout} disabled={isLoading} className="w-full gap-2">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
        Subscribe to Pro — {plans.find(p => p.id === selectedPlan)?.price}{plans.find(p => p.id === selectedPlan)?.period}
      </Button>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader>
        <CardTitle className="font-display text-2xl flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          Upgrade to Pro
        </CardTitle>
        <CardDescription>
          Choose a plan that works for your business
        </CardDescription>
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
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crown className="h-4 w-4" />
          )}
          Subscribe — {plans.find(p => p.id === selectedPlan)?.price}{plans.find(p => p.id === selectedPlan)?.period}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Secure payment via Paystack · Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}
