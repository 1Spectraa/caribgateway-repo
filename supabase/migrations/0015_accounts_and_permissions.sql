-- =============================================================================
-- Migration 0015: accounts, permissions, and business operator ownership
--
-- Run after 0013 (which creates profiles). Safe to re-run.
--
--   1. profiles gains an email, an active flag, and a list of permission keys.
--      The keys are defined in lib/permissions.ts and checked by the app on
--      every admin page and action.
--   2. New sign-ups copy their email into profiles.
--   3. Existing admins receive every permission, so nobody loses access.
--   4. Profiles are private. Visitors and signed-in users can read only their
--      own profile and change only their name and photo. Roles, permissions,
--      and status change through the service role (the admin Accounts page),
--      so nobody can grant themselves access with the anon key.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT '{}';

UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS DISTINCT FROM u.email;

UPDATE profiles
SET permissions = ARRAY[
  'catalog.manage',
  'listings.create',
  'listings.manage_all',
  'listings.manage_own',
  'listings.publish',
  'listings.delete',
  'site.content',
  'accounts.manage'
]
WHERE role = 'admin'
  AND cardinality(permissions) = 0;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Column-level grant: signed-in users may change their name and photo only.
REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url) ON profiles TO authenticated;

COMMENT ON COLUMN profiles.permissions IS
  'Permission keys granted to this account (see lib/permissions.ts). Checked by the app on every admin page and action.';
COMMENT ON COLUMN profiles.is_active IS
  'False suspends the account: it cannot sign in or use the admin area.';
