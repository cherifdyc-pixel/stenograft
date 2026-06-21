CREATE TABLE IF NOT EXISTS live_messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id    TEXT        NOT NULL,
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  username   TEXT        NOT NULL DEFAULT 'Anonyme',
  content    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'message' CHECK (type IN ('message', 'super_chat', 'system')),
  amount     INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_messages_select" ON live_messages
  FOR SELECT USING (true);

CREATE POLICY "live_messages_insert" ON live_messages
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS live_messages_room_id_idx
  ON live_messages (room_id, created_at ASC);

ALTER PUBLICATION supabase_realtime ADD TABLE live_messages;
