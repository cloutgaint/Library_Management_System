-- Phase 5 additive migration. Review live schema and back up data before execution.
BEGIN;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedupe_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_uq
 ON notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS notification_deliveries (
 id BIGSERIAL PRIMARY KEY,
 notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
 channel VARCHAR(10) NOT NULL CHECK (channel IN ('email','sms')),
 destination TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Sent','Failed')),
 attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
 last_error TEXT,
 last_attempt_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE (notification_id, channel)
);
CREATE TABLE IF NOT EXISTS member_communication_preferences (
 member_id BIGINT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
 email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 sms_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reservations_ready_expiry_idx
 ON reservations(expires_at) WHERE status = 'Ready';
COMMIT;
