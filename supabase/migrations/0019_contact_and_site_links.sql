-- Migration 0019: contact messages, and the navbar and footer links for the new pages.
--
-- 1. contact_messages holds what visitors send from the Contact page. Only the server (the
--    service role) reads or writes it, so no public policy is added.
-- 2. The saved site content (site_settings, key 'site_content') is updated so the navbar and
--    footer point at the pages that now exist. About leaves the navbar, because the footer has
--    it. Blog, About Us, Contact and the legal links point at their pages. Anything else the
--    admin has edited stays as it is. If no content has been saved yet, the defaults in
--    lib/site-content.ts apply and this block does nothing.

CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages (created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  content JSONB;
  nav JSONB;
  company JSONB;
  legal JSONB;
BEGIN
  SELECT value INTO content FROM site_settings WHERE key = 'site_content';
  IF content IS NULL THEN
    RETURN;
  END IF;

  -- Navbar: drop About, point Blog at /blog, and add Blog if it is not listed.
  IF jsonb_typeof(content -> 'navigation') = 'array' THEN
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN lower(item ->> 'label') = 'blog' THEN jsonb_build_object('label', item ->> 'label', 'href', '/blog')
        ELSE item
      END
      ORDER BY ord
    ), '[]'::jsonb)
    INTO nav
    FROM jsonb_array_elements(content -> 'navigation') WITH ORDINALITY AS t(item, ord)
    WHERE lower(item ->> 'label') NOT LIKE 'about%';

    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(nav) AS item WHERE lower(item ->> 'label') = 'blog') THEN
      nav := nav || jsonb_build_array(jsonb_build_object('label', 'Blog', 'href', '/blog'));
    END IF;

    content := jsonb_set(content, '{navigation}', nav);
  END IF;

  -- Footer, company column: About Us, Blog and Contact.
  IF jsonb_typeof(content #> '{footer,company}') = 'array' THEN
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN lower(item ->> 'label') LIKE 'about%' THEN jsonb_build_object('label', item ->> 'label', 'href', '/about')
        WHEN lower(item ->> 'label') = 'blog' THEN jsonb_build_object('label', item ->> 'label', 'href', '/blog')
        WHEN lower(item ->> 'label') LIKE 'contact%' THEN jsonb_build_object('label', item ->> 'label', 'href', '/contact')
        ELSE item
      END
      ORDER BY ord
    ), '[]'::jsonb)
    INTO company
    FROM jsonb_array_elements(content #> '{footer,company}') WITH ORDINALITY AS t(item, ord);

    content := jsonb_set(content, '{footer,company}', company);
  END IF;

  -- Footer, legal row: Privacy Policy, Terms of Service and Cookie Policy.
  IF jsonb_typeof(content #> '{footer,legal}') = 'array' THEN
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN lower(item ->> 'label') LIKE 'privacy%' THEN jsonb_build_object('label', item ->> 'label', 'href', '/privacy')
        WHEN lower(item ->> 'label') LIKE 'terms%' THEN jsonb_build_object('label', item ->> 'label', 'href', '/terms')
        WHEN lower(item ->> 'label') LIKE 'cookie%' THEN jsonb_build_object('label', item ->> 'label', 'href', '/cookies')
        ELSE item
      END
      ORDER BY ord
    ), '[]'::jsonb)
    INTO legal
    FROM jsonb_array_elements(content #> '{footer,legal}') WITH ORDINALITY AS t(item, ord);

    content := jsonb_set(content, '{footer,legal}', legal);
  END IF;

  UPDATE site_settings SET value = content WHERE key = 'site_content';
END $$;

NOTIFY pgrst, 'reload schema';
