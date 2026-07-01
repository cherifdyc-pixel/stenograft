import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { graftLimiter, tooMany } from "@/lib/ratelimit";

const MAX_CONTENT = 1000;
const ALLOWED_TYPES = ["text", "image", "video", "poll", "quote"] as const;
type GraftType = typeof ALLOWED_TYPES[number];

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Rate limit par user_id : 10 grafts / minute
  const { success, reset } = await graftLimiter.limit(user.id);
  if (!success) return tooMany(Math.ceil((reset - Date.now()) / 1000));

  const body = await req.json().catch(() => null);
  if (!body?.content?.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }
  if (body.content.length > MAX_CONTENT) {
    return NextResponse.json({ error: `Le graft ne peut pas dépasser ${MAX_CONTENT} caractères` }, { status: 422 });
  }
  const type: GraftType = ALLOWED_TYPES.includes(body.type) ? body.type : "text";

  const { data, error } = await supabase
    .from("grafts")
    .insert({
      user_id:    user.id,
      content:    body.content.trim(),
      type,
      media_url:  body.media_url  ?? null,
      parent_id:  body.parent_id  ?? null,
      poll_data:  body.poll_data  ?? null,
    })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ graft: data }, { status: 201 });
}
