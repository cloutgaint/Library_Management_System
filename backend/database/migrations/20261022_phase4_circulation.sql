-- Phase 4 additive migration. Inspect the live database schema and take a backup before applying.
BEGIN;
ALTER TABLE borrow_transactions
  ADD COLUMN IF NOT EXISTS renewal_count INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS circulation_policy (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  max_active_loans INTEGER NOT NULL DEFAULT 5 CHECK (max_active_loans > 0),
  max_renewals INTEGER NOT NULL DEFAULT 2 CHECK (max_renewals >= 0),
  fine_per_day NUMERIC(10,2) NOT NULL DEFAULT 5.00 CHECK (fine_per_day >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO circulation_policy(id) VALUES (1) ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS fine_payment_audit (
  id BIGSERIAL PRIMARY KEY,
  fine_id BIGINT NOT NULL REFERENCES fines(id) ON DELETE RESTRICT,
  recorded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash','bank_transfer','other')),
  reference TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS borrow_transactions_overdue_idx
  ON borrow_transactions (due_date) WHERE transaction_status = 'Issued';
COMMIT;
