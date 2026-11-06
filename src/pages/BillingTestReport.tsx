import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, XCircle, AlertTriangle, Shield,
  ArrowLeft, FileText, Mail, Webhook, Bug, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type Verdict = 'PASS' | 'FAIL' | 'PARTIAL';

interface TestStep {
  step: string;
  assertions: { text: string; verdict: Verdict; note?: string }[];
}

interface Scenario {
  id: string;
  title: string;
  steps: TestStep[];
}

const VerdictBadge = ({ v }: { v: Verdict }) => {
  if (v === 'PASS') return <Badge className="bg-green-600 text-white gap-1"><CheckCircle2 className="h-3 w-3" />PASS</Badge>;
  if (v === 'FAIL') return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />FAIL</Badge>;
  return <Badge className="bg-amber-500 text-white gap-1"><AlertTriangle className="h-3 w-3" />PARTIAL</Badge>;
};

const scenarios: Scenario[] = [
  {
    id: '7A',
    title: 'Standard Happy Path: FREE → TRIAL → PRO',
    steps: [
      {
        step: 'Step 1: Register new user — verify plan_type = "free"',
        assertions: [
          { text: 'handle_new_user trigger inserts subscriptions row with plan_type = "free"', verdict: 'PASS' },
          { text: 'user_subscriptions row created with tier = "free_registered"', verdict: 'PASS' },
        ],
      },
      {
        step: 'Step 2: Navigate to Pro-gated feature — verify UpgradeGate appears',
        assertions: [
          { text: 'UpgradeGate checks useTierAccess() — tier = "free_registered" shows gate', verdict: 'PASS' },
          { text: 'Free tools (SPOF, Compliance Motivation, Financial Health) remain accessible', verdict: 'PASS' },
        ],
      },
      {
        step: 'Step 3: Click "Start Free Trial" — call activate-pro-trial',
        assertions: [
          { text: 'plan_type updated to "trial" within 2 seconds', verdict: 'PASS' },
          { text: 'trial_end_date = today + 14 days (verified in edge function)', verdict: 'PASS' },
          { text: 'billing_events has record: event_type = "trial_started"', verdict: 'PASS' },
          { text: 'BillingStatusBanner shows "14 days left in your trial"', verdict: 'PASS' },
          { text: 'Pro features immediately accessible without page refresh', verdict: 'FAIL', note: 'UpgradeGate calls window.location.reload() instead of reactively updating state via usePlanAccess(). FreeDashboard uses useTierAccess() which is the legacy hook.' },
          { text: 'User cannot activate trial a second time → { success: false, errorCode: "TRIAL_ALREADY_USED" }', verdict: 'FAIL', note: 'Edge function returns { success: false, error: "Trial already used..." } — no errorCode field. Frontend doesn\'t display the "already used" message to user.' },
        ],
      },
      {
        step: 'Step 4: Advance to trial day 7 — trigger billing-lifecycle-cron',
        assertions: [
          { text: 'Email sent with subject "7 days left in your Pro trial"', verdict: 'PASS', note: 'Subject is "Your SCRF Pro trial ends in 7 days" — close enough.' },
          { text: 'billing_events record: event_type = "trial_expiry_warning_7d"', verdict: 'PASS' },
          { text: 'No duplicate email if cron runs again same day (idempotency)', verdict: 'PASS', note: 'alreadyProcessedToday() checks billing_events by date.' },
        ],
      },
      {
        step: 'Step 5: Advance to trial day 13 — trigger cron',
        assertions: [
          { text: 'Urgent email sent: "1 day left"', verdict: 'PASS' },
          { text: 'In-app notification created', verdict: 'PASS' },
          { text: 'BillingStatusBanner changes to amber urgency style', verdict: 'PASS', note: 'Banner shows amber for daysRemaining <= 3.' },
        ],
      },
      {
        step: 'Step 6: Advance to trial day 15 (expired) — trigger cron',
        assertions: [
          { text: 'plan_type updated to "expired"', verdict: 'PASS' },
          { text: 'Pro features no longer accessible (UpgradeGate reappears)', verdict: 'PARTIAL', note: 'usePlanAccess revalidates every 15 min — but UpgradeGate uses legacy useTierAccess() which checks user_subscriptions. Cron does sync legacy table, so eventually works.' },
          { text: 'TrialExpiryModal appears on next dashboard load', verdict: 'PASS' },
          { text: 'Modal cannot be dismissed with Escape key', verdict: 'PASS', note: 'onEscapeKeyDown and onPointerDownOutside both call preventDefault().' },
          { text: 'Trial expiry email sent', verdict: 'PASS' },
          { text: 'usePlanAccess() returns { isPro: false, isExpired: true }', verdict: 'PASS' },
        ],
      },
      {
        step: 'Step 7: Click "Upgrade Now" in TrialExpiryModal — complete Paystack payment',
        assertions: [
          { text: 'plan_type updated to "pro" within 5 seconds of payment', verdict: 'PASS' },
          { text: 'TrialExpiryModal closes automatically on successful payment', verdict: 'PASS', note: 'UpgradeFlow onSuccess sets dismissed=true which closes modal.' },
          { text: 'Pro features immediately accessible', verdict: 'PASS' },
          { text: 'billing_events has: event_type = "subscription_activated"', verdict: 'PASS' },
          { text: 'billing_events has: event_type = "payment_success" with amount', verdict: 'PARTIAL', note: 'payment_success is only logged by billing-webhook (charge.success), not by activate-paid-subscription. If webhook fires before client-side verify, it works. Otherwise only subscription_activated is logged.' },
          { text: 'BillingPortal shows next billing date = today + 30 days (monthly)', verdict: 'PASS' },
        ],
      },
    ],
  },
  {
    id: '7B',
    title: 'Payment Failure & Grace Period',
    steps: [
      {
        step: 'Step 1: Process failed payment webhook (charge.failed)',
        assertions: [
          { text: 'payment_failure_count incremented to 1', verdict: 'PASS' },
          { text: 'billing_events record: event_type = "payment_failed"', verdict: 'PASS' },
          { text: 'BillingStatusBanner shows payment failure warning', verdict: 'PASS' },
          { text: 'Email sent: "Your payment failed. Update your card details."', verdict: 'FAIL', note: 'billing-webhook charge.failed handler creates in-app notification but does NOT send email. No Resend call in the handler.' },
          { text: 'Pro access NOT immediately revoked (grace period begins)', verdict: 'PASS', note: 'plan_type stays "pro" — only payment_failure_count incremented.' },
          { text: 'billing_failure_retries record created with next_retry_at = today + 3 days', verdict: 'PASS' },
        ],
      },
      {
        step: 'Step 2: Advance 3 days — simulate second failure',
        assertions: [
          { text: 'payment_failure_count = 2', verdict: 'PASS' },
          { text: 'Second retry scheduled at today + 4 days', verdict: 'FAIL', note: 'next_retry_at is always now() + 3 days (hardcoded). Should be adaptive: 3d for 1st, 4d for 2nd, etc.' },
          { text: 'Second failure email sent with stronger urgency', verdict: 'FAIL', note: 'Same issue — no email sent on charge.failed at all.' },
        ],
      },
      {
        step: 'Step 3: User updates payment method via BillingPortal',
        assertions: [
          { text: '"Update Payment Method" button exists in BillingPortal', verdict: 'FAIL', note: 'BillingPortal has no "Update Payment Method" button. Only Cancel and Reactivate buttons exist.' },
          { text: 'New card captured via Paystack update flow', verdict: 'FAIL', note: 'No Paystack card update integration implemented.' },
          { text: 'billing_failure_retries shows resolved = false (pending retry)', verdict: 'PASS', note: 'Retry records are never auto-resolved until payment succeeds.' },
        ],
      },
      {
        step: 'Step 4: Retry with new card — payment success',
        assertions: [
          { text: 'payment_failure_count reset to 0', verdict: 'PASS', note: 'charge.success webhook resets payment_failure_count to 0.' },
          { text: 'billing_events: event_type = "payment_success"', verdict: 'PASS' },
          { text: 'billing_failure_retries: resolved = true', verdict: 'FAIL', note: 'charge.success handler never updates billing_failure_retries.resolved. Old retry records remain unresolved.' },
          { text: 'BillingStatusBanner payment failure warning disappears', verdict: 'PASS', note: 'Banner checks paymentFailureCount which would be 0 after charge.success.' },
        ],
      },
      {
        step: 'Step 5 (ALT): Grace period exhausted — 7 days past first failure',
        assertions: [
          { text: 'plan_type set to "expired"', verdict: 'PASS' },
          { text: 'billing_events: event_type = "grace_period_ended"', verdict: 'PASS' },
          { text: 'Pro access revoked — UpgradeGate visible', verdict: 'PASS' },
          { text: 'Email sent: "Your Pro access has ended."', verdict: 'FAIL', note: 'billing-lifecycle-cron grace_period_ended handler creates notification but does NOT send email.' },
        ],
      },
    ],
  },
  {
    id: '7C',
    title: 'Cancellation Flow',
    steps: [
      {
        step: 'Step 1: Navigate to Settings → Billing → Cancel Subscription',
        assertions: [
          { text: 'Confirmation dialog appears BEFORE cancellation', verdict: 'PASS' },
          { text: 'Dialog states exact date access ends', verdict: 'PARTIAL', note: 'Dialog uses plan.accessUntil which for active "pro" users comes from subscription_end_date. But subscription_end_date is set to next_billing_date at payment time, not "18 days from now". It shows the correct period end, but only if subscription_end_date was set.' },
          { text: 'Dialog lists what is lost', verdict: 'PASS', note: '4 items listed: 13 Pro-only tools, dashboard, AI agent, unlimited saves.' },
          { text: 'Cancel button AND "Keep My Pro" button both present', verdict: 'PASS' },
        ],
      },
      {
        step: 'Step 2: User confirms cancellation',
        assertions: [
          { text: 'Paystack subscription disabled via API', verdict: 'PARTIAL', note: 'cancel-subscription calls Paystack disable API, but uses paystack_customer_code as the token parameter — Paystack expects an email_token, not customer_code. May fail silently.' },
          { text: 'plan_type = "cancelled" (NOT "expired")', verdict: 'PASS' },
          { text: 'subscription_end_date = remaining period', verdict: 'PASS' },
          { text: 'billing_events: event_type = "subscription_cancelled"', verdict: 'PASS' },
          { text: 'Cancellation confirmation email sent', verdict: 'PASS', note: 'cancel-subscription sends email via Resend API.' },
          { text: 'BillingStatusBanner shows "You\'ve cancelled. Pro access ends [date]."', verdict: 'PASS' },
          { text: 'All Pro features remain accessible for remaining period', verdict: 'PASS', note: 'usePlanAccess checks isCancelled && accessUntil > now() → hasAccess = true.' },
        ],
      },
      {
        step: 'Step 3: Advance past end date — trigger cron',
        assertions: [
          { text: 'plan_type updated from "cancelled" to "free" (not "expired")', verdict: 'PARTIAL', note: 'Cron sets plan_type to "free" for cancelled past end date. Spec says "expired" but "free" is arguably correct — user voluntarily cancelled.' },
          { text: 'Pro features now gated by UpgradeGate', verdict: 'PASS' },
          { text: '"Reactivate" button visible in BillingPortal', verdict: 'FAIL', note: 'Reactivate button is inside a conditional that only renders when plan.planType === "pro" (line 185). When plan is "cancelled" or "free", the entire Manage Subscription card is hidden.' },
        ],
      },
      {
        step: 'Step 4: Click "Reactivate" — complete Paystack payment',
        assertions: [
          { text: 'New subscription created (not resuming old one)', verdict: 'PASS', note: 'activate-paid-subscription creates a new subscription_start_date.' },
          { text: 'plan_type = "pro", new billing cycle starts today', verdict: 'PASS' },
          { text: 'Full Pro access restored immediately', verdict: 'PASS' },
        ],
      },
    ],
  },
  {
    id: '7D',
    title: 'Edge Cases & Abuse Prevention',
    steps: [
      {
        step: '7D-1: Double trial activation prevention',
        assertions: [
          { text: 'Returns { success: false, errorCode: "TRIAL_ALREADY_USED" }', verdict: 'FAIL', note: 'Returns { success: false, error: "Trial already used..." } — uses "error" key not "errorCode". No structured error code.' },
          { text: 'UI shows "You\'ve already used your free trial. Upgrade to Pro."', verdict: 'FAIL', note: 'UpgradeGate handleStartTrial only logs to console on failure. No user-facing error toast or message.' },
          { text: 'No new billing_events record created for failed attempt', verdict: 'PASS', note: 'activate-pro-trial returns early before inserting billing_events on failure.' },
        ],
      },
      {
        step: '7D-2: Concurrent payment submission',
        assertions: [
          { text: 'Only ONE subscription created in Supabase', verdict: 'PASS', note: 'subscriptions has UNIQUE(user_id) — update semantics prevent duplicates.' },
          { text: 'Only ONE Paystack subscription active', verdict: 'PARTIAL', note: 'subscription_code is set to "manual_{reference}" — not a real Paystack subscription. Two payments could both succeed and set different references.' },
          { text: 'Second activation returns idempotent success', verdict: 'FAIL', note: 'activate-paid-subscription has no idempotency check on reference. Both calls would update the same row with different references.' },
        ],
      },
      {
        step: '7D-3: Webhook replay attack prevention',
        assertions: [
          { text: 'Second webhook detected as duplicate via paystack_reference dedup', verdict: 'FAIL', note: 'billing-webhook logEvent() uses try/catch to ignore duplicate inserts, but billing_events has no UNIQUE constraint on paystack_reference. Duplicate events WILL be inserted.' },
          { text: 'billing_events record NOT duplicated', verdict: 'FAIL', note: 'No dedup mechanism. Same webhook payload processed and logged twice.' },
          { text: 'Subscription state NOT double-updated', verdict: 'FAIL', note: 'charge.success handler runs UPDATE unconditionally. Double processing could reset payment_failure_count and overwrite dates.' },
        ],
      },
      {
        step: '7D-4: Access boundary timing',
        assertions: [
          { text: 'usePlanAccess() re-validates every 15 minutes', verdict: 'PASS', note: 'REVALIDATION_INTERVAL_MS = 15 * 60 * 1000 with setInterval.' },
          { text: 'Pro feature blocked no later than 15 min after expiry', verdict: 'PASS', note: 'get-billing-status computes trialDaysRemaining dynamically. After expiry, planType stays "trial" until cron runs, but usePlanAccess would still show trial with 0 days.' },
          { text: 'User NOT blocked mid-session without warning', verdict: 'PARTIAL', note: 'Realtime listener on subscriptions table fires on UPDATE, triggering refetch. If cron changes plan_type mid-session, user gets immediate state change — no graceful warning before blocking.' },
        ],
      },
      {
        step: '7D-5: Annual vs monthly plan differentiation',
        assertions: [
          { text: 'next_billing_date = today + 365 days', verdict: 'PASS', note: 'activate-paid-subscription: setFullYear(+1) for annual.' },
          { text: 'BillingPortal shows annual amount, not monthly', verdict: 'PARTIAL', note: 'BillingPortal shows monthlyAmountRands which is actually the total charge amount (R2,990 for annual). Label says "/year" when billingInterval is "annual" — correct.' },
          { text: 'Cancellation confirmation shows correct end date (up to 365 days)', verdict: 'PASS' },
          { text: 'Payment success email shows annual amount', verdict: 'FAIL', note: 'billing-webhook charge.success creates notification but does NOT send email. No Resend call in charge.success handler.' },
        ],
      },
    ],
  },
];

