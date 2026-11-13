# Semantic context layer v1 — review and rollout

## Status and scope

This change prepares code and migrations. It does **not** deploy Edge Functions,
apply migrations, approve existing knowledge, query customer data, or run paid/model evaluations.
The default `SCRF_SEMANTIC_CONTEXT_V1` flag is off. New context audit logging is
also opt-in via `SCRF_CONTEXT_AUDIT_ENABLED=true`; keep it off until retention is configured.

The new layer is an explicit evidence contract, not a vector database or agent
memory product. Standard chat and conversation use its shared renderer when the
flag is `true`. Specialised tool modes retain their existing response contracts;
they receive server-owned context and warnings, with tool inputs labelled
unverified. They do not yet implement the structured evidence-validation path.

## Contract and authority

1. Verify the JWT using `auth.getUser` and take user identity only from that result.
2. Resolve that user's profile and company. Missing/error scope fails closed.
   A migration prevents ordinary users rewriting their company membership or role.
3. Assessment and action visibility remains **own user only**, even for colleagues
   in one company. Alerts are own-company plus explicitly global (`company_id IS NULL`).
4. Load the latest assessment independently for each of the four domains, with
   timestamp/ID tie-breaking. One busy domain cannot displace another from a top-N window.
5. Distinguish `available`, successful `missing`, and query/validation
   `unavailable`. A failed action or weights query makes adjusted scores unavailable,
   not zero and not proof of no risk. Successful absence of custom weights uses defaults.
6. Conversation history is fetched by **both** verified user ID and validated
   session UUID (latest 12 messages, at most 4,000 characters each). Caller-supplied
   history, roles, scores, company and profile cannot overwrite server context.
   An allowlisted `context.currentDomain` is a relevance hint only.

## Scores and dates

`_shared/scoring/calculateScores.ts` is shared by scoring-engine and agent.
Scores are points on 0–100; higher is better. Age factors use strict boundaries:
over 30 days = .95; over 90 days = .90. Open actions subtract high/medium/low =
5/3/1 points, capped at 20 per domain. Adjusted values are floored at zero.
Displayed domains are rounded, but overall weighting uses the **unrounded**
values and renormalises over assessed weighted domains before rounding.

The context represents no assessment as a missing score, not 0. The legacy
scoring API retains numeric 0 for compatibility and now supplies `scoreStatus`
and `coverage`; older clients must adopt those fields before claiming that 0 is
a measured score. Dashboard and agent use the same DATE-only overdue comparison:
an action due today is not overdue. Existing dashboard action summaries remain
bounded to its 50-row display query; agent scoring loads all open actions up to
the explicit 10,000-row safety limit (then reports unavailable, not partial totals).

## Governed knowledge

Migration `20261113120100` leaves **all old knowledge in draft**, including entries
whose old correction flag said applied. It never silently approves legacy content.
Retrieval requires approved status, valid scope/company, matching explicit
jurisdiction or `*`, an effective interval covering the context time, and an
unexpired review date when supplied. An unknown country does not assume ZA.
Validity and scope are filtered before the 100-candidate retrieval bound.

Publication is deliberately separate from storing a correction:

- An administrator chooses **Submit for approval**. The authenticated RPC snapshots
  the correction text, domain and supporting reference with the verified submitter UUID.
- A **different** administrator reviews the snapshot in Pending Approvals, selects
  an explicit jurisdiction and future review date, and approves. This publishes
  **global guidance within that jurisdiction**. It must contain no customer-specific
  information. Company-scoped storage/retrieval exists, but this UI does not publish
  company-private knowledge.
- SQL enforces the role, four-eyes rule, unchanged snapshot and status transition;
  it inserts the versioned knowledge, marks the correction/review, and writes its
  audit record in one transaction. A repeated approval of the same proposal returns
  the same publication. A failed audit write rolls back the publication.
- Legacy proposals with email-only identities cannot be approved: resubmit them.
  Direct authenticated writes to the approval table and knowledge table cannot publish.

The frontend route guard now consults `user_roles`, not a nonexistent AuthContext
profile property; SQL remains the enforcement boundary. Two trusted administrators
must already be provisioned using the existing administrative process. Do not
bootstrap roles from editable profile fields.

## Prompt, sources and observability

Shared policy is versioned independently from scores. Retrieved text and tool
inputs are evidence data, not instructions. Selection includes at most 10 urgent
actions, 5 alerts and 5 approved knowledge entries, with a combined 10,000-character
knowledge budget. Guidance is included whole or omitted, never cut mid-rule.
This is deterministic domain ranking over the bounded candidates, not semantic
embedding search. Action/alert strings and server history are individually bounded.

Standard/conversation responses validate the structured shape and tool IDs, then
validate every returned evidence ID against the selected registry. Unknown IDs
withhold the answer. Missing citations produce an explicit warning, not a claim
of verified grounding. IDs establish source membership, **not entailment or factual
correctness**. Existing score/tax heuristics are not a comprehensive safety proof.
The UI displays “Based on” and “Data limitations” as escaped text, never arbitrary links.
Streaming briefings cannot use the final structured-answer validator; core source
outages stop generation with 503 rather than produce an unqualified all-clear.

