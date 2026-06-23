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
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body invalide" }, { status: 400 });

  const { display_name, bio, ville, site, avatar_url, username } = body;

  const admin = getAdmin();
  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id:           user.id,
        username:     username ?? user.user_metadata?.username ?? user.email?.split("@")[0],
        display_name: display_name ?? null,
        bio:          bio ?? null,
        ville:        ville ?? null,
        site:         site ?? null,
        avatar_url:   avatar_url ?? null,
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (error) {
    console.error("[profile/update] Supabase error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message, detail: error }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