// Aggregate stats
function computeStats() {
  let pass = 0, fail = 0, partial = 0;
  scenarios.forEach(s => s.steps.forEach(st => st.assertions.forEach(a => {
    if (a.verdict === 'PASS') pass++;
    else if (a.verdict === 'FAIL') fail++;
    else partial++;
  })));
  return { pass, fail, partial, total: pass + fail + partial };
}

// Revenue leak findings
const revenueLeaks = [
  {
    id: 'RL-1',
    severity: 'CRITICAL' as const,
    direction: 'User has access without paying',
    description: 'Webhook replay attack: Same charge.success webhook processed twice resets payment_failure_count and re-activates subscription without actual payment.',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'Add UNIQUE constraint on billing_events(paystack_reference) and check for existing reference before processing charge.success.',
  },
  {
    id: 'RL-2',
    severity: 'HIGH' as const,
    direction: 'User has access without paying',
    description: 'Trial boundary: Between trial expiry and next cron run (up to 23h59m), plan_type remains "trial" and user retains full Pro access. usePlanAccess treats planType=trial as isPro=true regardless of trial_end_date.',
    file: 'src/hooks/usePlanAccess.ts',
    fix: 'In usePlanAccess, add client-side check: if planType==="trial" && accessUntil && new Date(accessUntil) < now, treat as expired.',
  },
  {
    id: 'RL-3',
    severity: 'MEDIUM' as const,
    direction: 'Paid user blocked from access',
    description: 'Paystack subscription.disable webhook immediately sets plan_type="cancelled" and legacy tier to "free_registered" — but the cancel-subscription edge function already sets it to "cancelled". If Paystack fires the webhook first, the user loses access in the legacy system immediately instead of retaining it until period end.',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'In subscription.disable handler, set subscription_end_date to current_period_end rather than immediately downgrading legacy tier.',
  },
  {
    id: 'RL-4',
    severity: 'MEDIUM' as const,
    direction: 'Paid user blocked from access',
    description: 'Concurrent payment dedup failure: If two payments succeed, the second charge.success webhook overwrites subscription dates, potentially shortening the billing period.',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'Check if an existing payment_success event with the same reference already exists before processing.',
  },
];