`agent_context_events` records versions, configuration hash, selected evidence
identifiers/timestamps, scope IDs, source statuses, coverage, fetch latency and
categorical validation outcomes. It contains no raw prompts, business descriptions
or response text. It is still sensitive metadata. Owners/admins can read unexpired
rows; inserts/updates are service-only. Token counts are nullable and currently
**not measured**. Non-structured modes may have no final validation event.

Rows get `expires_at = created_at + 30 days`, but **SQL expiry is not physical
deletion**. Before enabling production logging, approve and configure an operator
retention job, including backups, and verify physical cleanup. No purge or schedule
is installed by these migrations.

## Local verification

```sh
npm ci --ignore-scripts
npm run test:semantic
npx tsc -p tsconfig.app.json --noEmit
npm run build
deno check --no-lock supabase/functions/scrf-agent/index.ts supabase/functions/scoring-engine/index.ts supabase/functions/apply-knowledge-correction/index.ts supabase/functions/run-agent-evaluation/index.ts
```

The SQL tests execute the three new migrations against relevant historical DDL
in isolated PGlite PostgreSQL, with synthetic users and real RLS, triggers and
transactional RPC checks. They are not a substitute for a Supabase staging replay
of the full migration history, platform privileges, signup hooks and deployed endpoints.
The lockfile is reconciled with pre-existing package.json dependencies; PGlite is
an additional dev-only dependency. No install lifecycle scripts are required.

The existing full Vitest suite also has baseline failures: three suites require
Supabase frontend environment configuration, one regulatory fixture assumes a
future date that is now past, and three trial-gate tests use unresolved CommonJS
`require` aliases. These reproduce on base commit `5e0c6cd` with the same dependencies.
Do not point those tests at production merely to make them pass.

`run-agent-evaluation` now uses the shared schema, scorer, synthetic fixture adapter
and prompt renderer. It is **not** a full endpoint replay: authentication,
interception, structured tool validation, knowledge retrieval and SSE are not covered
by that model-based evaluation. No model evaluation was executed for this change.

### Recorded verification results

- `npm run test:semantic`: **59/59 pass** across four files.
- Frontend TypeScript and production build: **pass** (large-chunk warning remains).
- Deno type checks: **pass** for the four changed Edge Functions.
- ESLint: **pass** for the new shared modules and four test files, plus the
  changed route guard and provenance component; not a full-repository lint claim.
- Full Vitest run: **146 pass**, four failed test cases and three failed collection
  suites (five failed files overall). The unchanged base reproduces the same
  seven failure entries; the branch adds 59 passing tests.

## Deployment discovery

The repository README describes a Lovable-managed frontend, with manual
**Share → Publish**. It contains Supabase Edge Functions and migrations, but
no checked-in GitHub Actions deployment workflow or staging environment definition
was found at the reviewed base commit. There is no automatic deployment pipeline
added by this PR. Branch preview behaviour, the staging project and the operator's
Supabase/Lovable release permissions must be confirmed before rollout.

## Staging gates and rollout

1. Review all SQL/security changes. Replay the full migration history on local or
   isolated Supabase staging; validate existing signup, onboarding and admin workflows.
   Audit pre-existing company memberships and user_roles: restrictions do not repair
   any historical misassignment.
2. Quiesce the old correction endpoint during the code/schema transition. Apply
   `20261113120000`, `...120100`, then `...120200`; deploy the new correction handler,
   scoring-engine, scrf-agent and frontend as a coordinated release. The old handler
   uses service-role writes and must not be kept as the approval path.
3. Keep `SCRF_SEMANTIC_CONTEXT_V1` unset/false initially. The shared scorer,
   ownership checks, safe source states and server history are security/correctness
   fixes and remain active regardless of this flag. Regenerate Supabase TypeScript
   types against local/staging schema before the next broader schema change.
4. Configure the approved metadata retention process before setting
   `SCRF_CONTEXT_AUDIT_ENABLED=true`. Independently review/reapprove
   a small set of non-customer-specific knowledge; test ZA, non-ZA, unknown country,
   expired/review-due guidance, foreign IDs, cross-company access and source outages.
5. Enable the flag in staging; compare dashboard/agent adjusted scores and coverage
   at a fixed time, test session isolation, prompt injection fixtures and UI provenance.
   Run separately authorised model regressions, then canary in production only after
   deployment approval, with latency/outage/validation/invalid-reference monitoring.

Rollback the **prompt/retrieval** rollout by setting the flag false. Do not undo
membership or approval restrictions to restore old behaviour. Keep migrations and
publication history; reversing them requires a separate reviewed data migration.
This flag is not a rollback of the scoring refactor or the security fixes.

## Follow-up authorization hardening

See [Agent and subscription authorization hardening](authorization-hardening.md)
for backend-owned entitlements, restricted billing/trial RPCs, administrator-only
evaluations, atomic quota reservation, and server-verified history. That follow-up
adds a required forward migration and coordinated deployment gates; neither this
document nor the tests establish that a hosted environment has been remediated.