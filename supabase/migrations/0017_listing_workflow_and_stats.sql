-- =============================================================================
-- Migration 0017: listing approval, service photos, and listing statistics
--
-- Run after 0016. Safe to re-run: each statement checks for itself.
--
--   1. 'pending' joins publish_status. A listing an operator creates waits
--      there until an administrator approves it.
--   2. businesses records when a listing was submitted and approved, who
--      approved it, and the reason for any rejection.
--   3. business_service_images holds up to three photos per service.
--   4. listing_events counts page views and contact clicks per listing per
--      day (UTC). Only the service role reads or writes it, through
--      record_listing_event().
-- =============================================================================

-- Note: a new enum value cannot be used until the transaction that added it
-- commits, so nothing in this file refers to 'pending' by value.
ALTER TYPE publish_status ADD VALUE IF NOT EXISTS 'pending';

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by  UUID REFERENCES profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_note  TEXT;

-- Listings that were already published count as approved from now on.
UPDATE businesses
SET approved_at = COALESCE(approved_at, updated_at)
WHERE status = 'published' AND approved_at IS NULL;

-- -----------------------------------------------------------------------------
-- Service photos: up to three per service.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_service_images (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   UUID        NOT NULL REFERENCES business_services (id) ON DELETE CASCADE,
  business_id  UUID        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  url          TEXT        NOT NULL,
  storage_path TEXT,
  sort_order   SMALLINT    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_service_images_service
  ON business_service_images (service_id, sort_order);

ALTER TABLE business_service_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read service images for published businesses"
  ON business_service_images;
CREATE POLICY "Public can read service images for published businesses"
  ON business_service_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_service_images.business_id
        AND b.is_active = true
        AND b.status = 'published'
    )
  );

-- The app checks the limit too; this keeps it true for every writer. The lock on
-- the service row makes two simultaneous uploads for one service wait for each
-- other, so both cannot pass the count.
CREATE OR REPLACE FUNCTION enforce_service_image_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM 1 FROM business_services WHERE id = NEW.service_id FOR UPDATE;
  IF (SELECT count(*) FROM business_service_images WHERE service_id = NEW.service_id) >= 3 THEN
    RAISE EXCEPTION 'A service can have at most 3 photos.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_image_limit ON business_service_images;
CREATE TRIGGER service_image_limit
  BEFORE INSERT ON business_service_images
  FOR EACH ROW EXECUTE FUNCTION enforce_service_image_limit();

-- -----------------------------------------------------------------------------
-- Listing statistics: one row per listing, day, and kind of event.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_events (
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  day         DATE NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('view', 'phone', 'email', 'website', 'directions', 'social')),
  count       INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, day, kind)
);

ALTER TABLE listing_events ENABLE ROW LEVEL SECURITY;
-- No policies: visitors and signed-in accounts cannot read or write it directly.

-- Adds one event for a listing visitors can see. Anything else is ignored.
CREATE OR REPLACE FUNCTION record_listing_event(p_business UUID, p_kind TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_kind NOT IN ('view', 'phone', 'email', 'website', 'directions', 'social') THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = p_business AND b.is_active = true AND b.status = 'published'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO listing_events (business_id, day, kind, count)
  VALUES (p_business, (now() AT TIME ZONE 'UTC')::date, p_kind, 1)
  ON CONFLICT (business_id, day, kind)
  DO UPDATE SET count = listing_events.count + 1;
END;
$$;

REVOKE ALL ON FUNCTION record_listing_event(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_listing_event(UUID, TEXT) TO service_role;

COMMENT ON TABLE listing_events IS
  'Daily counts of page views and contact clicks per listing (UTC days). '
  'Written through record_listing_event(); read by the service role only.';

COMMENT ON COLUMN businesses.review_note IS
  'Why an administrator sent the listing back to draft. Shown to its operator.';

-- Ask the API to reload its schema cache, so the new columns and tables are
-- visible straight away. Without this it can keep answering "not found in the
-- schema cache" until it reloads on its own.
NOTIFY pgrst, 'reload schema';
