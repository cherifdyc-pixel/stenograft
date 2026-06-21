import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const AMOUNT_COLOR: Record<number, string> = {
  2:   "#4B9AC9",
  5:   "#4BC94B",
  10:  "#C9A24B",
  20:  "#E0492F",
  50:  "#C94BC9",
  100: "#FFD700",
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe((process.env.STRIPE_SECRET_KEY ?? "").trim());
  const body   = await req.text();
  const sig    = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent  = event.data.object as Stripe.PaymentIntent;
    const montant = intent.amount / 100;
    const couleur = AMOUNT_COLOR[montant] ?? "#C9A24B";
    const { roomId, message, userId } = intent.metadata;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Persist in super_chats (idempotent via upsert)
    await supabase.from("super_chats").upsert(
      {
        live_id:           roomId  ?? "",
        user_id:           userId  || null,
        montant,
        couleur,
        message:           message ?? "",
        stripe_payment_id: intent.id,
        status:            "paid",
      },
      { onConflict: "stripe_payment_id" },
    );

    // Broadcast to live chat via live_messages (Realtime picks it up)
    if (roomId) {
      await supabase.from("live_messages").insert({
        room_id:  roomId,
        user_id:  userId || null,
        username: "Super Chat",
        content:  message || `Super Chat de ${montant}€`,
        type:     "super_chat",
        amount:   montant,
      });

      // Increment super_chats_total on the live session (atomic via RPC)
      await supabase.rpc("increment_super_chats_total", { p_room_id: roomId, p_amount: montant });
    }
  }

  return NextResponse.json({ received: true });
}
