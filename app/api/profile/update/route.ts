import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env manquante");
  return createClient(url, key);
}

const ALLOWED = [
  "username", "display_name", "bio", "city", "website",
  "avatar_url", "banner_url", "onboarded", "channel_desc", "channel_cat",
  "onboarding_completed", "interests",
] as const;

const MAX_LENGTHS: Partial<Record<typeof ALLOWED[number], number>> = {
  username:     30,
  display_name: 100,
  bio:          500,
  city:         100,
  website:      200,
  channel_desc: 500,
  channel_cat:  50,
};

const VALID_INTERESTS = ["Politique", "Économie", "Environnement", "Culture", "Sport", "Local"];

function isSafeUrl(val: unknown): boolean {
  if (val === null || val === "") return true;
  if (typeof val !== "string") return false;
  try {
    const { protocol } = new URL(val);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function isSupabaseStorageUrl(val: unknown): boolean {
  if (val === null || val === "") return true;
  if (typeof val !== "string") return false;
  try {
    const { protocol, hostname } = new URL(val);
    if (protocol !== "https:") return false;
    return hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body invalide" }, { status: 400 });

  // Validate individual fields before building updates
  if ("onboarding_completed" in body && typeof body.onboarding_completed !== "boolean") {
    return NextResponse.json({ error: "onboarding_completed invalide" }, { status: 400 });
  }
  if ("interests" in body) {
    if (!Array.isArray(body.interests) || body.interests.some((i: unknown) => !VALID_INTERESTS.includes(i as string))) {
      return NextResponse.json({ error: "interests invalides" }, { status: 400 });
    }
  }
  if ("website" in body && !isSafeUrl(body.website)) {
    return NextResponse.json({ error: "URL du site invalide" }, { status: 400 });
  }
  if ("avatar_url" in body && !isSupabaseStorageUrl(body.avatar_url)) {
    return NextResponse.json({ error: "avatar_url invalide" }, { status: 400 });
  }
  if ("banner_url" in body && !isSupabaseStorageUrl(body.banner_url)) {
    return NextResponse.json({ error: "banner_url invalide" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (!(key in body)) continue;
    const val = body[key] ?? null;
    const maxLen = MAX_LENGTHS[key];
    if (maxLen && typeof val === "string" && val.length > maxLen) {
      return NextResponse.json({ error: `${key} trop long (max ${maxLen})` }, { status: 400 });
    }
    updates[key] = val;
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });

  const admin = getAdmin();

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
    console.error("[profile/update] error:", error.message, error.code);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
