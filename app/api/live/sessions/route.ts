import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

// POST /api/live/sessions — crée une session live
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { room_id, username, title, category, platform } = body;

  if (!room_id || !title || !username) {
    return NextResponse.json({ error: "room_id, username et title sont requis" }, { status: 400 });
  }

  const { data, error } = await supabase
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}

// GET /api/live/sessions — liste les sessions actives (status = 'live')
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("live_sessions")
    .select("id,room_id,user_id,username,title,category,platform,status,viewers_count,peak_viewers,super_chats_total,started_at,ended_at")
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}
