-- =============================================================================
-- Migration 0016: business teams, and accounts created by operators
--
-- Run after 0015. The table and column statements are safe to re-run. The
-- backfill at the end re-grants its permissions if run again (see the note there).
--
--   1. business_members lists the people who have access to one business,
--      and the rights each one holds there (details, services, photos, team).
--      The owner is businesses.owner_id and is not listed here, because an
--      owner always holds every right.
--   2. profiles.created_by records which account created a login account
--      (an administrator, or a business operator adding a person to a team),
--      so administrators can find and manage those accounts.
--   3. Only the service role reads or writes business_members. Visitors and
--      signed-in users have no policies on it, so teams are not visible to
--      the anon key.
-- =============================================================================

CREATE TABLE IF NOT EXISTS business_members (
  business_id UUID        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  profile_id  UUID        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  permissions TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_profile ON business_members (profile_id);

ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles (id) ON DELETE SET NULL;

-- Grant the permissions added in this release to the accounts that were set up
-- before it: administrators can create accounts for their teams, and business
-- operators can create listings and add people to them. Running this again
-- restores those permissions on accounts where they were removed, so remove
-- them again in the Accounts page if you do not want them.
UPDATE profiles
SET permissions = ARRAY(
  SELECT DISTINCT unnest(profiles.permissions || ARRAY['team.create_accounts'])
)
WHERE role = 'admin';

UPDATE profiles
SET permissions = ARRAY(
  SELECT DISTINCT unnest(
    profiles.permissions || ARRAY['listings.manage_own', 'listings.create', 'team.create_accounts']
  )
)
WHERE role = 'business_owner';

COMMENT ON TABLE business_members IS
  'People with access to one business, and the rights they hold there (details, services, photos, team). The owner is businesses.owner_id.';
COMMENT ON COLUMN profiles.created_by IS
  'The account that created this login account (an administrator, or a business operator adding a person to their team). Null when created by the emergency admin or before this migration.';
