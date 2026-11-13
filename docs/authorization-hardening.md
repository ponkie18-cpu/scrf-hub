# Agent and subscription authorization hardening

This change addresses security-review findings **1–4 and 7**. It is a code and
migration proposal, **not evidence of deployment or production remediation**.
It does not apply SQL to a hosted project, execute a paid model call, delete
application data, or change retention/reviewer policy.

## Changes and compatibility

1. **Backend-owned legacy entitlements.** `user_subscriptions` remains readable
   by its owner through RLS; direct client INSERT/UPDATE/DELETE grants are removed
   and the old INSERT/UPDATE policies are removed. The update trigger rejects
   direct `authenticated`/`anon` updates even if grants/policies are restored.
   Existing signup provisioning and service-role billing writes remain supported.
   The legacy frontend's missing-row fallback now calls `ensure_own_subscription()`:
   it accepts no user ID, tier, dates or limits and cannot modify an existing row.
2. **Restricted subscription RPCs.** Payment activation and deactivation are
   executable only by `service_role` (and trusted database owners). Trials and save
   increments require the caller's own identity or service role; read helpers no
   longer disclose another account's entitlements. Anonymous execution is revoked.
   Own trials remain one-time, 14-day trials; existing free save limits are unchanged.
   The frontend respects a false trial/save RPC result instead of treating any
   error-free response as success.
3. **Administrator-only evaluation.** `run-agent-evaluation` verifies the bearer
   token, checks the verified UUID with the database's `has_role(...,'admin')`, and
   rejects non-admins before evaluation table access, run creation, model calls or
   alerts. Lookup failures fail closed with 503. A caller-provided role or ID has
   no authority. Existing gateway/JWT configuration is unchanged.
4. **Complete agent quota enforcement.** Unknown/non-string request types and
   non-object JSON bodies return 400. An omitted type retains standard generation;
   `standard` is also explicit. Every accepted generation mode reserves quota
   through backend-only `reserve_agent_quota(verified_user_id)`. A single conditional
   UPSERT on the existing unique user key performs the read/check/increment under
   PostgreSQL row locking, with no client-side read-then-write race. The database
   derives the limit from stored entitlements: 10 free or 999999 paid/active-trial
   reservations per **UTC day**. Exhaustion returns 429; database errors, missing or
   malformed quota responses return retryable 503 before model execution. Attempts
   that reserve quota but later fail still count; there is no refund or retry loop.
5. **Server-owned conversation history.** Client INSERT/UPDATE is revoked and the
   old INSERT policy removed. The Edge Function marks both ordinary and tax-redirect
   user/assistant message pairs `server_verified=true`; shared context retrieval
   requires that marker as well as the existing user/session predicates. This is
   write provenance, **not a claim that the model answer is correct**.

### Legacy conversation behavior

Existing rows receive `server_verified=false`; they are not automatically trusted
or backfilled. They remain in the database and in existing UI history, but are
excluded from future model context. New verified messages establish subsequent
context. Deploying an old handler after this migration creates unverified rows
and restores old endpoint behavior; it is not a safe security rollback.

## Validation

- `npm run test:authorization`: **80 passed** (36 real PostgreSQL/WASM migration
  checks, 40 actual-handler tests with mocked external boundaries, 4 frontend tests).
- `npm run test:semantic`: **59 passed**, including explicit verified-history
  predicate coverage in addition to user/session isolation.
- `npx tsc --noEmit -p tsconfig.app.json`: passed.
- `npm run build`: passed; existing chunk-size warnings remain.
- `deno check --no-lock supabase/functions/scrf-agent/index.ts
  supabase/functions/run-agent-evaluation/index.ts`: passed. The local Deno version
  cannot read the checked-in version-5 lockfile, so this check resolves the existing
  remote import specifiers without rewriting the lockfile. This is not a frozen
  dependency validation of the deployment runtime.
- The full Vitest suite still has the same **4 failing tests and 3 collection
  failures** previously recorded on the base. Do not describe it as fully green.
  Failures involve scoring exports, the critical-path suite, regulatory date
  expectations, and trial-expiry test module resolution; see command output.

Migration tests use relevant historical DDL, synthetic roles/JWT claims and local
PGlite. Handler tests execute transpiled repository handlers, substituting Supabase,
HTTP imports, context loading and a local model fixture. They do not test a hosted
Supabase gateway, billing provider, real model, or real multi-connection contention.

## Required deployment gates (operator action; not performed here)

1. Review the forward migration `20261113160000_authorization_hardening.sql` and
   replay the **full** migration chain in isolated Supabase staging, not production.
   Check actual grants (including any out-of-repo/column grants), function owners,
   signup trigger behavior, PostgREST schema cache, and the platform's default ACLs.
2. With staging-only identities, test normal signup, missing legacy subscription
   repair, own trial/save behavior, payment activation/cancellation/webhooks, own
   entitlement reads, administrator/non-administrator evaluations and chat persistence.
3. Use independent database connections to stress a nearly exhausted free quota;
   exactly the remaining number of reservations may succeed. Also test UTC rollover,
   active/expired trials, denied direct RPC access, and quota database outages.
4. Quiesce agent/evaluation traffic for the transition. Apply the migration **before**
   deploying the updated `scrf-agent` and shared context code, then deploy the
   updated evaluation handler and frontend as a coordinated release. Resume only
   after the negative and positive smoke tests pass. Neither semantic feature flag
   disables these security controls.
5. Audit historical entitlement changes and authority assignments separately;
   denying future writes does not establish whether past changes were legitimate.
   Do not bulk repair historical rows without a separately reviewed plan.

Do not roll back by restoring vulnerable client writes, public billing RPCs or the
old endpoint. Fail closed/quiesce the affected endpoint and ship a reviewed fix.

## Deliberately deferred

- **Finding 5:** user-erasure versus context/knowledge audit FK retention requires
  an explicit retention/anonymization decision before changing delete behavior.
- **Finding 6:** reviewer assignment/access for expert and validation records needs
  an agreed authorization model; current legacy policies are not changed here.
- Administrator-only evaluation is not a total spend cap or concurrency budget.
  Per-run cost bounds, cross-run evaluation budgets, reconciliation of legacy and
  newer subscription models, broad platform auditing and production model
  regressions remain separate work. This PR is not a platform-wide security sign-off.