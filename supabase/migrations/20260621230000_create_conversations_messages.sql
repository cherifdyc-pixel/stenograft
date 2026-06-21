-- ── conversations ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant1_id, participant2_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (auth.uid() IN (participant1_id, participant2_id));

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = participant1_id);

CREATE INDEX IF NOT EXISTS conversations_p1_idx ON conversations (participant1_id);
CREATE INDEX IF NOT EXISTS conversations_p2_idx ON conversations (participant2_id);

-- ── messages ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL,
  lu              BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants of the conversation can read messages
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant1_id, c.participant2_id)
    )
  );

-- Only the sender can insert
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant1_id, c.participant2_id)
    )
  );

-- Recipient can mark as read (lu = true), but not edit content
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant1_id, c.participant2_id)
    )
  );

CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS messages_unread_idx ON messages (conversation_id, sender_id, lu) WHERE lu = false;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
