-- ============================================================
-- Access Requests — run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE access_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  full_name    text,
  avatar_url   text,
  status       text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a request for themselves
CREATE POLICY "access_requests_insert_self"
  ON access_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own request; admins can read all
CREATE POLICY "access_requests_select"
  ON access_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- Only admins can approve/reject
CREATE POLICY "access_requests_update_admin"
  ON access_requests FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin');

-- Only admins can delete requests
CREATE POLICY "access_requests_delete_admin"
  ON access_requests FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');
