import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Env manquante: URL=${!!url} KEY=${!!key}`);
  return createClient(url, key);
}

const ALLOWED = [
  "username", "display_name", "bio", "city", "website",
  "avatar_url", "banner_url", "onboarded", "channel_desc", "channel_cat",
];

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body invalide" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key] ?? null;
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });

  const admin = getAdmin();

  // _upsert: true quand la row profile peut ne pas encore exister (onboarding)
  const useUpsert = body._upsert === true;
  let data, error;

  if (useUpsert) {
    ({ data, error } = await admin
      .from("profiles")
      .upsert({ id: user.id, ...updates }, { onConflict: "id" })
      .select()
      .maybeSingle());
  } else {
    ({ data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .maybeSingle());
  }

  if (error) {
    console.error("[profile/update] error:", error.message, error.code, error.details);
    return NextResponse.json({ error: error.message, detail: error }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
