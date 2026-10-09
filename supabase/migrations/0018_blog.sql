-- Migration 0018: blog posts.
--
-- Posts are written and published from the admin panel by accounts with 'Write blog posts'.
-- Visitors can read published posts only: the policy below hides drafts from the public, and
-- the admin panel uses the server (service role) to read and write everything.

CREATE TABLE IF NOT EXISTS blog_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,
  title         TEXT        NOT NULL,
  excerpt       TEXT        NOT NULL DEFAULT '',
  body          TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at  TIMESTAMPTZ,
  author_id     UUID        REFERENCES profiles (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts (status, published_at DESC);

SELECT create_updated_at_trigger('blog_posts');

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

NOTIFY pgrst, 'reload schema';
