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

export async function POST(request: Request) {
  console.log("[profile/update] SERVICE_ROLE_KEY définie:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("[profile/update] SUPABASE_URL définie:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  console.log("[profile/update] auth user id:", user?.id ?? null, "authErr:", authErr?.message ?? null);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body invalide" }, { status: 400 });

  const { display_name, bio, city, website, avatar_url, username } = body;
  const payload = {
    id:           user.id,
    username:     username ?? user.user_metadata?.username ?? user.email?.split("@")[0],
    display_name: display_name ?? null,
    bio:          bio ?? null,
    city:         city ?? null,
    website:      website ?? null,
    avatar_url:   avatar_url ?? null,
  };
  console.log("[profile/update] upsert payload:", JSON.stringify(payload));

  const admin = getAdmin();
  const { data, error } = await admin
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[profile/update] Supabase error message:", error.message);
    console.error("[profile/update] Supabase error code:", error.code);
    console.error("[profile/update] Supabase error details:", error.details);
    console.error("[profile/update] Supabase error hint:", error.hint);
    console.error("[profile/update] Supabase error full:", JSON.stringify(error));
    return NextResponse.json({ error: error.message, detail: error }, { status: 500 });
  }

  console.log("[profile/update] succès, data:", JSON.stringify(data));
  return NextResponse.json({ profile: data });
}
