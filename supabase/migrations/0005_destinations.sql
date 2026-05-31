-- =============================================================================
-- Migration 0005: destinations
-- Geographic sub-units within a country: islands, towns, beaches, etc.
-- =============================================================================

CREATE TABLE destinations (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id        UUID             NOT NULL REFERENCES countries (id),

  -- Identity
  name              TEXT             NOT NULL,
  slug              TEXT             NOT NULL UNIQUE,
  destination_type  destination_type NOT NULL DEFAULT 'island',

  -- Copy
  short_description TEXT,
  description       TEXT,

  -- Coordinates (decimal degrees, WGS-84)
  -- PostGIS GEOGRAPHY column can be added later without breaking these.
  latitude          DECIMAL(10, 8),
  longitude         DECIMAL(11, 8),

  -- Media
  hero_image_url    TEXT,

  -- Curation
  is_featured       BOOLEAN          NOT NULL DEFAULT false,
  is_active         BOOLEAN          NOT NULL DEFAULT true,
  sort_order        SMALLINT         NOT NULL DEFAULT 0,

  -- Catch-all for future attributes without schema changes
  metadata          JSONB            NOT NULL DEFAULT '{}',

  created_at        TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT now()
);

SELECT create_updated_at_trigger('destinations');

CREATE INDEX idx_destinations_country    ON destinations (country_id);
CREATE INDEX idx_destinations_slug       ON destinations (slug);
CREATE INDEX idx_destinations_type       ON destinations (destination_type);
CREATE INDEX idx_destinations_active     ON destinations (is_active) WHERE is_active = true;
CREATE INDEX idx_destinations_featured   ON destinations (is_featured) WHERE is_featured = true;

-- Trigram indexes for search
CREATE INDEX idx_destinations_name_trgm  ON destinations USING GIN (name gin_trgm_ops);

COMMENT ON TABLE destinations IS
  'Islands, towns, beaches, and geographic areas that belong to a country. '
  'Businesses are attached to destinations, not directly to countries.';

COMMENT ON COLUMN destinations.metadata IS
  'Extensible bag for destination-specific data. '
  'Suggested keys: best_time_to_visit, population, area_km2, airport_code.';
