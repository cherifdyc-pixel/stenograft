// Route temporaire — sera supprimée après usage
import { NextRequest, NextResponse } from "next/server";

const SQL = `
CREATE TABLE IF NOT EXISTS super_chats (
  id                uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid         REFERENCES profiles(id),
  live_id           text,
  montant           integer      NOT NULL,
  couleur           text         NOT NULL,
  message           text,
  stripe_payment_id text,
  status            text         DEFAULT 'pending',
  created_at        timestamptz  DEFAULT now()
);

ALTER TABLE super_chats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='super_chats' AND indexname='super_chats_live_id_idx'
  ) THEN
    CREATE INDEX super_chats_live_id_idx ON super_chats (live_id, created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='super_chats' AND policyname='super_chats_select'
  ) THEN
    CREATE POLICY "super_chats_select" ON super_chats FOR SELECT USING (true);
  END IF;
END $$;
`;

export async function POST(req: NextRequest) {
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const supabaseUrl    = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const projectRef     = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

  // Diagnostic: return env info if service key missing
  if (!serviceRoleKey) {
    return NextResponse.json({
      error:   "SUPABASE_SERVICE_ROLE_KEY absente de Vercel",
      url_set: !!supabaseUrl,
      ref:     projectRef,
    }, { status: 500 });
  }

  // Supabase Management API — accepts service_role JWT as project-scoped token
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  const body = await res.text();

  if (res.ok) {
    return NextResponse.json({ ok: true, message: "Table super_chats créée ✅" });
  }

  return NextResponse.json({
    error:      "Management API refusée",
    status:     res.status,
    body,
    key_prefix: serviceRoleKey.slice(0, 20),
  }, { status: 500 });
}

export async function GET() {
  return NextResponse.json({ version: "v3-no-auth", ready: true });
}
