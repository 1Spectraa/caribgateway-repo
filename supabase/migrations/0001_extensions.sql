-- =============================================================================
-- Migration 0001: PostgreSQL extensions
-- =============================================================================

-- Cryptographically-secure UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigram indexes for fast ILIKE / full-text search on names and descriptions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Accent-insensitive search (é → e, etc.) — critical for Caribbean place names
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- NOTE: PostGIS (geospatial) can be enabled later via Supabase dashboard when
-- precise proximity/bounding-box queries are needed. Until then we store
-- latitude/longitude as DECIMAL columns.
