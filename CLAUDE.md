# Amico Library Book Lending Management System

## Project Overview

An internal back-office book lending management system for staff use only. No public access is allowed — only authenticated users with a pre-approved account can log in.

**Current status:** Demo frontend complete. Supabase backend not yet wired up — all data is mocked in Zustand + localStorage.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript |
| Styling | TailwindCSS v3 + Plus Jakarta Sans (Google Fonts) |
| State (demo) | Zustand v5 with `persist` middleware (localStorage) |
| Backend/DB | Supabase (PostgreSQL) — **not yet connected** |
| Auth | Supabase Auth + Google OAuth — **not yet connected** |
| Deploy | Vercel |

---

## Roles & Permissions

Only 2 roles exist. No public access.

| Role | Permissions |
|------|-------------|
| `admin` | Manage users & roles, add/edit/delete books, record borrow/return, view all reports |
| `staff` | Add/edit books, record borrow/return, view full history |

---

## Auth Flow (production target)

```
Login with Google
    ↓
Supabase checks profiles table
    ↓
No record found  →  Unauthorized page (force logout)
Record found     →  Enter system based on role
    ↓
admin  →  Additional menu: User Management
staff  →  Standard menu only
```

**Demo auth:** Role is selected on the login page (no real OAuth). `useDemoStore.login(userId)` sets the current user.

---

## Folder Structure (actual)

```
src/
├── components/
│   ├── ui/
│   │   ├── Badge.tsx         # Status/role badges
│   │   ├── Button.tsx        # Primary, secondary, danger, ghost variants
│   │   ├── Input.tsx         # Input, Select, Textarea
│   │   └── Modal.tsx         # Modal + ConfirmModal
│   └── layout/
│       ├── Sidebar.tsx       # Nav links (role-aware), user info, sign-out, reset
│       └── AppLayout.tsx     # Auth guard + admin guard + layout wrapper
├── data/
│   └── mockData.ts           # 4 users, 15 books, 25 borrow records
├── pages/
│   ├── LoginPage.tsx         # Demo role picker
│   ├── DashboardPage.tsx     # Stats + recent activity table
│   ├── BooksPage.tsx         # Book list, search, add/edit/delete
│   ├── BorrowPage.tsx        # Borrow form + active borrows table
│   ├── HistoryPage.tsx       # Full history, filters, CSV export
│   └── UsersPage.tsx         # User management (admin only)
├── stores/
│   └── demoStore.ts          # Zustand store: all state + CRUD actions + helpers
├── types/
│   └── index.ts              # Profile, Book, BorrowRecord interfaces
├── App.tsx                   # React Router routes
├── main.tsx
└── index.css                 # Tailwind directives + animations
```

---

## Demo Store (`src/stores/demoStore.ts`)

The `useDemoStore` Zustand store is the single source of truth for the demo. It persists to `localStorage` under the key `amico-demo-store`.

**Exported helpers:**
- `getAvailableCopies(bookId, book, borrowRecords)` — total copies minus active borrows
- `isOverdue(record)` — true if status is `overdue` or if `status === 'borrowed'` and `due_date` is past

**Reset:** Calling `resetDemo()` clears all data back to mock defaults and sets `currentUser` to null.

---

## Design System

- **Font:** Plus Jakarta Sans (300, 400, 500, 600, 700)
- **Color palette:** Tailwind defaults only — no custom colors
  - App background: `gray-50`
  - Cards/sidebar: `white` with `border-gray-100`
  - Primary action: `gray-900` (dark button)
  - Status: blue (borrowed), green (returned), red (overdue)
- **No custom shadows** — `shadow-sm` / `shadow-lg` only
- **Animations:** `page-enter` fade+slide on route change, `modal-panel-enter` scale+fade on modal open

---

## Database Schema + RLS

Run this entire block in one go in the Supabase SQL Editor. Each table has RLS enabled immediately after creation so Supabase does not prompt about missing RLS.

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        text NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE books (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  author        text,
  isbn          text,
  cover_url     text,
  total_copies  int NOT NULL DEFAULT 1,
  created_at    timestamptz DEFAULT now(),
  created_by    uuid REFERENCES profiles(id)
);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE TABLE borrow_records (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id        uuid NOT NULL REFERENCES books(id),
  borrower_name  text NOT NULL,
  borrower_note  text,
  staff_id       uuid REFERENCES profiles(id),
  borrow_date    date NOT NULL DEFAULT current_date,
  due_date       date NOT NULL,
  return_date    date,
  status         text NOT NULL DEFAULT 'borrowed'
                   CHECK (status IN ('borrowed', 'returned', 'overdue')),
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "profiles_select"       ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE TO authenticated USING (get_my_role() = 'admin');

CREATE POLICY "books_select"       ON books FOR SELECT TO authenticated USING (true);
CREATE POLICY "books_insert"       ON books FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "books_update"       ON books FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "books_delete_admin" ON books FOR DELETE TO authenticated USING (get_my_role() = 'admin');

CREATE POLICY "borrow_select"       ON borrow_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "borrow_insert"       ON borrow_records FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "borrow_update"       ON borrow_records FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "borrow_delete_admin" ON borrow_records FOR DELETE TO authenticated USING (get_my_role() = 'admin');
```

---

## Next Steps (Backend Integration)

1. Create Supabase project, enable Google OAuth
2. Run schema SQL + RLS policies above
3. Replace `useDemoStore` with real Supabase queries:
   - `useAuth.ts` — subscribe to `supabase.auth.onAuthStateChange`, fetch profile
   - `useBooks.ts` — CRUD on `books` table
   - `useBorrowRecords.ts` — insert borrow, update return
4. Replace `LoginPage` role-picker with `supabase.auth.signInWithOAuth({ provider: 'google' })`
5. Add `UnauthorizedPage` for Google accounts not in `profiles`
6. Manually insert first admin via SQL (see below)
7. Add environment variables and deploy to Vercel

### Inserting the First Admin
```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES ('uuid-from-auth.users', 'admin@example.com', 'Admin Name', 'admin');
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

> Supabase renamed `anon` → **publishable** and `service_role` → **secret**. Always use the publishable key on the client; never expose the secret key.

---

## Key Constraints

- Borrowers **do not need to log in** — staff enters their name manually
- Any Google account not found in `profiles` → **cannot access the system**
- The first `admin` must be inserted directly via SQL
- Supabase RLS is the primary security layer, not just frontend route guards
- `available copies` is always computed at query time: `total_copies` minus active borrow count
