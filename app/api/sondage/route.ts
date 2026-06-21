import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { graft_id, question, options, duree_heures } = await request.json();
  if (!UUID_RE.test(graft_id)) return NextResponse.json({ error: "graft_id invalide" }, { status: 400 });

  if (!question?.trim() || question.length > 300)
    return NextResponse.json({ error: "Question invalide (max 300 caractères)" }, { status: 400 });
  if (!Array.isArray(options) || options.length < 2 || options.length > 10)
    return NextResponse.json({ error: "Options invalides (2 à 10 options requises)" }, { status: 400 });
  if (typeof duree_heures !== "number" || duree_heures < 1 || duree_heures > 720)
    return NextResponse.json({ error: "Durée invalide (1h à 720h)" }, { status: 400 });

  const { data, error } = await supabase
    .from("sondages")
    .insert({ graft_id, question, options, duree_heures })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { sondage_id, option_index } = await request.json();
  if (!UUID_RE.test(sondage_id)) return NextResponse.json({ error: "sondage_id invalide" }, { status: 400 });
  if (typeof option_index !== "number" || option_index < 0) return NextResponse.json({ error: "option_index invalide" }, { status: 400 });

  const { error } = await supabase
    .from("votes_sondage")
    .insert({ sondage_id, user_id: user.id, option_index });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
