# Pending workflow — repository administrator action required

The connected GitHub token cannot create/update executable workflows: GitHub
requires the classic PAT `workflow` scope (or fine-grained **Workflows: write**).
This is a non-executable proposal, not installed or validated CI. A repository
administrator can review this configuration and add it as
`.github/workflows/security-validation.yml`, or grant the required token permission
and ask ARIA to publish it. No GitHub permissions or protection rules were changed.

```yaml
name: Security validation

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

# No production secrets, environments, deploy steps, or repository write access.
permissions:
  contents: read

jobs:
  application-security:
    name: Authorization, semantic context and build
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.16.0
          cache: npm
      - run: npm ci
      - run: npm run test:security-ci
      - run: npm run test:authorization
      - run: npm run test:semantic
      - run: npx tsc --noEmit -p tsconfig.app.json
      - run: npm run build

  database-security:
    name: Full migration replay and independent-connection quotas
    runs-on: ubuntu-24.04
    timeout-minutes: 25
    env:
      CI_DB_WORKDIR: ${{ runner.temp }}/scrf-security-db
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.16.0
      - uses: supabase/setup-cli@1dedf2c611547ede7232d26866dd3c56ab903bbb # v1
        with:
          version: 3.1.0
      - name: Install PostgreSQL client only
        run: sudo apt-get update -qq && sudo apt-get install -y postgresql-client
      - name: Prepare isolated local project and byte-for-byte migrations
        run: node scripts/prepare-security-db.mjs "$CI_DB_WORKDIR"
      - name: Start fresh local Supabase and replay ALL migrations
        shell: bash
        run: |
          set -euo pipefail
          supabase start --workdir "$CI_DB_WORKDIR" 2>&1 | tee "$RUNNER_TEMP/migration-replay.log"
      - name: Database authorization and real concurrent quota tests
        shell: bash
        run: |
          set -euo pipefail
          node scripts/test-security-db.mjs "$CI_DB_WORKDIR" 2>&1 | tee "$RUNNER_TEMP/database-security.log"
      - name: Preserve replay evidence (also on failure)
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: disposable-database-security-evidence
          retention-days: 7
          if-no-files-found: warn
          path: |
            ${{ runner.temp }}/migration-replay.log
            ${{ runner.temp }}/database-security.log
            ${{ runner.temp }}/scrf-security-db/migration-manifest.json
```