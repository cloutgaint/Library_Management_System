-- Rollback for 20261022_phase10_auth_roles.sql.
-- Removes only objects introduced by Phase 10. library_branches and
-- password_reset_tokens are shared with Phases 7 and 9 and are kept.
-- WARNING: account activation state, librarian branch assignments and the
-- account audit trail are discarded. No users or passwords are touched.
BEGIN;

DROP TABLE IF EXISTS user_account_audit;
DROP TABLE IF EXISTS librarian_branch_assignments;

ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_purpose_chk;
-- Invitation tokens would become usable as reset tokens once purpose is dropped.
UPDATE password_reset_tokens SET used_at = NOW() WHERE purpose = 'invite' AND used_at IS NULL;
ALTER TABLE password_reset_tokens DROP COLUMN IF EXISTS purpose;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_admin_always_active;
DROP INDEX IF EXISTS users_email_lower_uq;
DROP INDEX IF EXISTS users_single_admin_uq;

ALTER TABLE users
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS password_changed_at,
  DROP COLUMN IF EXISTS is_active;

COMMIT;
