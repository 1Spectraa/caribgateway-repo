-- =============================================================================
-- Migration 0003: Utility functions and triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- slugify(text) → text
-- Converts any string to a URL-safe, lowercase, hyphenated slug.
-- Example: slugify('Bridgetown, Barbados!') → 'bridgetown-barbados'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION slugify(value TEXT)
RETURNS TEXT
LANGUAGE sql
STRICT
IMMUTABLE
AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        unaccent(trim(value)),
        '[^a-z0-9\-]+', '-', 'gi'
      ),
      '\-+', '-', 'g'
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- set_updated_at() — trigger function
-- Automatically stamps updated_at on every row update.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Helper macro: attach updated_at trigger to a table.
-- Usage: SELECT create_updated_at_trigger('businesses');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_updated_at_trigger(tbl TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER trg_%1$s_updated_at
     BEFORE UPDATE ON %1$s
     FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
    tbl
  );
END;
$$;
