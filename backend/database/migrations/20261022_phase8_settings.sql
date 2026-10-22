-- Phase 8 additive settings migration.
-- NOT APPLIED: inspect live schema, back up and test on staging first.
BEGIN;
CREATE TABLE IF NOT EXISTS library_settings (
 key VARCHAR(80) PRIMARY KEY,
 value JSONB NOT NULL,
 updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS library_settings_audit (
 id BIGSERIAL PRIMARY KEY,
 key VARCHAR(80) NOT NULL,
 previous_value JSONB,
 new_value JSONB NOT NULL,
 actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
 changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS library_settings_audit_key_changed_idx
 ON library_settings_audit(key,changed_at DESC);
COMMIT;
