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

  // Mise à jour partielle : seuls les champs présents dans le body sont modifiés
  const updates: Record<string, unknown> = {};
  if ("username"     in body) updates.username     = body.username     ?? null;
  if ("display_name" in body) updates.display_name = body.display_name ?? null;
  if ("bio"          in body) updates.bio          = body.bio          ?? null;
  if ("city"         in body) updates.city         = body.city         ?? null;
  if ("website"      in body) updates.website      = body.website      ?? null;
  if ("avatar_url"   in body) updates.avatar_url   = body.avatar_url   ?? null;
  if ("banner_url"   in body) updates.banner_url   = body.banner_url   ?? null;

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });

  const admin = getAdmin();
  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[profile/update] error:", error.message, error.code, error.details);
    return NextResponse.json({ error: error.message, detail: error }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
