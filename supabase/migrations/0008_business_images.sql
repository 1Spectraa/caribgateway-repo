-- =============================================================================
-- Migration 0008: business_images
-- Images attached to a business. Stored in Supabase Storage; URLs recorded here.
-- =============================================================================

CREATE TABLE business_images (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,

  -- Storage
  -- url: the public CDN URL served to clients
  -- storage_path: the path inside the Supabase Storage bucket (for signed-URL
  --   refresh or deletion without needing the full URL)
  url           TEXT        NOT NULL,
  storage_path  TEXT,

  -- Accessibility & SEO
  alt_text      TEXT,
  caption       TEXT,

  -- Ordering
  is_primary    BOOLEAN     NOT NULL DEFAULT false,
  sort_order    SMALLINT    NOT NULL DEFAULT 0,

  -- Intrinsics (populated by the upload handler)
  width         SMALLINT,
  height        SMALLINT,
  mime_type     TEXT,
  file_size     INT,        -- bytes

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()

  -- No updated_at: images are immutable once uploaded. Replace by inserting a
  -- new row and deleting the old one.
);

-- Each business has at most one primary image
CREATE UNIQUE INDEX idx_business_images_primary
  ON business_images (business_id)
  WHERE is_primary = true;

CREATE INDEX idx_business_images_business  ON business_images (business_id);
CREATE INDEX idx_business_images_order     ON business_images (business_id, sort_order);

COMMENT ON TABLE business_images IS
  'Images attached to a business. Cascade-deletes with the parent business. '
  'At most one image per business may have is_primary = true (enforced by partial unique index).';

COMMENT ON COLUMN business_images.storage_path IS
  'Path inside the Supabase Storage bucket, e.g. "businesses/<business_id>/<filename>". '
  'Used for server-side deletion and signed-URL generation.';