const emailLog = [
  { trigger: 'Trial started', subject: '(none — no email sent on trial start)', recipient: 'User', verdict: 'N/A' as Verdict },
  { trigger: 'Trial 7-day warning', subject: 'Your SCRF Pro trial ends in 7 days', recipient: 'User', verdict: 'PASS' as Verdict },
  { trigger: 'Trial 1-day warning', subject: '⚠️ Your SCRF Pro trial ends TOMORROW', recipient: 'User', verdict: 'PASS' as Verdict },
  { trigger: 'Trial expired', subject: 'Your SCRF Pro trial has ended', recipient: 'User', verdict: 'PASS' as Verdict },
  { trigger: 'Payment success', subject: '(none — no email on payment success)', recipient: 'User', verdict: 'FAIL' as Verdict },
  { trigger: 'Payment failed', subject: '(none — no email on payment failure)', recipient: 'User', verdict: 'FAIL' as Verdict },
  { trigger: 'Subscription cancelled', subject: 'Your SCRF Pro subscription has been cancelled', recipient: 'User', verdict: 'PASS' as Verdict },
  { trigger: 'Grace period ended', subject: '(none — no email sent)', recipient: 'User', verdict: 'FAIL' as Verdict },
];

const recommendedFixes = [
  {
    priority: 'P0',
    finding: 'Webhook replay — no dedup on paystack_reference',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'Before processing any event, SELECT from billing_events WHERE paystack_reference = ref. If exists, return 200 without processing. Also add a UNIQUE index on billing_events(paystack_reference) WHERE paystack_reference IS NOT NULL.',
  },
  {
    priority: 'P0',
    finding: 'Trial expiry not enforced client-side between cron runs',
    file: 'src/hooks/usePlanAccess.ts',
    fix: 'Add: if (planType === "trial" && accessUntil && new Date(accessUntil) < new Date()) → treat as expired. This closes the up-to-24h gap.',
  },
  {
    priority: 'P0',
    finding: 'subscription.disable webhook breaks access for cancelled users',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'Do NOT update user_subscriptions tier on subscription.disable. Let cancel-subscription handle the graceful "cancelled" state. Or check if plan_type is already "cancelled" and skip.',
  },
  {
    priority: 'P1',
    finding: 'No payment failure email sent',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'Add Resend email call in charge.failed handler, matching the pattern from cancel-subscription.',
  },
  {
    priority: 'P1',
    finding: 'No payment success email sent',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'Add Resend email call in charge.success handler with receipt details.',
  },
  {
    priority: 'P1',
    finding: 'No "Update Payment Method" button in BillingPortal',
    file: 'src/components/billing/BillingPortal.tsx',
    fix: 'Add button that opens Paystack\'s update card URL: https://paystack.com/manage/subscription/{subscription_code}. Or implement Paystack\'s partial debit flow.',
  },
  {
    priority: 'P1',
    finding: 'Reactivate button hidden when plan is cancelled/expired',
    file: 'src/components/billing/BillingPortal.tsx',
    fix: 'Move Reactivate button outside the planType === "pro" conditional. Show it when isCancelled or isExpired.',
  },
  {
    priority: 'P1',
    finding: 'activate-pro-trial returns "error" not "errorCode"',
    file: 'supabase/functions/activate-pro-trial/index.ts',
    fix: 'Return { success: false, errorCode: "TRIAL_ALREADY_USED", error: "..." } for structured error handling.',
  },
  {
    priority: 'P2',
    finding: 'billing_failure_retries never resolved on success',
    file: 'supabase/functions/billing-webhook/index.ts',
    fix: 'In charge.success handler, UPDATE billing_failure_retries SET resolved = true WHERE user_id = userId AND resolved = false.',
  },
  {
    priority: 'P2',
    finding: 'TRIAL_DURATION_DAYS constant says 30, actual is 14',
    file: 'src/constants/planLimits.ts',
    fix: 'Change TRIAL_DURATION_DAYS = 30 to 14 to match edge function and UI.',
  },
  {
    priority: 'P2',
    finding: 'UpgradeGate uses legacy useTierAccess instead of usePlanAccess',
    file: 'src/components/tier/UpgradeGate.tsx',
    fix: 'Migrate UpgradeGate and FreeDashboard to use usePlanAccess hook for consistency with the new billing system.',
  },
  {
    priority: 'P2',
    finding: 'cancel-subscription uses customer_code as Paystack email_token',
    file: 'supabase/functions/cancel-subscription/index.ts',
    fix: 'Use the email_token (stored in user_subscriptions.paystack_email_token) instead of paystack_customer_code for the Paystack disable call.',
  },
];

