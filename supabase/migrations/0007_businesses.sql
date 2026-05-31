-- =============================================================================
-- Migration 0007: businesses
-- Central table for all tourism entities on the platform.
-- =============================================================================

CREATE TABLE businesses (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Geography
  destination_id   UUID          NOT NULL REFERENCES destinations (id),

  -- Classification
  category_id      UUID          NOT NULL REFERENCES categories (id),
  business_type    business_type NOT NULL,

  -- Future: claimed business owner (Supabase auth.users UUID stored as TEXT
  -- to avoid a hard FK to auth schema; enforced at application layer for now).
  owner_id         TEXT,

  -- Core identity
  name             TEXT          NOT NULL,
  slug             TEXT          NOT NULL UNIQUE,
  short_description TEXT,
  description      TEXT,

  -- Location
  address_line1    TEXT,
  address_line2    TEXT,
  city             TEXT,
  postal_code      TEXT,
  latitude         DECIMAL(10, 8),
  longitude        DECIMAL(11, 8),

  -- Contact
  phone            TEXT,
  email            TEXT,
  website          TEXT,

  -- Social / external links
  -- Expected shape: { facebook, instagram, twitter, tripadvisor, google_maps }
  social_links     JSONB         NOT NULL DEFAULT '{}',

  -- Commercial
  price_range      price_range,

  -- Operating hours
  -- Shape: { monday: { open: "09:00", close: "17:00", is_closed: false }, … }
  hours_of_operation JSONB       NOT NULL DEFAULT '{}',

  -- Feature lists (free-form searchable strings)
  amenities        TEXT[]        NOT NULL DEFAULT '{}',
  features         TEXT[]        NOT NULL DEFAULT '{}',

  -- Quality signals
  is_verified      BOOLEAN       NOT NULL DEFAULT false,
  is_featured      BOOLEAN       NOT NULL DEFAULT false,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  status           publish_status NOT NULL DEFAULT 'draft',

  -- Review aggregates (maintained by triggers added in reviews migration)
  avg_rating       DECIMAL(3, 2) CHECK (avg_rating BETWEEN 0 AND 5),
  review_count     INT           NOT NULL DEFAULT 0,

  -- Type-specific extension bag
  -- Hotels: { star_rating, check_in, check_out, pool, gym }
  -- Restaurants: { cuisine_types[], reservation_required, outdoor_seating }
  -- Attractions: { duration_minutes, age_min, guided_only }
  -- Tour operators: { tour_types[], max_group_size, languages_spoken[] }
  -- Transportation: { vehicle_types[], service_area, airport_transfers }
  metadata         JSONB         NOT NULL DEFAULT '{}',

  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

SELECT create_updated_at_trigger('businesses');

-- Core look-ups
CREATE INDEX idx_businesses_destination  ON businesses (destination_id);
CREATE INDEX idx_businesses_category     ON businesses (category_id);
CREATE INDEX idx_businesses_type         ON businesses (business_type);
CREATE INDEX idx_businesses_slug         ON businesses (slug);
CREATE INDEX idx_businesses_owner        ON businesses (owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_businesses_status       ON businesses (status);

-- Filtered indexes for common list queries
CREATE INDEX idx_businesses_active       ON businesses (is_active)   WHERE is_active = true;
CREATE INDEX idx_businesses_featured     ON businesses (is_featured)  WHERE is_featured = true;
CREATE INDEX idx_businesses_verified     ON businesses (is_verified)  WHERE is_verified = true;

-- Composite index: destination × type (powers the main browse page)
CREATE INDEX idx_businesses_dest_type    ON businesses (destination_id, business_type)
  WHERE is_active = true AND status = 'published';

-- Full-text / trigram search on name and short_description
CREATE INDEX idx_businesses_name_trgm    ON businesses USING GIN (name gin_trgm_ops);
CREATE INDEX idx_businesses_desc_trgm    ON businesses USING GIN (short_description gin_trgm_ops);

-- GIN index for amenities and features array containment queries
CREATE INDEX idx_businesses_amenities    ON businesses USING GIN (amenities);
CREATE INDEX idx_businesses_features     ON businesses USING GIN (features);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_businesses_metadata     ON businesses USING GIN (metadata);

COMMENT ON TABLE businesses IS
  'Central entity for hotels, restaurants, attractions, tour operators, and '
  'transportation providers. All tourism listings live here.';

COMMENT ON COLUMN businesses.metadata IS
  'Type-specific attributes. Keys vary by business_type — see migration comment for shape.';

COMMENT ON COLUMN businesses.owner_id IS
  'Supabase auth.users UUID of the business owner (if claimed). '
  'Stored as TEXT to avoid a hard dependency on the auth schema. '
  'Add FK constraint and RLS policies when authentication is implemented.';

COMMENT ON COLUMN businesses.review_count IS
  'Denormalised count maintained by triggers in the reviews migration. '
  'Do not update manually.';
