CREATE TABLE IF NOT EXISTS live_sessions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id       TEXT        NOT NULL UNIQUE,
  user_id       UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  username      TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  category      TEXT        NOT NULL DEFAULT 'Autre',
  platform      TEXT        NOT NULL DEFAULT 'steno',
  status        TEXT        NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  viewers_count INTEGER     NOT NULL DEFAULT 0,
  peak_viewers  INTEGER     NOT NULL DEFAULT 0,
  super_chats_total INTEGER NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_sessions_select" ON live_sessions
  FOR SELECT USING (true);

CREATE POLICY "live_sessions_insert" ON live_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "live_sessions_update" ON live_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "live_sessions_delete" ON live_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS live_sessions_status_idx  ON live_sessions (status, started_at DESC);
CREATE INDEX IF NOT EXISTS live_sessions_user_id_idx ON live_sessions (user_id, started_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
