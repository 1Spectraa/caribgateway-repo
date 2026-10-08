-- =============================================================================
-- Migration 0014: accommodations, homepage curation, editable site content
--
-- Run after 0013. Safe to re-run: every statement is idempotent.
--
--   1. Accommodation types are child categories of "Hotels & Accommodation"
--      (business_type 'hotel'). New types are added here; admins can add or
--      rename more from the Categories admin page.
--   2. Categories can be pinned to the homepage "Caribbean Experiences" grid.
--   3. Homepage destination cards read tagline / emoji / tags from
--      destinations.metadata, and featured destinations are ordered by sort_order.
--   4. site_settings holds the editable site copy (navigation, footer, homepage,
--      and page headers) as one JSON document under the key 'site_content'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Accommodation types (child categories of hotels-accommodation)
-- ---------------------------------------------------------------------------
INSERT INTO categories (parent_id, name, slug, icon, description, sort_order)
SELECT p.id, v.name, v.slug, v.icon, v.description, v.sort_order
FROM (VALUES
  ('Hotels',                     'hotels',                    '🏨', 'Standard hotels, from city properties to beachfront chains.',                           0),
  ('Airbnb & Short-Term Rentals', 'airbnb-short-term-rentals', '🔑', 'Entire homes, apartments, and rooms booked through Airbnb-style platforms.',           5),
  ('Hostels',                    'hostels',                   '🎒', 'Budget-friendly shared accommodation for independent travellers.',                      6)
) AS v(name, slug, icon, description, sort_order)
CROSS JOIN (SELECT id FROM categories WHERE slug = 'hotels-accommodation') AS p
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Homepage "Caribbean Experiences" grid
-- ---------------------------------------------------------------------------
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

UPDATE categories SET is_featured = true
WHERE slug IN (
  'beaches-nature',
  'water-sports-diving',
  'adventure-activities',
  'cultural-heritage-tours',
  'local-street-food',
  'island-tours'
);

-- ---------------------------------------------------------------------------
-- 3. Homepage destination cards: display order + card copy
--    The homepage shows the first six featured destinations by sort_order,
--    which keeps the same six islands as before.
-- ---------------------------------------------------------------------------
UPDATE destinations SET sort_order = v.sort_order
FROM (VALUES
  ('barbados',     1),
  ('jamaica',      2),
  ('trinidad',     3),
  ('saint-lucia',  4),
  ('antigua',      5),
  ('grand-cayman', 6),
  ('tobago',       7),
  ('nassau',       8),
  ('punta-cana',   9),
  ('grenada',     10)
) AS v(slug, sort_order)
WHERE destinations.slug = v.slug;

UPDATE destinations SET metadata = metadata || jsonb_build_object(
  'tagline', v.tagline,
  'emoji',   v.emoji,
  'tags',    v.tags
)
FROM (VALUES
  ('barbados',     'The Gem of the Caribbean',     '🌊', '["Beach","Culture","Diving"]'::jsonb),
  ('jamaica',      'Island of Springs',            '🌴', '["Music","Nature","Adventure"]'::jsonb),
  ('trinidad',     'Land of Steel Pan',            '🎺', '["Carnival","Food","Culture"]'::jsonb),
  ('saint-lucia',  'Helen of the West Indies',     '🏔️', '["Luxury","Nature","Romance"]'::jsonb),
  ('antigua',      '365 Beaches to Discover',      '🏖️', '["Beach","Sailing","Resorts"]'::jsonb),
  ('grand-cayman', 'World-Class Diving',           '🤿', '["Diving","Luxury","Beach"]'::jsonb)
) AS v(slug, tagline, emoji, tags)
WHERE destinations.slug = v.slug;

-- ---------------------------------------------------------------------------
-- 4. Editable site content (navigation, footer, homepage, page headers)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT create_updated_at_trigger('site_settings');

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site settings" ON site_settings;
CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  USING (true);

COMMENT ON TABLE site_settings IS
  'Key/value store for admin-editable site copy. Writes go through the service role; '
  'the public can only read. The key ''site_content'' holds navigation, footer, homepage, '
  'and page-header text. Missing keys fall back to defaults in lib/site-content.ts.';
