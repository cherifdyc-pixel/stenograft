CREATE OR REPLACE FUNCTION increment_super_chats_total(p_room_id TEXT, p_amount NUMERIC)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE live_sessions
  SET super_chats_total = super_chats_total + p_amount
  WHERE room_id = p_room_id;
$$;
