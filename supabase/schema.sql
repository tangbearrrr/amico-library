-- ============================================================
-- Amico Library — Supabase Schema
-- Run this entire script once in the Supabase SQL Editor.
-- ============================================================


-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  full_name   text,
  avatar_url  text,
  role        text        NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE books (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  author        text,
  isbn          text,
  cover_url     text,
  total_copies  int         NOT NULL DEFAULT 1 CHECK (total_copies >= 1),
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES profiles(id) ON DELETE SET NULL
);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE TABLE borrow_records (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id        uuid        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  borrower_name  text        NOT NULL,
  borrower_note  text,
  staff_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  borrow_date    date        NOT NULL DEFAULT current_date,
  due_date       date        NOT NULL,
  return_date    date,
  status         text        NOT NULL DEFAULT 'borrowed'
                               CHECK (status IN ('borrowed', 'returned', 'overdue')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT due_after_borrow    CHECK (due_date    >= borrow_date),
  CONSTRAINT return_after_borrow CHECK (return_date IS NULL OR return_date >= borrow_date)
);
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;


-- ── Indexes ──────────────────────────────────────────────────

-- Available-copies query: filter by book_id + exclude returned records
CREATE INDEX idx_borrow_book_status ON borrow_records (book_id, status);

-- Overdue sweep: scan only non-returned records by due_date
CREATE INDEX idx_borrow_due_date ON borrow_records (due_date)
  WHERE status <> 'returned';

-- History page: filter records by the staff member who logged them
CREATE INDEX idx_borrow_staff_id ON borrow_records (staff_id);


-- ── Helper functions ──────────────────────────────────────────

-- Returns the calling user's role from profiles.
-- SECURITY DEFINER lets RLS policies call this without recursion.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Returns how many copies of a book are currently on the shelf.
CREATE OR REPLACE FUNCTION get_available_copies(p_book_id uuid)
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    b.total_copies - COUNT(r.id) FILTER (WHERE r.status <> 'returned'),
    b.total_copies
  )::int
  FROM  books b
  LEFT  JOIN borrow_records r ON r.book_id = b.id
  WHERE b.id = p_book_id
  GROUP BY b.total_copies;
$$;

-- Flips status to 'overdue' for all borrowed records past their due date.
-- Schedule this as a daily pg_cron job or Supabase Edge Function.
CREATE OR REPLACE FUNCTION mark_overdue_records()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE borrow_records
  SET    status = 'overdue'
  WHERE  status   = 'borrowed'
    AND  due_date < current_date;
$$;


-- ── View ─────────────────────────────────────────────────────

-- Adds computed available_copies to every books row.
CREATE OR REPLACE VIEW book_availability AS
SELECT
  b.*,
  COALESCE(
    b.total_copies - COUNT(r.id) FILTER (WHERE r.status <> 'returned'),
    b.total_copies
  )::int AS available_copies
FROM  books b
LEFT  JOIN borrow_records r ON r.book_id = b.id
GROUP BY b.id;


-- ── RLS policies: profiles ────────────────────────────────────

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');


-- ── RLS policies: books ───────────────────────────────────────

CREATE POLICY "books_select"
  ON books FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "books_insert"
  ON books FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));

CREATE POLICY "books_update"
  ON books FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));

CREATE POLICY "books_delete_admin"
  ON books FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');


-- ── RLS policies: borrow_records ──────────────────────────────

CREATE POLICY "borrow_select"
  ON borrow_records FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "borrow_insert"
  ON borrow_records FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));

CREATE POLICY "borrow_update"
  ON borrow_records FOR UPDATE TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));

CREATE POLICY "borrow_delete_admin"
  ON borrow_records FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');


-- ── First admin (manual step) ─────────────────────────────────
-- Sign in with Google once so Supabase creates a row in auth.users,
-- then copy the UUID from Authentication → Users and run:
--
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES ('<uuid-from-auth.users>', 'admin@example.com', 'Admin Name', 'admin');
