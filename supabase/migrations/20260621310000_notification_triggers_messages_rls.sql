-- ── Restrict messages UPDATE to marking as read only ─────────────────────────
-- Previous policy allowed participants to overwrite content/sender_id.
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant1_id, c.participant2_id)
    )
  )
  WITH CHECK (lu = true);

-- ── Trigger: notification "approve" ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_notify_approve()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT user_id INTO v_author_id FROM grafts WHERE id = NEW.graft_id;
  IF v_author_id IS NULL OR v_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO notifications (user_id, type, actor_id, graft_id)
  VALUES (v_author_id, 'approve', NEW.user_id, NEW.graft_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_approve ON approvals;
CREATE TRIGGER trg_notify_approve
  AFTER INSERT ON approvals
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_approve();

-- ── Trigger: notification "relay" ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_notify_relay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT user_id INTO v_author_id FROM grafts WHERE id = NEW.graft_id;
  IF v_author_id IS NULL OR v_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO notifications (user_id, type, actor_id, graft_id)
  VALUES (v_author_id, 'relay', NEW.user_id, NEW.graft_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_relay ON relays;
CREATE TRIGGER trg_notify_relay
  AFTER INSERT ON relays
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_relay();

-- ── Trigger: notification "reply" ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_notify_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO v_author_id FROM grafts WHERE id = NEW.parent_id;
  IF v_author_id IS NULL OR v_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO notifications (user_id, type, actor_id, graft_id)
  VALUES (v_author_id, 'reply', NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_reply ON grafts;
CREATE TRIGGER trg_notify_reply
  AFTER INSERT ON grafts
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_reply();
