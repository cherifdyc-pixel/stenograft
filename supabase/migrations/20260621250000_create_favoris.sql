CREATE TABLE IF NOT EXISTS favoris (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  graft_id   UUID        NOT NULL REFERENCES grafts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, graft_id)
);

ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favoris_select" ON favoris FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favoris_insert" ON favoris FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favoris_delete" ON favoris FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS favoris_user_idx ON favoris (user_id, created_at DESC);
