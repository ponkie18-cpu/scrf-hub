# Pre-Deployment Checklist

Before every deployment to production:

- [ ] `npm run smoke` — all 15 critical path tests must pass
- [ ] Check database migration has been applied to production
- [ ] Verify billing-webhook is registered in Paystack production dashboard
- [ ] Confirm regulatory_updates table has current content
- [ ] Smoke test result saved to deployment log

## Critical Path Test Summary

| # | Critical Path | Feature Tested | Est. Time |
|---|---|---|---|
| CP01 | User Registration | Auth: new user registers and reaches wizard | < 3s |
| CP02 | Login & Session | Auth: login, Pro state loads correctly | < 3s |
| CP03 | Pro Gate Enforcement | Auth: free user blocked on Pro, allowed on free | < 3s |
| CP04 | SPOF Finder Submit | Tools: assessment saves, actions triggered | < 5s |
| CP05 | Financial Scorecard | Tools: score, benchmark, AI narrative | < 8s |
| CP06 | Action Center CRUD | Tools: create, update, complete items | < 4s |
| CP07 | Regulatory Alerts | Tools: alerts filter by industry, review logs | < 4s |
| CP08 | PDF Generation Queue | Tools: async job queued, download appears | < 5s |
| CP09 | Agent Chat & Context | AI: chat opens, sends, context injected | < 8s |
| CP10 | Agent Rate Limit | AI: free user blocked at exactly 10 calls | < 5s |
| CP11 | Agent API Failure | AI: graceful fallback on 503, recovery works | < 5s |
| CP12 | Trial Expiry Gate | Billing: expired state blocks Pro, shows modal | < 4s |
| CP13 | Webhook Processing | Billing: valid webhook updates DB, replay blocked | < 4s |
| CP14 | Cross-User Isolation | Data: User B sees zero rows of User A data | < 3s |
| CP15 | Dashboard Consistency | Data: all 4 widgets render with correct scores | < 5s |

## Deployment Gate

If any one of these 15 tests fails, the deployment is **blocked**. Total runtime target: < 75 seconds.

```bash
npm run smoke
```
