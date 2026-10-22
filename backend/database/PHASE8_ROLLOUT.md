# Phase 8 deployment gates

**Migration not applied. Live database has not been inspected.**

1. Confirm actual PostgreSQL schema, constraints, migration ledger, row counts, and backup/restore readiness.
2. Apply `20261022_phase8_settings.sql` to staging only, then verify tables and settings audit inserts.
3. Run backend tests with `node --test tests/phase8.structure.test.js` and existing project tests.
4. Run frontend `npm run build` and lint, then verify role-specific dashboard responses and navigation.
5. Verify that members cannot access staff reports or other members' records.
6. Verify report pagination, date filters, CSV export, and fine totals against SQL ground truth.
7. Test rollback by reverting application code; preserve settings audit records.

**Known gaps:** Settings are stored but existing issue/return/fine/reservation workflows do not yet consume the new policy values. The analytics/chart pages still use legacy client-side aggregation. CSV export currently exports only the displayed page. Phase 7 branch inventory is not merged and is intentionally excluded from Phase 8 reporting. No production readiness claim should be made.
