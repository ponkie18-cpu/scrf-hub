# Reproducible security validation

**Status: executable workflow added; inspect the PR's GitHub Actions checks for
validation results.** Full local Supabase replay/concurrency requires Docker and
`psql`, which are unavailable in the ARIA sandbox. Workflow publication alone is
not evidence that these checks passed. The prior permission-blocked proposal is
preserved in `security-validation-workflow.md` for reference.

The `Security validation` GitHub Actions workflow will
run on pull requests, pushes to `main`, and manual dispatch. It requests read-only
repository permissions, consumes no repository/environment secrets, and contains
no hosted Supabase link, database push/reset, function deployment, payment request,
or live model evaluation.

## Gates

1. **Application security:** `npm ci`, CI-script safety checks, authorization
   regressions, semantic-context regressions, application TypeScript and build.
   Handler tests retain mocked external boundaries; they are not live evaluations.
2. **Full historical replay:** copy every repository migration byte-for-byte
   into a new Supabase project inside `RUNNER_TEMP`. Start a fresh local Supabase
   database; any SQL error fails the job. The normal project config (and its hosted
   project ID) is not used. Compare the complete applied migration-version list
   against the source manifest and verify the copied SQL SHA-256 values.
3. **Real database authority:** real Supabase `auth.users` signup triggers; SQL
   roles plus matching JWT claims; anonymous/member/admin denial of client billing
   writes, billing RPCs, quota RPCs and forged conversation writes; own-account
   reads/trials; service-role billing and verified history; admin-only evaluation
   question management. Administrator permission does not grant billing authority.
4. **Independent-connection contention:** 30 separate `psql` processes race on a
   fresh free-tier user; exactly 10 must succeed and 20 must fail, with a persisted
   count of 10 and unique backend process IDs. Repeat on an expired UTC quota
   window. Test paid, active-trial and expired-trial boundaries without making
   999999 calls. No LLM inference is invoked or charged.

The runner is fixed to `127.0.0.1:55432`, the local `postgres` database and local
development password. It accepts no database URL. It checks a CI-only safety
marker before fixture writes and refuses workdirs outside `RUNNER_TEMP`.
Preparation refuses existing directories. No test resets a database or deletes
application rows; the disposable hosted runner's lifecycle owns resource cleanup.
The marker migration is generated only in the workdir, never deployed or committed
to `supabase/migrations`.

Once activated, replay output, database-test output and the migration manifest will be retained as
Actions artifacts for seven days, including when a gate fails. CLI startup output
may contain disposable local development keys; these are not hosted credentials.
Official Actions are pinned to commit SHAs and Supabase CLI to an exact release.

## Reproduce on a dedicated development machine

Requires Node 22.16+, Supabase CLI 3.1.0, a local Docker runtime and `psql`.
Do **not** use this against an existing staging or production database.

```bash
npm ci
npm run test:security-ci
npm run test:authorization
npm run test:semantic

# Choose a NEW throwaway parent/workdir; preparation refuses an existing workdir.
export RUNNER_TEMP="$(mktemp -d)"
export CI_DB_WORKDIR="$RUNNER_TEMP/scrf-security-db"
node scripts/prepare-security-db.mjs "$CI_DB_WORKDIR"
supabase start --workdir "$CI_DB_WORKDIR"
npm run test:security-db -- "$CI_DB_WORKDIR"
```

Keep local ports 55430–55432 free. Do not point any hosted project at these
scripts. The workflow does not alter repository branch-protection settings;
maintainers should make both jobs required checks after a successful first run.

## Newly reproduced authorization gap

The prior hardening migration protected legacy `user_subscriptions`, but the
newer `subscriptions` table retained client INSERT/UPDATE policies. Its
`plan_type` is read by `get-billing-status` and `usePlanAccess`, so it also needs
backend ownership. A local diagnostic using the historical application DDL and
Supabase-style grants confirmed a member could persist `plan_type='pro'`.
That diagnostic used PGlite with Supabase publications/extensions omitted; it
does not establish any hosted database's state.

Forward migration `20261113170000_billing_subscription_authority.sql` removes
those client write policies/grants and adds an invoker-security update guard.
Owner reads, signup provisioning and service-role billing writes remain intact.
Existing rows are preserved; no backfill, billing-state synchronization or policy
change for retention/reviewers is included. Nine additional PGlite regressions
cover this table, including accidental grant/policy restoration.

## Limits and deployment

Passing the proposed workflow would demonstrate repository SQL on a fresh local stack, not
the state of an existing hosted database. It does not cover hosted gateway JWT
validation, out-of-repo grants, payments/webhook delivery, real administrator
evaluation inference, or existing production drift. Existing unrelated full-suite
failures remain outside these targeted gates; this is not a claim of full-suite
health. See `authorization-hardening.md` for the broader operator checklist.

Before deployment: inspect the workflow results, replay on isolated hosted staging,
test real signup and service-role billing flows, and review actual grants/owners.
Apply the new forward migration through the normal authorized migration process;
merging this PR does not itself apply SQL or deploy Edge Functions. It installs
the validation workflow on the default branch.