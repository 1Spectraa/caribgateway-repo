-- =============================================================================
-- Migration 0002: Enum types
-- =============================================================================

-- The five initial business verticals. Extend with ALTER TYPE … ADD VALUE.
CREATE TYPE business_type AS ENUM (
  'hotel',
  'restaurant',
  'attraction',
  'tour_operator',
  'transportation'
);

-- Destination granularity levels.
CREATE TYPE destination_type AS ENUM (
  'island',
  'town',
  'beach',
  'area',
  'region'
);

-- Four-tier price signal shown in UI.
CREATE TYPE price_range AS ENUM (
  'budget',
  'moderate',
  'upscale',
  'luxury'
);

-- Publication lifecycle.
CREATE TYPE publish_status AS ENUM (
  'draft',
  'published',
  'archived'
);
