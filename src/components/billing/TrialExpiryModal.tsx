import { useState } from 'react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle, Crown, ArrowRight } from 'lucide-react';
import { UpgradeFlow } from './UpgradeFlow';

export function TrialExpiryModal() {
  const { isExpired, isFree, planType } = usePlanAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show when trial just expired (not for long-expired or cancelled)
  const shouldShow = (isExpired || (isFree && planType === 'expired')) && !dismissed;

  if (!shouldShow) return null;

  if (showUpgrade) {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="max-w-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <UpgradeFlow
            onSuccess={() => setDismissed(true)}
            onCancel={() => setShowUpgrade(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Your Trial Has Ended
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your 14-day Pro trial is over. Choose how you'd like to continue:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What you'll lose */}
          <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
            <p className="text-sm font-semibold">Without Pro, you'll lose access to:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                13 premium risk assessment tools
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                Full dashboard with progress tracking
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                AI-powered resilience agent
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                Unlimited saves & PDF exports
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Your existing data is safe — you can access it again anytime by upgrading.
            </p>
          </div>

          {/* Option A: Upgrade */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => setShowUpgrade(true)}
          >
            <Crown className="h-4 w-4" />
            Upgrade Now — from R299/month
          </Button>

          {/* Option B: Free plan */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            Continue with Free Plan
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
