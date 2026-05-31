# Features & Implementation Plan

Each feature is designed to be implemented independently in order. Complete each phase before moving to the next.

---

## Phase 0 — Project Setup & Infrastructure

**Goal:** Working dev environment connected to Supabase with Google Auth ready.

### Steps
- [ ] Scaffold project with `npm create vite@latest` (React + TypeScript)
- [ ] Install dependencies: `tailwindcss`, `@supabase/supabase-js`, `react-router-dom`, `zustand`
- [ ] Configure TailwindCSS
- [ ] Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Create `src/lib/supabase.ts` — Supabase client instance
- [ ] Create `src/types/index.ts` — shared TypeScript types (`Profile`, `Book`, `BorrowRecord`)
- [ ] Setup Supabase project
  - [ ] Enable Google OAuth under Authentication → Providers
  - [ ] Add Redirect URLs: `http://localhost:5173`, `https://your-domain.vercel.app`
- [ ] Run database schema SQL (profiles, books, borrow_records)
- [ ] Run RLS policies SQL
- [ ] Manually insert first admin via SQL

**Deliverable:** `npm run dev` works, Supabase connected, Google OAuth configured.

---

## Feature 1 — Authentication & Route Guards

**Goal:** Google login works, unauthorized users are blocked, routes are role-protected.

### Steps
- [ ] Create `src/stores/authStore.ts` — store user session + profile (with role)
- [ ] Create `src/hooks/useAuth.ts` — subscribe to Supabase auth state changes, fetch profile
- [ ] Create `src/components/guards/AuthGuard.tsx` — redirect to `/login` if not authenticated
- [ ] Create `src/components/guards/RoleGuard.tsx` — redirect if role doesn't match
- [ ] Create `src/pages/LoginPage.tsx` — "Sign in with Google" button
- [ ] Create `src/pages/UnauthorizedPage.tsx` — shown when account has no profile; force logout
- [ ] Wire up routes in `src/App.tsx` with guards applied

**Acceptance Criteria:**
- Unauthenticated users always land on `/login`
- Google accounts not in `profiles` table → `/unauthorized` + auto logout
- `staff` cannot access admin-only routes
- Refreshing the page preserves session

---

## Feature 2 — Layout & Navigation Shell

**Goal:** Consistent sidebar/navbar layout shared across all authenticated pages.

### Steps
- [ ] Create `src/components/layout/Sidebar.tsx` — nav links based on role
- [ ] Create `src/components/layout/Navbar.tsx` — user avatar, name, logout button
- [ ] Create `src/components/layout/AppLayout.tsx` — wraps pages with sidebar + navbar
- [ ] Create reusable UI primitives in `src/components/ui/`:
  - `Button.tsx`
  - `Badge.tsx` (for borrow status)
  - `Modal.tsx`
  - `Table.tsx`
  - `Input.tsx`

**Acceptance Criteria:**
- All authenticated pages share the same layout
- Admin sees "Users" link in sidebar; staff does not
- Logout works from navbar

---

## Feature 3 — Dashboard

**Goal:** Landing page with at-a-glance stats and recent activity.

### Steps
- [ ] Create `src/pages/DashboardPage.tsx`
- [ ] Fetch summary stats from Supabase:
  - Total books in system
  - Total currently borrowed (`status = 'borrowed'`)
  - Total overdue (`status = 'overdue'`)
- [ ] Display recent 10 borrow records (borrower name, book title, due date, status)

**Acceptance Criteria:**
- Stats update on each page visit
- Overdue count is visually distinct (e.g. red badge)

---

## Feature 4 — Book Management

**Goal:** Staff and admin can view, add, and edit books. Only admin can delete.

### Steps
- [ ] Create `src/hooks/useBooks.ts` — CRUD operations against `books` table
- [ ] Create `src/pages/BooksPage.tsx`
  - [ ] Table listing all books (title, author, ISBN, total copies, available copies)
  - [ ] Search by title or author
  - [ ] "Add Book" button → modal form
  - [ ] "Edit" per row → modal form (admin + staff)
  - [ ] "Delete" per row → confirmation dialog (admin only)
- [ ] Available copies = `total_copies` − active borrow count (computed on fetch)

**Acceptance Criteria:**
- Books list is searchable
- Add/Edit form validates required fields (title, total_copies ≥ 1)
- Delete button hidden for `staff` role
- Available copies reflect live borrow count

---

## Feature 5 — Borrow & Return

**Goal:** Staff can record a borrow and mark a book as returned.

### Steps
- [ ] Create `src/hooks/useBorrowRecords.ts` — insert borrow, update return
- [ ] Create `src/pages/BorrowPage.tsx`
  - [ ] Borrow form:
    - [ ] Book selector (searchable dropdown, shows only books with available copies > 0)
    - [ ] Borrower name (text input)
    - [ ] Borrower note — phone / remarks (optional)
    - [ ] Due date picker
    - [ ] Submit → inserts record with `status = 'borrowed'`, `staff_id = current user`
  - [ ] Active borrows list (books currently out)
    - [ ] "Mark as Returned" button per row → sets `return_date = today`, `status = 'returned'`

**Acceptance Criteria:**
- Cannot borrow a book with 0 available copies
- Borrower name is required
- Due date must be in the future
- Returning a book immediately reflects in available copies

---

## Feature 6 — Borrow History

**Goal:** Full audit trail of all borrow/return activity with filtering.

### Steps
- [ ] Create `src/pages/HistoryPage.tsx`
  - [ ] Table: borrower name, book title, staff name, borrow date, due date, return date, status
  - [ ] Filter by status (`borrowed` / `returned` / `overdue`)
  - [ ] Filter by date range (borrow date)
  - [ ] Search by borrower name
  - [ ] (Optional) Export filtered results to CSV

**Acceptance Criteria:**
- Filters can be combined
- Overdue records are visually highlighted
- Export CSV includes all visible columns

---

## Feature 7 — User Management (Admin Only)

**Goal:** Admin can view all system users, change their role, and remove them.

### Steps
- [ ] Create `src/pages/UsersPage.tsx`
  - [ ] Table: avatar, full name, email, role, joined date
  - [ ] Change role dropdown per row (admin ↔ staff) → updates `profiles.role`
  - [ ] "Remove User" button per row → deletes from `profiles` (not from `auth.users`)
- [ ] Route is protected by `RoleGuard` (admin only)
- [ ] Admin cannot remove or downgrade themselves

**Acceptance Criteria:**
- Role change takes effect on next login of the affected user
- Admin cannot accidentally remove their own account
- Page is completely inaccessible to `staff` (guard + RLS)

---

## Phase Final — Deployment

**Goal:** App running on Vercel, connected to production Supabase.

### Steps
- [ ] Push project to GitHub
- [ ] Connect repo to Vercel
- [ ] Add environment variables in Vercel dashboard (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Add production URL to Supabase Redirect URLs
- [ ] Smoke test all features on production URL

---

## Implementation Order Summary

```
Phase 0  →  Feature 1  →  Feature 2  →  Feature 3
                                              ↓
Feature 7  ←  Feature 6  ←  Feature 5  ←  Feature 4
                                              ↓
                                        Phase Final
```