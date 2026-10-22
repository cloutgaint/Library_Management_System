-- LMS Phase 2: additive catalog foundations.
-- REVIEW ONLY until compared with the target database using information_schema.
-- Apply once on a backed-up database during a maintenance window.
BEGIN;

CREATE TABLE IF NOT EXISTS book_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_id BIGINT REFERENCES book_categories(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT book_categories_not_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

INSERT INTO book_categories (name)
SELECT DISTINCT BTRIM(category)
FROM books
WHERE NULLIF(BTRIM(category), '') IS NOT NULL
ON CONFLICT (name) DO NOTHING;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES book_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS publisher VARCHAR(255),
  ADD COLUMN IF NOT EXISTS edition VARCHAR(100),
  ADD COLUMN IF NOT EXISTS publication_year INTEGER,
  ADD COLUMN IF NOT EXISTS language VARCHAR(100),
  ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(100),
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

UPDATE books b
SET category_id = c.id
FROM book_categories c
WHERE b.category_id IS NULL AND c.name = BTRIM(b.category);

CREATE INDEX IF NOT EXISTS books_category_id_idx ON books (category_id);
CREATE INDEX IF NOT EXISTS books_active_title_idx ON books (title) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS books_active_isbn_idx ON books (isbn) WHERE is_archived = FALSE;

-- Preserve existing numeric IDs, text categories, borrowing history and copy constraints.
-- No DROP, DELETE or ID type conversion is performed.
COMMIT;
