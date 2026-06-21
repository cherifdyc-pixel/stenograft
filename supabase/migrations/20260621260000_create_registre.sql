CREATE TABLE IF NOT EXISTS registre (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date       DATE        NOT NULL,
  author     TEXT        NOT NULL,
  context    TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  verified   BOOLEAN     NOT NULL DEFAULT false,
  added_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE registre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registre_select" ON registre FOR SELECT USING (true);
CREATE POLICY "registre_insert" ON registre FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS registre_date_idx ON registre (date DESC);
CREATE INDEX IF NOT EXISTS registre_author_idx ON registre (author);
