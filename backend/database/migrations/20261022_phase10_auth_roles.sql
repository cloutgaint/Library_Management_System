-- Phase 10: account status, single primary admin, librarian branch assignments
-- and invitation tokens.
-- Additive only: no DROP, DELETE, role change or password change is performed.
-- The pre-flight block aborts the whole transaction (leaving the database
-- untouched) when duplicate admins or case-insensitive duplicate emails exist,
-- so they can be resolved explicitly instead of being demoted automatically.
-- Rollback: 20261022_phase10_auth_roles.down.sql
BEGIN;

DO $$
DECLARE
  admin_ids TEXT;
  duplicate_emails TEXT;
BEGIN
  SELECT string_agg(id::text, ', ' ORDER BY id) INTO admin_ids
  FROM users WHERE role = 'admin'
  HAVING COUNT(*) > 1;

  IF admin_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 10 aborted: multiple admin accounts exist (user ids: %). Choose the primary admin and change the others explicitly before applying.', admin_ids;
  END IF;

  SELECT string_agg(e, ', ') INTO duplicate_emails
  FROM (SELECT LOWER(email) AS e FROM users GROUP BY 1 HAVING COUNT(*) > 1) d;

  IF duplicate_emails IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 10 aborted: emails differing only by case exist (%). Resolve them before applying.', duplicate_emails;
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Exactly one primary admin: a second admin row (insert or role update) violates
-- this index, which also serialises concurrent bootstrap attempts.
CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_uq
  ON users ((role)) WHERE role = 'admin';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq
  ON users (LOWER(email));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_admin_always_active') THEN
    -- The primary admin can never be deactivated, which would lock out the installation.
    ALTER TABLE users ADD CONSTRAINT users_admin_always_active CHECK (role <> 'admin' OR is_active);
  END IF;
END $$;

-- Same definition as Phase 7, so either migration may run first.
CREATE TABLE IF NOT EXISTS library_branches (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS librarian_branch_assignments (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id BIGINT NOT NULL REFERENCES library_branches(id) ON DELETE RESTRICT,
  assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS librarian_branch_assignments_branch_idx
  ON librarian_branch_assignments (branch_id);

-- Same definition as Phase 9, so either migration may run first.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
  ON password_reset_tokens (user_id, created_at DESC);

-- 'invite' tokens let newly created staff choose their own password.
ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(20) NOT NULL DEFAULT 'reset';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_purpose_chk') THEN
    ALTER TABLE password_reset_tokens
      ADD CONSTRAINT password_reset_tokens_purpose_chk CHECK (purpose IN ('reset', 'invite'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_account_audit (
  id BIGSERIAL PRIMARY KEY,
  target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(40) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_account_audit_target_idx
  ON user_account_audit (target_user_id, created_at DESC);

COMMIT;
