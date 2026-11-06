import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, XCircle, CreditCard, Info,
} from 'lucide-react';

export function BillingStatusBanner() {
  const { planType, isTrial, isExpired, isCancelled, daysRemaining, accessUntil, paymentFailureCount } = usePlanAccess();
  const navigate = useNavigate();

  // Free users see no banner (UpgradeGate handles their prompts)
  if (planType === 'free' || planType === 'pro') return null;

  // Trial active with > 3 days left
  if (isTrial && daysRemaining !== null && daysRemaining > 3) {
    return (
      <Alert className="border-primary/30 bg-primary/5">
        <Clock className="h-4 w-4 text-primary" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</strong> in your Pro trial.
          </span>
          <Button size="sm" variant="default" onClick={() => navigate('/settings')} className="shrink-0">
            Upgrade to Keep Pro
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial expiring (≤ 3 days)
  if (isTrial && daysRemaining !== null && daysRemaining <= 3) {
    return (
      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-amber-800 dark:text-amber-200">
            <strong>⚠️ {daysRemaining === 0 ? 'Last day' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}</strong> — your trial ends {daysRemaining === 0 ? 'today' : 'soon'}. Don't lose your Pro tools.
          </span>
          <Button size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700" onClick={() => navigate('/settings')}>
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial/subscription expired
  if (isExpired) {
    return (
      <Alert className="border-destructive/50 bg-destructive/5">
        <XCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-destructive">
            Your {planType === 'expired' ? 'trial' : 'subscription'} has ended. Upgrade to continue using Pro features.
          </span>
          <Button size="sm" variant="destructive" onClick={() => navigate('/settings')} className="shrink-0">
            Upgrade to Pro
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Payment failed
  if (paymentFailureCount > 0) {
    return (
      <Alert className="border-destructive/50 bg-destructive/5">
        <CreditCard className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-destructive">
            Your last payment failed. Update your payment details to keep Pro access.
          </span>
          <Button size="sm" variant="destructive" onClick={() => navigate('/settings')} className="shrink-0">
            Update Payment
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Cancelled but still active
  if (isCancelled && accessUntil) {
    const endDate = new Date(accessUntil).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    return (
      <Alert className="border-muted-foreground/30 bg-muted/50">
        <Info className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            Your Pro access ends on <strong>{endDate}</strong>. Reactivate anytime to keep your tools.
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate('/settings')} className="shrink-0">
            Reactivate
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
