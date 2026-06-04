-- =============================================================================
-- Migration 0012: Business services / pricing
-- Each business can list the services they offer with optional pricing.
-- =============================================================================

CREATE TABLE business_services (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id      UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  price            NUMERIC(10,2),
  price_unit       TEXT        NOT NULL DEFAULT 'fixed',
  currency         VARCHAR(3)  NOT NULL DEFAULT 'USD',
  duration_minutes INTEGER,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- price_unit values: fixed | per_person | per_night | per_hour | from

CREATE INDEX idx_business_services_business ON business_services(business_id);

ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read services for published businesses"
  ON business_services FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id
        AND b.is_active = true
        AND b.status = 'published'
    )
  );
