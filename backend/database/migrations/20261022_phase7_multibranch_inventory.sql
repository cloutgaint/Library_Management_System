-- Phase 7: additive foundations. DO NOT run without live schema inspection and backup.
-- Existing aggregate books/loans remain authoritative until copy-level reconciliation.
BEGIN;
CREATE TABLE IF NOT EXISTS library_branches (
 id BIGSERIAL PRIMARY KEY, code VARCHAR(32) NOT NULL UNIQUE,
 name VARCHAR(160) NOT NULL, address TEXT NOT NULL DEFAULT '',
 is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS book_copies (
 id BIGSERIAL PRIMARY KEY, book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
 branch_id BIGINT NOT NULL REFERENCES library_branches(id) ON DELETE RESTRICT,
 barcode VARCHAR(100) NOT NULL UNIQUE, shelf_location VARCHAR(120),
 condition VARCHAR(20) NOT NULL DEFAULT 'Good'
 CHECK (condition IN ('Good','Worn','Damaged','Lost','Repair')),
 circulation_status VARCHAR(20) NOT NULL DEFAULT 'Available'
 CHECK (circulation_status IN ('Available','Issued','InTransit','Unavailable')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS book_copies_branch_book_idx ON book_copies(branch_id,book_id);
ALTER TABLE borrow_transactions ADD COLUMN IF NOT EXISTS copy_id BIGINT REFERENCES book_copies(id);
ALTER TABLE borrow_transactions ADD COLUMN IF NOT EXISTS issue_branch_id BIGINT REFERENCES library_branches(id);
ALTER TABLE borrow_transactions ADD COLUMN IF NOT EXISTS return_branch_id BIGINT REFERENCES library_branches(id);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pickup_branch_id BIGINT REFERENCES library_branches(id);
CREATE UNIQUE INDEX IF NOT EXISTS book_copies_one_active_loan_idx
 ON borrow_transactions(copy_id) WHERE transaction_status='Issued' AND copy_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS inventory_movements (
 id BIGSERIAL PRIMARY KEY, copy_id BIGINT NOT NULL REFERENCES book_copies(id),
 from_branch_id BIGINT REFERENCES library_branches(id), to_branch_id BIGINT REFERENCES library_branches(id),
 movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('Transfer','Issue','Return','Adjustment','Condition')),
 actor_user_id BIGINT REFERENCES users(id), reference_id BIGINT, note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS branch_transfers (
 id BIGSERIAL PRIMARY KEY, copy_id BIGINT NOT NULL REFERENCES book_copies(id),
 source_branch_id BIGINT NOT NULL REFERENCES library_branches(id),
 destination_branch_id BIGINT NOT NULL REFERENCES library_branches(id),
 status VARCHAR(20) NOT NULL DEFAULT 'Requested'
 CHECK (status IN ('Requested','Approved','Dispatched','Received','Cancelled','Rejected')),
 requested_by BIGINT NOT NULL REFERENCES users(id), reviewed_by BIGINT REFERENCES users(id),
 requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK (source_branch_id <> destination_branch_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS branch_transfers_active_copy_idx ON branch_transfers(copy_id)
 WHERE status IN ('Requested','Approved','Dispatched');
CREATE TABLE IF NOT EXISTS branch_transfer_events (
 id BIGSERIAL PRIMARY KEY, transfer_id BIGINT NOT NULL REFERENCES branch_transfers(id),
 old_status VARCHAR(20), new_status VARCHAR(20) NOT NULL,
 actor_user_id BIGINT NOT NULL REFERENCES users(id), note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS periodical_subscriptions (
 id BIGSERIAL PRIMARY KEY, branch_id BIGINT NOT NULL REFERENCES library_branches(id),
 title VARCHAR(255) NOT NULL, issn VARCHAR(32), publisher VARCHAR(255),
 frequency VARCHAR(40), starts_on DATE, ends_on DATE,
 status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Paused','Expired')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS periodical_issues (
 id BIGSERIAL PRIMARY KEY, subscription_id BIGINT NOT NULL REFERENCES periodical_subscriptions(id),
 volume VARCHAR(80), issue_number VARCHAR(80), expected_on DATE,
 received_on DATE, status VARCHAR(20) NOT NULL DEFAULT 'Expected'
 CHECK (status IN ('Expected','Received','Missing')),
 UNIQUE(subscription_id,volume,issue_number)
);
CREATE TABLE IF NOT EXISTS copy_condition_events (
 id BIGSERIAL PRIMARY KEY, copy_id BIGINT NOT NULL REFERENCES book_copies(id),
 previous_condition VARCHAR(20) NOT NULL, new_condition VARCHAR(20) NOT NULL
 CHECK (new_condition IN ('Good','Worn','Damaged','Lost','Repair')),
 reported_by BIGINT NOT NULL REFERENCES users(id), note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
