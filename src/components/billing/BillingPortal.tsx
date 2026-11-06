import { useState, useEffect } from 'react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Crown, Calendar, CreditCard, XCircle, RefreshCw,
  Loader2, Check, AlertTriangle, Receipt,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UpgradeFlow } from './UpgradeFlow';

interface BillingEvent {
  id: string;
  event_type: string;
  amount_rands: number | null;
  paystack_reference: string | null;
  created_at: string;
}

export function BillingPortal() {
  const { user } = useAuth();
  const plan = usePlanAccess();
  const { toast } = useToast();
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadEvents = async () => {
      const { data } = await supabase
        .from('billing_events')
        .select('id, event_type, amount_rands, paystack_reference, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setEvents((data as BillingEvent[]) || []);
      setLoadingEvents(false);
    };
    loadEvents();
  }, [user]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      if (error || !data?.success) {
        throw new Error(data?.error || 'Cancellation failed');
      }
      toast({
        title: 'Subscription Cancelled',
        description: `You'll keep Pro access until ${new Date(data.accessUntil).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      });
      await plan.refetch();
      setShowCancelDialog(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivate = async () => {
    // Reactivation goes through the upgrade flow
    toast({
      title: 'Reactivate your subscription',
      description: 'Choose a plan below to reactivate your Pro access.',
    });
  };

  const eventLabels: Record<string, string> = {
    trial_started: 'Trial Started',
    trial_expiry_warning_7d: 'Trial Warning (7 days)',
    trial_expiry_warning_1d: 'Trial Warning (1 day)',
    trial_expired: 'Trial Expired',
    subscription_activated: 'Subscription Activated',
    payment_success: 'Payment Successful',
    payment_failed: 'Payment Failed',
    subscription_cancelled: 'Subscription Cancelled',
    subscription_reactivated: 'Subscription Reactivated',
    grace_period_started: 'Grace Period Started',
    grace_period_ended: 'Grace Period Ended',
    refund_processed: 'Refund Processed',
  };

  // Status badge
  const planBadge = () => {
    switch (plan.planType) {
      case 'pro': return <Badge className="bg-primary text-primary-foreground">Pro Active</Badge>;
      case 'trial': return <Badge variant="secondary" className="bg-primary/10 text-primary">Trial Active</Badge>;
      case 'cancelled': return <Badge variant="outline" className="border-amber-500 text-amber-600">Cancelled</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="outline">Free</Badge>;
    }
  };

  // Trial progress
  const trialProgress = plan.isTrial && plan.daysRemaining !== null
    ? ((14 - plan.daysRemaining) / 14) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">
                {plan.planType === 'pro' ? `Pro ${plan.billingInterval === 'annual' ? 'Annual' : 'Monthly'}` :
                 plan.isTrial ? 'Pro Trial (14 days)' :
                 plan.isCancelled ? 'Pro (Cancelled)' :
                 plan.isExpired ? 'Expired' : 'Free Plan'}
              </p>
              {plan.monthlyAmountRands && (
                <p className="text-sm text-muted-foreground">
                  R{plan.monthlyAmountRands}{plan.billingInterval === 'annual' ? '/year' : '/month'}
                </p>
              )}
            </div>
            {planBadge()}
          </div>

          {/* Trial progress bar */}
          {plan.isTrial && trialProgress !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trial progress</span>
                <span className="font-medium">{plan.daysRemaining} day{plan.daysRemaining !== 1 ? 's' : ''} remaining</span>
              </div>
              <Progress value={trialProgress} className="h-2" />
            </div>
          )}

          {/* Next billing */}
          {plan.nextBillingDate && plan.planType === 'pro' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Next billing: {new Date(plan.nextBillingDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}

          {/* Access until (cancelled) */}
          {plan.isCancelled && plan.accessUntil && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Pro access until: {new Date(plan.accessUntil).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}

          {/* Payment failure warning */}
          {plan.paymentFailureCount > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Payment failed ({plan.paymentFailureCount} attempt{plan.paymentFailureCount > 1 ? 's' : ''}). Update your payment method.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade / Reactivate */}
      {(plan.isFree || plan.isExpired || plan.isCancelled) && (
        <UpgradeFlow onSuccess={() => plan.refetch()} />
      )}

      {/* Actions */}
      {plan.planType === 'pro' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              Manage Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Pro Subscription?</DialogTitle>
                  <DialogDescription>
                    {plan.accessUntil ? (
                      <>
                        You'll keep Pro access until <strong>{new Date(plan.accessUntil).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                        After that, you'll move to the free plan.
                      </>
                    ) : (
                      "You'll be moved to the free plan at the end of your current billing period."
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <p className="text-sm font-medium">You'll lose access to:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-destructive" /> 13 Pro-only risk tools</li>
                    <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-destructive" /> Full dashboard & progress tracking</li>
                    <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-destructive" /> AI resilience agent</li>
                    <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-destructive" /> Unlimited saves & PDF exports</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">Your data will be preserved — you can resubscribe anytime.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep Pro</Button>
                  <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                    {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm Cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {plan.isCancelled && (
              <Button variant="default" onClick={handleReactivate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reactivate Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your subscription events and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No billing events yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {eventLabels[event.event_type] || event.event_type}
                    </TableCell>
                    <TableCell>
                      {event.amount_rands ? `R${event.amount_rands}` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {event.paystack_reference ? event.paystack_reference.slice(0, 16) + '…' : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
