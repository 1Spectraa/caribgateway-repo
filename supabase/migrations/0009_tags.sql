-- =============================================================================
-- Migration 0009: tags and business_tags
-- Flexible many-to-many labelling system.
-- Tags complement categories — they are editorial/cross-cutting labels
-- (e.g. "pet-friendly", "eco-certified", "adults-only", "family-friendly").
-- =============================================================================

CREATE TABLE tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  slug       TEXT        NOT NULL UNIQUE,
  color      TEXT        NOT NULL DEFAULT '#1f8a8a',  -- brand teal default
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_slug   ON tags (slug);
CREATE INDEX idx_tags_active ON tags (is_active) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Junction table
-- ---------------------------------------------------------------------------
CREATE TABLE business_tags (
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags     (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (business_id, tag_id)
);

CREATE INDEX idx_business_tags_tag ON business_tags (tag_id);

COMMENT ON TABLE tags IS
  'Cross-cutting editorial labels applied to businesses via business_tags. '
  'Unlike categories (hierarchical, structural), tags are flat and free-form.';

COMMENT ON TABLE business_tags IS
  'Many-to-many junction between businesses and tags. '
  'Cascade-deletes when the business is removed.';
