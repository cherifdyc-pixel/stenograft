import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[live/sessions] SUPABASE_URL présente:", !!url);
  console.log("[live/sessions] SERVICE_ROLE_KEY présente:", !!key);
  if (!url || !key) throw new Error(`Env manquante: URL=${!!url} KEY=${!!key}`);
  return createClient(url, key);
}

// POST /api/live/sessions
export async function POST(req: NextRequest) {
  console.log("[live/sessions POST] début");

  let cookieStore;
  try {
    cookieStore = await cookies();
    console.log("[live/sessions POST] cookies OK");
  } catch (e) {
    console.error("[live/sessions POST] erreur cookies:", e);
    return NextResponse.json({ error: "Erreur cookies", detail: String(e) }, { status: 500 });
  }

  let user;
  try {
    const supabase = createServerClient(cookieStore);
    const { data, error } = await supabase.auth.getUser();
    if (error) console.error("[live/sessions POST] auth error:", error);
    user = data?.user ?? null;
    console.log("[live/sessions POST] user:", user?.id ?? "null");
  } catch (e) {
    console.error("[live/sessions POST] exception auth:", e);
    return NextResponse.json({ error: "Erreur auth", detail: String(e) }, { status: 500 });
  }

  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    console.log("[live/sessions POST] body:", JSON.stringify(body));
  } catch (e) {
    console.error("[live/sessions POST] erreur parsing body:", e);
    return NextResponse.json({ error: "Body JSON invalide", detail: String(e) }, { status: 400 });
  }

  const { room_id, username, title, category, platform } = body as Record<string, string>;

  if (!room_id || !title || !username) {
    console.warn("[live/sessions POST] champs manquants:", { room_id, title, username });
    return NextResponse.json({ error: "room_id, username et title sont requis" }, { status: 400 });
  }

  let admin;
  try {
    admin = getAdmin();
    console.log("[live/sessions POST] admin client créé");
  } catch (e) {
    console.error("[live/sessions POST] échec getAdmin():", e);
    return NextResponse.json({ error: "Config service role manquante", detail: String(e) }, { status: 500 });
  }

  const payload = {
    room_id,
    user_id:  user.id,
    username,
    title:    title.trim(),
    category: category ?? "Autre",
    platform: platform ?? "steno",
    status:   "live",
  };
  console.log("[live/sessions POST] insert payload:", JSON.stringify(payload));

  const { data, error } = await admin
    .from("live_sessions")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[live/sessions POST] erreur Supabase insert:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    }, { status: 500 });
  }

  console.log("[live/sessions POST] session créée:", data?.id);
  return NextResponse.json({ session: data }, { status: 201 });
}

// GET /api/live/sessions
export async function GET() {
  console.log("[live/sessions GET] début");

  let admin;
  try {
    admin = getAdmin();
  } catch (e) {
    console.error("[live/sessions GET] échec getAdmin():", e);
    return NextResponse.json({ error: "Config service role manquante", detail: String(e) }, { status: 500 });
  }

  const { data, error } = await admin
    .from("live_sessions")
    .select("id,room_id,user_id,username,title,category,platform,status,viewers_count,peak_viewers,super_chats_total,started_at,ended_at")
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[live/sessions GET] erreur Supabase:", error);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  console.log("[live/sessions GET] sessions retournées:", data?.length ?? 0);
  return NextResponse.json({ sessions: data ?? [] });
}
