-- =============================================================================
-- Migration 0004: countries
-- Top-level geographic entities. One row per sovereign state or territory.
-- =============================================================================

CREATE TABLE countries (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name          TEXT          NOT NULL,
  iso_code      CHAR(2)       NOT NULL,          -- ISO 3166-1 alpha-2 (e.g. 'JM')
  iso_code_3    CHAR(3),                          -- ISO 3166-1 alpha-3 (e.g. 'JAM')
  slug          TEXT          NOT NULL UNIQUE,    -- URL key (e.g. 'jamaica')

  -- Display
  flag_emoji    TEXT,
  description   TEXT,
  capital       TEXT,

  -- Practical info for travellers
  currency_code CHAR(3),                          -- ISO 4217 (e.g. 'JMD')
  languages     TEXT[]        NOT NULL DEFAULT '{}',
  timezone      TEXT,                             -- IANA tz (e.g. 'America/Jamaica')

  -- Metadata
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  metadata      JSONB         NOT NULL DEFAULT '{}',

  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT countries_iso_code_key UNIQUE (iso_code)
);

SELECT create_updated_at_trigger('countries');

-- Fast look-ups by iso_code and slug
CREATE INDEX idx_countries_iso_code ON countries (iso_code);
CREATE INDEX idx_countries_slug     ON countries (slug);
CREATE INDEX idx_countries_active   ON countries (is_active) WHERE is_active = true;

COMMENT ON TABLE countries IS
  'Caribbean sovereign states and territories. '
  'Each country can contain multiple destinations (islands, regions).';
