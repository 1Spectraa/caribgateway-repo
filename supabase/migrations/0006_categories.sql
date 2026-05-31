-- =============================================================================
-- Migration 0006: categories
-- Hierarchical classification tree for businesses.
-- A category can have a parent_id → supports arbitrary depth.
--
-- Design note: the top level (parent_id IS NULL) maps 1-to-1 with
-- business_type enum values. Child categories provide UI-level filtering
-- without requiring enum changes.
--
-- Example tree:
--   Hotels & Accommodation (NULL parent)
--     ├── Boutique Hotels
--     ├── All-Inclusive Resorts
--     └── Villas & Vacation Rentals
-- =============================================================================

CREATE TABLE categories (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID      REFERENCES categories (id),   -- NULL = top-level

  -- Identity
  name          TEXT      NOT NULL,
  slug          TEXT      NOT NULL UNIQUE,

  -- Display
  description   TEXT,
  icon          TEXT,                                    -- emoji or icon name
  color         TEXT,                                    -- hex color for UI
  sort_order    SMALLINT  NOT NULL DEFAULT 0,

  is_active     BOOLEAN   NOT NULL DEFAULT true,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT create_updated_at_trigger('categories');

CREATE INDEX idx_categories_parent   ON categories (parent_id);
CREATE INDEX idx_categories_slug     ON categories (slug);
CREATE INDEX idx_categories_active   ON categories (is_active) WHERE is_active = true;

COMMENT ON TABLE categories IS
  'Self-referential category tree. Top-level categories correspond to '
  'business_type enum values; child categories provide finer granularity.';
