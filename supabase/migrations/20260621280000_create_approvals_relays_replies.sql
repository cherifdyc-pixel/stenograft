-- ── approvals ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approvals (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  graft_id   UUID        NOT NULL REFERENCES grafts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, graft_id)
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals_select" ON approvals FOR SELECT USING (true);
CREATE POLICY "approvals_insert" ON approvals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "approvals_delete" ON approvals FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS approvals_graft_idx ON approvals (graft_id);
CREATE INDEX IF NOT EXISTS approvals_user_idx  ON approvals (user_id);

-- ── relays ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relays (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  graft_id   UUID        NOT NULL REFERENCES grafts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, graft_id)
);

ALTER TABLE relays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relays_select" ON relays FOR SELECT USING (true);
CREATE POLICY "relays_insert" ON relays FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "relays_delete" ON relays FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS relays_graft_idx ON relays (graft_id);
CREATE INDEX IF NOT EXISTS relays_user_idx  ON relays (user_id);

-- ── grafts.parent_id (réponses) ───────────────────────────────────────────────

ALTER TABLE grafts ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES grafts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS grafts_parent_idx ON grafts (parent_id) WHERE parent_id IS NOT NULL;
