# Phase 7 migration and reconciliation runbook

**Status: NOT APPLIED.** Repository-only access cannot inspect the live PostgreSQL schema or take a backup. Do not run the Phase 7 migration on production until these checks pass.

## Preflight (read-only)

1. Back up the database using the team's approved backup and restore procedure; test restoring to staging.
2. Inspect `information_schema.columns`, `pg_indexes`, foreign keys, triggers, and migrations applied in the live database. Confirm compatibility with the SQL migration.
3. Reconcile each book's `total_copies`, `available_copies`, active issued transactions, and reservation allocations. Check:
   - `total_copies >= available_copies >= 0`
   - `COUNT(*) FILTER (WHERE transaction_status='Issued') <= total_copies` for every book
   - Difference between unavailable and issued copies may reflect historical damage or inventory corrections; investigate rather than assuming.
4. Agree on the initial branch assignment for every existing physical copy. Never invent barcodes or assign an issued copy to an available shelf.
5. Identify Phase 4 and Phase 5 branch migrations and reconcile them before any shared deployment.

## Safe rollout

- Apply migration to a restored staging database first.
- Create branch records, then reconcile existing physical copies with verified barcodes.
- Map each active loan to exactly one issued copy, using a verified physical identity. Unmatched loans stay legacy/unassigned until resolved.
- Compare copy-level and aggregate availability before enabling branch-aware circulation or transfers.
- Do not expose copy registration and transfer operations to staff in production until this reconciliation and circulation integration is complete.
- Perform a second reconciliation after every staged test operation.
- Roll back application code on mismatch; do not drop audit tables or erase movement history.

## Critical integration gap

The current `borrowTransactionModel.js` still uses global book counts for legacy issue and return operations. The new copy registry and transfers must not be considered authoritative until that circulation path is integrated and all existing loans are reconciled. The migration intentionally does not auto-backfill copies, because a safe mapping cannot be inferred from aggregate counts alone.

## Verification commands

- `npm test` in `backend/` after adding/running the test script.
- `npm run build` in `frontend/`.
- Exercise concurrent issue/transfer, lost-copy return, cancelled transfers, received transfers, and reservations at multiple branches on staging.
- Verify no negative stock, duplicate active loans, or lost history.
