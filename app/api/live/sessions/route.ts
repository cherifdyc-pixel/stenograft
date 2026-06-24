import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env manquante");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { room_id, title, category, platform } = body as Record<string, string>;

  if (!room_id || !title?.trim()) {
    return NextResponse.json({ error: "room_id et title sont requis" }, { status: 400 });
  }

  if (title.length > 150) {
    return NextResponse.json({ error: "Titre trop long (max 150 caractères)" }, { status: 400 });
  }

  // Get the authenticated user's actual username — never trust the client
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const username = profile?.username ?? user.email?.split("@")[0] ?? "Grafter";

  let admin;
  try {
    admin = getAdmin();
  } catch {
    return NextResponse.json({ error: "Erreur de configuration serveur" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("live_sessions")
    .insert({
      room_id,
      user_id:  user.id,
      username,
      title:    title.trim(),
      category: category ?? "Autre",
      platform: platform ?? "steno",
      status:   "live",
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[live/sessions POST] erreur:", error.message, error.code);
    return NextResponse.json({ error: "Erreur lors de la création de la session" }, { status: 500 });
  }

  return NextResponse.json({ session: data }, { status: 201 });
}

export async function GET() {
  let admin;
  try {
    admin = getAdmin();
  } catch {
    return NextResponse.json({ error: "Erreur de configuration serveur" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("live_sessions")
    .select("id,room_id,user_id,username,title,category,platform,status,viewers_count,peak_viewers,super_chats_total,started_at,ended_at")
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[live/sessions GET] erreur:", error.message, error.code);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}
