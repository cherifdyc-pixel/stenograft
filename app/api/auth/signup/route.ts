import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { signupLimiter, getIp, tooMany } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  // Rate limit par IP : 5 inscriptions / heure
  const ip = getIp(req);
  const { success, reset } = await signupLimiter.limit(ip);
  if (!success) return tooMany(Math.ceil((reset - Date.now()) / 1000));

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "email et password requis" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase    = createClient(cookieStore);

  const { data, error } = await supabase.auth.signUp({
    email:    body.email,
    password: body.password,
    options:  { data: { username: body.username ?? body.email.split("@")[0] } },
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée." }, { status: 409 });
    }
    if (msg.includes("password") || msg.includes("weak")) {
      return NextResponse.json({ error: "Mot de passe trop faible (8 caractères minimum)." }, { status: 422 });
    }
    return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 });
  }

  return NextResponse.json({ user: data.user }, { status: 201 });
}
