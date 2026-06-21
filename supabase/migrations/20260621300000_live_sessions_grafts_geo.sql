-- live_sessions: table for STENO Live broadcasts
CREATE TABLE IF NOT EXISTS live_sessions (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id           TEXT        NOT NULL UNIQUE,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  username          TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  category          TEXT        NOT NULL DEFAULT 'Autre',
  platform          TEXT        NOT NULL DEFAULT 'steno',
  status            TEXT        NOT NULL DEFAULT 'live' CHECK (status IN ('live','ended')),
  viewers_count     INTEGER     NOT NULL DEFAULT 0,
  peak_viewers      INTEGER     NOT NULL DEFAULT 0,
  super_chats_total INTEGER     NOT NULL DEFAULT 0,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_sessions_select" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "live_sessions_insert" ON live_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "live_sessions_update" ON live_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "live_sessions_delete" ON live_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS live_sessions_status_idx   ON live_sessions (status);
CREATE INDEX IF NOT EXISTS live_sessions_user_idx     ON live_sessions (user_id);
CREATE INDEX IF NOT EXISTS live_sessions_started_idx  ON live_sessions (started_at DESC);

-- Add to realtime publication so hub auto-refreshes
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;

-- Geo columns on grafts for Territoires page
ALTER TABLE grafts ADD COLUMN IF NOT EXISTS region     TEXT;
ALTER TABLE grafts ADD COLUMN IF NOT EXISTS territoire TEXT;

CREATE INDEX IF NOT EXISTS grafts_region_idx     ON grafts (region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS grafts_territoire_idx ON grafts (territoire) WHERE territoire IS NOT NULL;