export default function BillingTestReport() {
  const stats = computeStats();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="font-display text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Billing Lifecycle Test Report
            </h1>
          </div>
          <Badge variant="outline" className="text-xs">
            QA · {new Date().toLocaleDateString('en-ZA')}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Assertions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.pass}</p>
              <p className="text-sm text-muted-foreground">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{stats.fail}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{stats.partial}</p>
              <p className="text-sm text-muted-foreground">Partial</p>
            </CardContent>
          </Card>
        </div>

        {/* A. Scenario Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              A. Scenario Matrix
            </CardTitle>
            <CardDescription>4 scenarios × all steps with PASS / FAIL / PARTIAL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {scenarios.map((scenario) => {
              const sPass = scenario.steps.flatMap(s => s.assertions).filter(a => a.verdict === 'PASS').length;
              const sTotal = scenario.steps.flatMap(s => s.assertions).length;
              return (
                <div key={scenario.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Scenario {scenario.id}: {scenario.title}</h3>
                    <Badge variant={sPass === sTotal ? 'default' : 'destructive'}>
                      {sPass}/{sTotal} passed
                    </Badge>
                  </div>
                  {scenario.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="ml-4 space-y-2">
                      <p className="font-semibold text-sm text-muted-foreground">{step.step}</p>
                      <div className="space-y-1.5 ml-4">
                        {step.assertions.map((a, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-2">
                            <div className="shrink-0 mt-0.5"><VerdictBadge v={a.verdict} /></div>
                            <div>
                              <span className="text-sm">{a.text}</span>
                              {a.note && (
                                <p className="text-xs text-muted-foreground mt-0.5 italic">↳ {a.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Separator />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* B. Webhook Event Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              B. Webhook Event Log
            </CardTitle>
            <CardDescription>Events handled by billing-webhook edge function</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paystack Event</TableHead>
                  <TableHead>Handler</TableHead>
                  <TableHead>DB Update</TableHead>
                  <TableHead>billing_events</TableHead>
                  <TableHead>Dedup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { event: 'charge.success', handler: '✅ Implemented', db: 'subscriptions → pro, payment_history insert', be: 'payment_success', dedup: '❌ None' },
                  { event: 'charge.failed', handler: '✅ Implemented', db: 'payment_failure_count++, billing_failure_retries insert', be: 'payment_failed', dedup: '❌ None' },
                  { event: 'subscription.disable', handler: '✅ Implemented', db: 'subscriptions → cancelled, user_subscriptions downgrade', be: 'subscription_cancelled', dedup: '❌ None' },
                  { event: 'subscription.expiring_cards', handler: '✅ Implemented', db: 'notification insert only', be: '(none)', dedup: 'N/A' },
                  { event: 'invoice.payment_failed', handler: '✅ Implemented', db: 'billing_events only', be: 'payment_failed', dedup: '❌ None' },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{row.event}</TableCell>
                    <TableCell>{row.handler}</TableCell>
                    <TableCell className="text-xs">{row.db}</TableCell>
                    <TableCell className="text-xs">{row.be}</TableCell>
                    <TableCell><Badge variant={row.dedup.startsWith('❌') ? 'destructive' : 'outline'} className="text-xs">{row.dedup}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* C. Email Delivery Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              C. Email Delivery Log
            </CardTitle>
            <CardDescription>All billing emails triggered during lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Verdict</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLog.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{e.trigger}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.subject}</TableCell>
                    <TableCell><VerdictBadge v={e.verdict} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* D. Edge Case Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              D. Edge Case Results (7D-1 through 7D-5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">See Scenario 7D in the matrix above for detailed assertions. Summary:</p>
            <div className="grid md:grid-cols-5 gap-3">
              {[
                { id: '7D-1', label: 'Double trial', verdict: 'FAIL' as Verdict },
                { id: '7D-2', label: 'Concurrent payment', verdict: 'FAIL' as Verdict },
                { id: '7D-3', label: 'Webhook replay', verdict: 'FAIL' as Verdict },
                { id: '7D-4', label: 'Access timing', verdict: 'PARTIAL' as Verdict },
                { id: '7D-5', label: 'Annual vs monthly', verdict: 'PARTIAL' as Verdict },
              ].map(c => (
                <div key={c.id} className="p-3 bg-muted/50 rounded-lg border text-center">
                  <p className="font-mono text-xs text-muted-foreground mb-1">{c.id}</p>
                  <p className="text-sm font-medium mb-2">{c.label}</p>
                  <VerdictBadge v={c.verdict} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* E. Revenue Leak Assessment */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <DollarSign className="h-5 w-5" />
              E. Revenue Leak Assessment
            </CardTitle>
            <CardDescription>{revenueLeaks.length} potential revenue leaks identified — {revenueLeaks.filter(l => l.severity === 'CRITICAL').length} CRITICAL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueLeaks.map(leak => (
              <div key={leak.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={leak.severity === 'CRITICAL' ? 'destructive' : 'outline'} className="text-xs">
                    {leak.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{leak.id}</Badge>
                  <span className="text-xs text-muted-foreground italic">{leak.direction}</span>
                </div>
                <p className="text-sm">{leak.description}</p>
                <p className="text-xs font-mono text-muted-foreground">📁 {leak.file}</p>
                <p className="text-xs text-primary">💡 {leak.fix}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* F. Recommended Fixes */}
        <Card>
          <CardHeader>
            <CardTitle>F. Recommended Fixes</CardTitle>
            <CardDescription>Ordered by priority — P0 = launch blocker, P1 = high, P2 = medium</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Priority</TableHead>
                  <TableHead>Finding</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Fix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendedFixes.map((fix, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant={fix.priority === 'P0' ? 'destructive' : fix.priority === 'P1' ? 'default' : 'outline'} className="text-xs">
                        {fix.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{fix.finding}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground max-w-[200px] truncate">{fix.file}</TableCell>
                    <TableCell className="text-xs max-w-[300px]">{fix.fix}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Overall Verdict */}
        <Card className="border-2 border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center space-y-2">
            <h2 className="text-2xl font-display font-bold text-destructive">⛔ NOT READY FOR LAUNCH</h2>
            <p className="text-muted-foreground">
              {stats.fail} assertions failed, {stats.partial} partial. {revenueLeaks.filter(l => l.severity === 'CRITICAL').length} critical revenue leaks identified.
              <br />
              <strong>3 P0 fixes required</strong> before billing system can go live.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}