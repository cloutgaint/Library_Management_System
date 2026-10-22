BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'librarian', 'member')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  password_changed_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_admin_always_active CHECK (role <> 'admin' OR is_active)
);

-- Exactly one primary admin per installation.
CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_uq
  ON users ((role)) WHERE role = 'admin';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq
  ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS books (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(32) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Available',
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INTEGER NOT NULL DEFAULT 1
    CHECK (available_copies >= 0 AND available_copies <= total_copies),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  membership_start DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_expiry DATE NOT NULL,
  membership_status VARCHAR(20) NOT NULL DEFAULT 'Active'
    CHECK (membership_status IN ('Active', 'Expired', 'Suspended')),
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS borrow_transactions (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  transaction_status VARCHAR(20) NOT NULL DEFAULT 'Issued'
    CHECK (transaction_status IN ('Issued', 'Returned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (due_date >= issue_date),
  CHECK (return_date IS NULL OR return_date >= issue_date)
);

CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  reservation_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  queue_position INTEGER CHECK (queue_position IS NULL OR queue_position > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'Waiting'
    CHECK (status IN ('Waiting', 'Ready', 'Cancelled', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS reservations_active_member_book_idx
  ON reservations (member_id, book_id)
  WHERE status IN ('Waiting', 'Ready');

CREATE INDEX IF NOT EXISTS reservations_book_queue_idx
  ON reservations (book_id, queue_position)
  WHERE status = 'Waiting';

CREATE TABLE IF NOT EXISTS fines (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL UNIQUE
    REFERENCES borrow_transactions(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  fine_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (fine_amount >= 0),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Paid')),
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ebooks (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (book_id, user_id)
);

CREATE INDEX IF NOT EXISTS borrow_transactions_member_idx
  ON borrow_transactions (member_id, issue_date DESC);

CREATE INDEX IF NOT EXISTS borrow_transactions_status_idx
  ON borrow_transactions (transaction_status);

CREATE INDEX IF NOT EXISTS reviews_book_created_idx
  ON reviews (book_id, created_at DESC);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  purpose VARCHAR(20) NOT NULL DEFAULT 'reset'
    CONSTRAINT password_reset_tokens_purpose_chk CHECK (purpose IN ('reset', 'invite')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
  ON password_reset_tokens (user_id, created_at DESC);

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
