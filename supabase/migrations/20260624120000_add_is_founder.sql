-- Add is_founder badge column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false;

-- Backfill: first 1000 users by signup date
UPDATE profiles
SET is_founder = true
WHERE id IN (
  SELECT id
  FROM profiles
  ORDER BY created_at ASC
  LIMIT 1000
);

-- Auto-assign badge for future signups while slots remain
CREATE OR REPLACE FUNCTION auto_set_founder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profiles WHERE is_founder = true) < 1000 THEN
    NEW.is_founder := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_founder ON profiles;
CREATE TRIGGER trg_auto_founder
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_founder();
