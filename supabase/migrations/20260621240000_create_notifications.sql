-- ── notifications ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('follow', 'approve', 'relay', 'reply')),
  read       BOOLEAN     NOT NULL DEFAULT false,
  actor_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  graft_id   UUID        REFERENCES grafts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Server-side inserts only (via triggers or API with service role)
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications (user_id, read, created_at DESC);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── Trigger : notification "follow" quand un follow est créé ──────────────────

CREATE OR REPLACE FUNCTION fn_notify_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ne pas notifier si on se suit soi-même
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_follow();
