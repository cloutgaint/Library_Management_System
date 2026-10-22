-- Phase 6 additive migration: inspect live schema and back up before applying.
BEGIN;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'Approved'
  CHECK (moderation_status IN ('Pending','Approved','Rejected'));
CREATE TABLE IF NOT EXISTS book_requisitions (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(32),
  reason TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Approved','Rejected','Ordered','Acquired')),
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  decision_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS book_requisitions_member_idx
  ON book_requisitions(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS book_requisitions_status_idx
  ON book_requisitions(status, created_at DESC);
CREATE TABLE IF NOT EXISTS book_requisition_history (
  id BIGSERIAL PRIMARY KEY,
  requisition_id BIGINT NOT NULL REFERENCES book_requisitions(id) ON DELETE RESTRICT,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
