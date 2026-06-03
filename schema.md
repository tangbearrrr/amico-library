# Database Schema

Four tables backed by Supabase (PostgreSQL). No public access — every table has RLS enabled and all rows are reachable only by authenticated users whose `profiles` row exists.

Full setup script: [`supabase/schema.sql`](supabase/schema.sql)  
Access requests migration: [`supabase/access_requests_migration.sql`](supabase/access_requests_migration.sql)

---

## Entity Relationships

```
auth.users  (Supabase-managed)
    │
    ├── access_requests (1:1, users awaiting approval)
    │
    └── profiles  (1:1, approved staff/admins)
          │
          ├── books.created_by        (1:N)
          │
          └── borrow_records.staff_id (1:N)
                │
                └── books.id ◄── borrow_records.book_id  (N:1)
```

---

## Tables

### `access_requests`

One row per user awaiting access approval. Created when an authenticated Google user has no `profiles` row and submits an access request. Admins approve or reject; approval triggers manual profile creation.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT gen_random_uuid() | — |
| `user_id` | `uuid` | NOT NULL, UNIQUE, FK → `auth.users(id)` ON DELETE CASCADE | One request per auth user |
| `email` | `text` | NOT NULL | Pulled from Google OAuth |
| `full_name` | `text` | — | Pulled from Google OAuth |
| `status` | `text` | NOT NULL DEFAULT 'pending', CHECK IN ('pending', 'approved', 'rejected') | Updated by admin |
| `requested_at` | `timestamptz` | NOT NULL DEFAULT now() | — |
| `avatar_url` | `text` | — | Google profile photo URL |

---

### `profiles`

One row per system user. Linked 1:1 to `auth.users`. Created manually by an admin or via `useProfiles.addUser`. Any Google account with no matching profile row is rejected at login.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | Matches the Supabase Auth UID |
| `email` | `text` | NOT NULL | Unique in practice; enforced at app layer |
| `full_name` | `text` | — | Display name |
| `avatar_url` | `text` | — | Google profile photo URL |
| `role` | `text` | NOT NULL, CHECK IN ('admin', 'staff') | Drives all permission gates |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | — |

---

### `books`

Library catalogue. Each row is a unique title; `total_copies` tracks how many physical copies exist. Available copies are **computed at query time** — not stored.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT gen_random_uuid() | — |
| `title` | `text` | NOT NULL | — |
| `author` | `text` | — | — |
| `isbn` | `text` | — | No uniqueness constraint; multiple editions allowed |
| `cover_url` | `text` | — | External image URL |
| `total_copies` | `int` | NOT NULL DEFAULT 1, CHECK ≥ 1 | Physical copy count |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | — |
| `created_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | Staff who catalogued the book |

---

### `borrow_records`

One row per lending transaction. Never deleted in normal operation — forms the complete audit log.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT gen_random_uuid() | — |
| `book_id` | `uuid` | NOT NULL, FK → `books(id)` ON DELETE CASCADE | Cascade ensures history is cleaned up when a book is deleted |
| `borrower_name` | `text` | NOT NULL | Free-text; borrowers are not system users |
| `borrower_note` | `text` | — | Optional memo entered by staff |
| `staff_id` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL | Staff member who logged the transaction |
| `borrow_date` | `date` | NOT NULL DEFAULT current_date | — |
| `due_date` | `date` | NOT NULL, CHECK ≥ borrow_date | — |
| `return_date` | `date` | CHECK ≥ borrow_date when set | NULL until book is returned |
| `status` | `text` | NOT NULL DEFAULT 'borrowed', CHECK IN ('borrowed', 'returned', 'overdue') | — |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | — |

---

## Indexes

| Name | Table | Columns | Purpose |
|------|-------|---------|---------|
| `idx_borrow_book_status` | `borrow_records` | `(book_id, status)` | Available-copies calculation (count non-returned per book) |
| `idx_borrow_due_date` | `borrow_records` | `(due_date)` WHERE status ≠ 'returned' | Overdue sweep |
| `idx_borrow_staff_id` | `borrow_records` | `(staff_id)` | History page filter by staff member |

---

## Functions

### `get_my_role() → text`
Returns the `role` of the currently authenticated user.  
Declared `SECURITY DEFINER` and `STABLE` — used inside every RLS policy to avoid per-row profile lookups causing recursion.

### `get_available_copies(p_book_id uuid) → int`
Returns `total_copies − count(active borrows)` for a given book.  
Useful for server-side checks before inserting a new borrow record.

### `mark_overdue_records() → void`
Sets `status = 'overdue'` on all `borrowed` records whose `due_date < current_date`.  
Call on a daily schedule via Supabase **pg_cron** or an **Edge Function**.

```sql
-- Example pg_cron job (run in SQL Editor)
SELECT cron.schedule(
  'mark-overdue-daily',
  '0 1 * * *',           -- 01:00 UTC every day
  'SELECT mark_overdue_records()'
);
```

---

## Views

### `book_availability`
Extends `books` with a computed `available_copies` column. Equivalent to the `getAvailableCopies` utility used client-side.

```sql
SELECT *, (total_copies − non-returned borrow count) AS available_copies
FROM books LEFT JOIN borrow_records ...
```

---

## RLS Policies

All tables have RLS enabled. Authenticated users can read everything; writes are role-gated via `get_my_role()`.

| Table | Operation | Allowed roles |
|-------|-----------|---------------|
| `access_requests` | SELECT | Owner (own row) or `admin` |
| `access_requests` | INSERT | Any authenticated (own `user_id` only) |
| `access_requests` | UPDATE | `admin` |
| `access_requests` | DELETE | `admin` |
| `profiles` | SELECT | Any authenticated |

### `access_requests` policies

| Policy name | Operation | Rule |
|-------------|-----------|------|
| `access_requests_insert_self` | INSERT | `WITH CHECK (user_id = auth.uid())` — users can only submit for themselves |
| `access_requests_select` | SELECT | `USING (user_id = auth.uid() OR get_my_role() = 'admin')` — own row or admin |
| `access_requests_update_admin` | UPDATE | `USING (get_my_role() = 'admin')` |
| `access_requests_delete_admin` | DELETE | `USING (get_my_role() = 'admin')` |
| `profiles` | INSERT / UPDATE / DELETE | `admin` |
| `books` | SELECT | Any authenticated |
| `books` | INSERT / UPDATE | `admin`, `staff` |
| `books` | DELETE | `admin` |
| `borrow_records` | SELECT | Any authenticated |
| `borrow_records` | INSERT / UPDATE | `admin`, `staff` |
| `borrow_records` | DELETE | `admin` |

---

## Design Decisions

**Borrowers are not users.**  
`borrower_name` is a free-text field entered by staff. Members of the public do not have system accounts; only staff do.

**Available copies are computed, not stored.**  
A stored counter would require careful increment/decrement logic and could drift. A join on `borrow_records` is always consistent and the partial index on `(book_id, status)` keeps it fast.

**`borrow_records` cascades on book delete.**  
Deleting a book removes all its lending history. The front-end (`useBooks.deleteBook`) also deletes records first before deleting the book, so the cascade is a safety net rather than the primary mechanism.

**`overdue` is a persisted status, not purely derived.**  
`mark_overdue_records()` flips the flag nightly so dashboard/history queries don't need date comparisons on every row. The client-side `isOverdue()` utility also derives it from `due_date` for any records the sweep hasn't reached yet.

**No soft-delete.**  
Removing a user or book is a hard delete. `profiles` references `auth.users` with `ON DELETE CASCADE`, so deleting a user from Supabase Auth automatically removes their profile row.
