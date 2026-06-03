# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite, http://localhost:5173)
npm run build      # tsc -b && vite build
npm run preview    # preview production build
```

No test runner or lint script is configured.

## Environment

Two env vars are required (create a `.env.local`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Note: the key is named `PUBLISHABLE_KEY`, not the conventional `ANON_KEY`.

## Architecture

**Stack**: React 18 + TypeScript, Vite, Tailwind CSS v3, React Router v6, Supabase JS v2. UI components are built on shadcn/ui primitives: `class-variance-authority` for variant styling, `clsx` + `tailwind-merge` (via `cn()` in `src/lib/utils.ts`) for class merging, `@radix-ui/react-dialog` for modals, `@radix-ui/react-label` for form labels, and `@radix-ui/react-slot` for the `asChild` pattern on `Button`. Zustand is listed as a dependency but is not used — all state lives in the data hooks.

**Auth flow**: Google OAuth via Supabase Auth. `AuthProvider` (`src/hooks/useAuth.tsx`) subscribes to `onAuthStateChange` and loads the user's `profiles` row. If no profile row exists the user is considered unauthorized. `AuthProvider` exposes `{ user, profile, loading }` via context.

**Route guarding**: `AppLayout` (`src/components/layout/AppLayout.tsx`) is the single auth guard. Every protected page renders inside it. It redirects to `/login` when unauthenticated, `/unauthorized` when authenticated but no profile exists, and back to `/dashboard` when a non-admin hits an `adminOnly` route.

**Data layer**: Three hooks mirror the three DB tables — `useBooks`, `useBorrowRecords`, `useProfiles`. Each fetches all rows on mount and maintains local state; mutations optimistically update local state after a successful Supabase call. No shared/global store and no realtime subscriptions.

**Role system**: Two roles — `admin` and `staff`. Role is read from `profiles.role` and checked client-side via `useAuth`. Admins can manage users and delete books; staff can add/update books and create borrow records. The DB also enforces this via RLS policies using the `get_my_role()` SQL function.

**Available copies**: Computed client-side by `getAvailableCopies` in `src/lib/utils.ts` (`total_copies − active borrows`). Not stored in the DB. The DB has an equivalent `book_availability` view and `get_available_copies()` function for server-side checks.

**Overdue status**: The DB `mark_overdue_records()` function flips status to `'overdue'` nightly (must be scheduled via Supabase pg_cron). Client-side `isOverdue()` in `src/lib/utils.ts` also derives overdue state from `due_date` for records the nightly sweep hasn't reached yet.

**Borrowers are not system users**: `borrower_name` is free-text entered by staff. Only staff/admins have `profiles` rows.

**Deployment**: Vercel. `vercel.json` rewrites all paths to `/index.html` for SPA routing.

## Database

Full schema is in `supabase/schema.sql`. See `SCHEMA.md` for table definitions, RLS policies, indexes, and design decisions.

Three tables: `profiles`, `books`, `borrow_records`. All have RLS enabled — authenticated users with a `profiles` row can read everything; writes are role-gated.
