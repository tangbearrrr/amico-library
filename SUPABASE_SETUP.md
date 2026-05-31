# Supabase + Google OAuth Setup Guide

> Stack: `@supabase/supabase-js` v2 · Supabase Auth · Google OAuth 2.0
> Target app: Amico Library (Vite + React + TypeScript)

> **Key naming:** Supabase renamed `anon` → **publishable** and `service_role` → **secret**.
> This guide uses the new names. Use the **publishable** key in the browser; never expose the **secret** key client-side.

---

## 1. Install the Supabase Client

```bash
npm install @supabase/supabase-js
```

Latest stable release: **v2.x** (`@supabase/supabase-js@^2`)

---

## 2. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose your organisation, give the project a name (e.g. `amico-library`), set a strong database password, and select the region closest to your users.
4. Wait for provisioning to finish (~1–2 min).

---

## 3. Run the Database Schema

Open **SQL Editor** in the Supabase dashboard and execute the following blocks in order.

Paste the entire block below into the SQL Editor and run it in one go. Tables, RLS, and policies are all included so Supabase will not prompt about missing RLS.

```sql
-- ── Tables ────────────────────────────────────────────────────────────────────

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

-- ── Role helper ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Policies: profiles ────────────────────────────────────────────────────────

CREATE POLICY "profiles_select"       ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- ── Policies: books ───────────────────────────────────────────────────────────

CREATE POLICY "books_select"       ON books FOR SELECT TO authenticated USING (true);
CREATE POLICY "books_insert"       ON books FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "books_update"       ON books FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "books_delete_admin" ON books FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- ── Policies: borrow_records ──────────────────────────────────────────────────

CREATE POLICY "borrow_select"       ON borrow_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "borrow_insert"       ON borrow_records FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "borrow_update"       ON borrow_records FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "borrow_delete_admin" ON borrow_records FOR DELETE TO authenticated USING (get_my_role() = 'admin');
```

---

## 4. Configure Google OAuth

### 4a. Google Cloud Console

1. Open [https://console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services → OAuth consent screen**.
   - User type: **Internal** (staff-only app, no public access).
   - Fill in app name, support email, and developer contact email.
   - Save and continue through all screens.
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
   - Application type: **Web application**.
   - Name: e.g. `Amico Library`.
   - **Authorised JavaScript origins**: leave empty for now (not needed for server-side redirect flow).
   - **Authorised redirect URIs**: add the callback URL from Supabase (see step 4b).
5. Click **Create** — copy the **Client ID** and **Client Secret**.

### 4b. Supabase Auth Provider

1. In the Supabase dashboard go to **Authentication → Providers → Google**.
2. Toggle **Enable Google provider** on.
3. Paste the **Client ID** and **Client Secret** from step 4a.
4. Copy the **Callback URL** shown on this page (format: `https://<project-ref>.supabase.co/auth/v1/callback`).
5. Go back to Google Cloud Console → your OAuth 2.0 Client → add that URL to **Authorised redirect URIs** and save.

---

## 5. Environment Variables

Create a `.env.local` file in the project root (never commit this file):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Both values are in **Supabase dashboard → Settings → API**.
The **publishable** key (formerly `anon`) is safe to expose in the browser. RLS policies are the security layer, not key secrecy.

Add `.env.local` to `.gitignore` if it is not already there.

---

## 6. Initialise the Supabase Client

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
```

---

## 7. Insert the First Admin

After completing step 4, sign in with your Google account once so that Supabase creates a row in `auth.users`. Then run the following in the SQL Editor — **replace the placeholder values**:

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '<uuid-from-auth.users>',   -- copy from Authentication → Users
  'admin@example.com',
  'Admin Name',
  'admin'
);
```

Any Google account that successfully authenticates but has **no row** in `profiles` must be redirected to an Unauthorized page and signed out.

---

## 8. Auth Hooks to Implement

Replace the demo role-picker in `LoginPage.tsx` with real OAuth. The three hooks below are the minimum needed.

### `src/hooks/useAuth.ts` — session + profile

```ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null
      setUser(authUser)

      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single()

        setRole(profile?.role ?? null)
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, role, loading }
}
```

### Sign in with Google

```ts
// Call this from the login button
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin, // redirects back to the app after OAuth
  },
})
```

### Sign out

```ts
await supabase.auth.signOut()
```

---

## 9. Unauthorized Page Logic

In `AppLayout.tsx` (or wherever the auth guard lives), after the profile fetch:

```ts
if (!loading && user && role === null) {
  // Google account exists in auth.users but not in profiles
  await supabase.auth.signOut()
  navigate('/unauthorized')
}
```

---

## 10. Vercel Deployment

Add the same environment variables in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable key (formerly anon) |

In **Supabase → Authentication → URL Configuration**:
- **Site URL**: `https://your-vercel-domain.vercel.app`
- **Redirect URLs**: add `https://your-vercel-domain.vercel.app/**`

---

## Checklist

- [ ] `@supabase/supabase-js` installed
- [ ] Supabase project created
- [ ] Tables + RLS applied via SQL Editor
- [ ] Google Cloud OAuth client created (Internal consent screen)
- [ ] Callback URL registered in Google Cloud Console
- [ ] Google provider enabled in Supabase Auth
- [ ] `.env.local` created with URL + publishable key
- [ ] `src/lib/supabase.ts` created
- [ ] First admin inserted into `profiles` via SQL
- [ ] `useAuth` hook implemented and connected to `AppLayout`
- [ ] `LoginPage` replaced with `signInWithOAuth`
- [ ] Unauthorized page handles accounts not in `profiles`
- [ ] Vercel env vars + Supabase redirect URLs configured
