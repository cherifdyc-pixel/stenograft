-- Add UNIQUE constraint so webhook upsert(onConflict: "stripe_payment_id") is idempotent
ALTER TABLE super_chats
  ADD CONSTRAINT super_chats_stripe_payment_id_key
  UNIQUE (stripe_payment_id);
