-- =============================================================================
-- Migration 0010: Row Level Security (RLS)
--
-- Authentication is not yet implemented, so policies are PERMISSIVE for reads
-- and RESTRICTIVE for writes (no anonymous mutations allowed until auth lands).
--
-- When auth is added:
--   1. Replace "true" SELECT policies with role-based checks.
--   2. Add INSERT/UPDATE/DELETE policies scoped to owner_id = auth.uid().
--   3. Add admin role bypass using a custom JWT claim.
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE countries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags               ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tags      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Public read access (anonymous + authenticated)
-- ---------------------------------------------------------------------------

CREATE POLICY "Public can read active countries"
  ON countries FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active destinations"
  ON destinations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read published businesses"
  ON businesses FOR SELECT
  USING (is_active = true AND status = 'published');

CREATE POLICY "Public can read business images"
  ON business_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_images.business_id
        AND b.is_active = true
        AND b.status = 'published'
    )
  );

CREATE POLICY "Public can read active tags"
  ON tags FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read business tags"
  ON business_tags FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- Write access placeholder
-- All mutations are blocked for anonymous users until auth is implemented.
-- Replace these with owner-scoped policies in the auth migration.
-- ---------------------------------------------------------------------------

CREATE POLICY "Writes require authentication (placeholder)"
  ON businesses FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON POLICY "Writes require authentication (placeholder)" ON businesses IS
  'Blocks all anonymous writes. Replace with owner_id = auth.uid() policy '
  'when authentication is implemented.';
