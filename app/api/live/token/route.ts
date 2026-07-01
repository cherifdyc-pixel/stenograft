import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { liveLimiter, tooMany } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Rate limit par user_id : 5 tokens live / minute
  const { success, reset } = await liveLimiter.limit(user.id);
  if (!success) return tooMany(Math.ceil((reset - Date.now()) / 1000));

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body invalide" }, { status: 400 });

  const { roomName, participantName } = body as { roomName?: string; participantName?: string };

  if (!roomName || !participantName) {
    return NextResponse.json(
      { error: "roomName et participantName sont requis" },
      { status: 400 },
    );
  }

  const apiKey    = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "Configuration LiveKit manquante" }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name:     participantName,
    ttl:      "4h",
  });

  at.addGrant({
    roomJoin:     true,
    room:         roomName,
    canPublish:   true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token });
}
