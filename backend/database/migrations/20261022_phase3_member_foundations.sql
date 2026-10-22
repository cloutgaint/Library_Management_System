-- Phase 3: REVIEW BEFORE APPLYING to an existing PostgreSQL database.
-- Compare live information_schema columns, constraints, and existing rows first.
-- Do not run without a backup. Existing BIGINT primary/foreign keys are preserved.
BEGIN;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS membership_number VARCHAR(64),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- A deterministic unique identifier for legacy records. New records can use
-- the same scheme without changing any existing member or user IDs.
UPDATE members
SET membership_number = 'LMS-' || LPAD(id::text, 8, '0')
WHERE membership_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS members_membership_number_uq
  ON members (membership_number)
  WHERE membership_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS membership_status_history (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL
    CHECK (new_status IN ('Active', 'Expired', 'Suspended')),
  reason TEXT,
  changed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS membership_status_history_member_idx
  ON membership_status_history (member_id, changed_at DESC);

COMMIT;
