CREATE TABLE IF NOT EXISTS alertes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mot_cle    TEXT        NOT NULL,
  actif      BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mot_cle)
);

ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertes_select" ON alertes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alertes_insert" ON alertes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alertes_update" ON alertes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alertes_delete" ON alertes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS alertes_user_id_idx ON alertes (user_id, created_at DESC);
