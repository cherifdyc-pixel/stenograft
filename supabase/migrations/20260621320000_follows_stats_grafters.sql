-- ── follows ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS follows (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS follows_follower_idx  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id);

-- ── stats_grafters view ───────────────────────────────────────────────────────
-- Used by /dashboard/explorer to rank grafters by follower count.

CREATE OR REPLACE VIEW stats_grafters AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.verified,
  COUNT(DISTINCT f.follower_id)::INTEGER AS total_followers,
  COUNT(DISTINCT g.id)::INTEGER          AS total_grafts
FROM profiles p
LEFT JOIN follows f ON f.following_id = p.id
LEFT JOIN grafts  g ON g.user_id = p.id
GROUP BY p.id, p.username, p.display_name, p.verified;
