CREATE TABLE super_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  live_id TEXT,
  montant INTEGER NOT NULL,
  couleur TEXT NOT NULL,
  message TEXT,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE super_chats ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS super_chats_live_id_idx
  ON super_chats (live_id, created_at DESC);

CREATE POLICY "super_chats_select" ON super_chats
  FOR SELECT USING (true);
