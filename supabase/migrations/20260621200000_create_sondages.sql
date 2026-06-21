CREATE TABLE IF NOT EXISTS sondages (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  graft_id     UUID        NOT NULL REFERENCES grafts(id) ON DELETE CASCADE,
  question     TEXT        NOT NULL,
  options      JSONB       NOT NULL,
  duree_heures INTEGER     NOT NULL DEFAULT 24,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sondages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sondages_select" ON sondages FOR SELECT USING (true);
CREATE POLICY "sondages_insert" ON sondages FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS sondages_graft_id_idx ON sondages (graft_id);

-- ── votes_sondage ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS votes_sondage (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sondage_id   UUID        NOT NULL REFERENCES sondages(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  option_index INTEGER     NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sondage_id, user_id)
);

ALTER TABLE votes_sondage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votes_sondage_select" ON votes_sondage FOR SELECT USING (true);
CREATE POLICY "votes_sondage_insert" ON votes_sondage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS votes_sondage_sondage_id_idx ON votes_sondage (sondage_id);
