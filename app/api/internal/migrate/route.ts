// Route temporaire — à supprimer après usage
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
    WHERE tablename = 'super_chats' AND indexname = 'super_chats_live_id_idx'
  ) THEN
    CREATE INDEX super_chats_live_id_idx ON super_chats (live_id, created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'super_chats' AND policyname = 'super_chats_select'
  ) THEN
    CREATE POLICY "super_chats_select" ON super_chats FOR SELECT USING (true);
  END IF;
END $$;
`;

export async function POST(req: NextRequest) {
  // Protection: must send the webhook secret as bearer token
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token || token !== (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const supabaseUrl    = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const projectRef     = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

  if (!serviceRoleKey) {
    return NextResponse.json({
      error: "SUPABASE_SERVICE_ROLE_KEY manquante dans Vercel",
      hint:  "Ajoute-la dans Vercel → Settings → Environment Variables",
    }, { status: 500 });
  }

  // Try Supabase Management API with service_role JWT
  const mgmtRes = await fetch(
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

  const mgmtBody = await mgmtRes.text();

  if (mgmtRes.ok) {
    return NextResponse.json({ ok: true, method: "management-api", result: mgmtBody });
  }

  // Fallback: try direct pg connection via Supabase REST + pg-based endpoint
  return NextResponse.json({
    error:       "Management API échouée",
    mgmt_status: mgmtRes.status,
    mgmt_body:   mgmtBody,
    service_key_set: !!serviceRoleKey,
    service_key_prefix: serviceRoleKey.slice(0, 10),
  }, { status: 500 });
}
