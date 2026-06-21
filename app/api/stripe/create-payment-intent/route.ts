import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const VALID_AMOUNTS = new Set([2, 5, 10, 20, 50, 100]);

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
    const { amount, roomId, message, userId } = await req.json();

    if (!VALID_AMOUNTS.has(amount)) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const intent = await stripe.paymentIntents.create({
      amount:   amount * 100,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        roomId:  String(roomId  ?? "").slice(0, 200),
        message: String(message ?? "").slice(0, 500),
        userId:  String(userId  ?? ""),
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err: unknown) {
    const msg  = err instanceof Error ? err.message : "Erreur interne";
    const type = (err as any)?.type ?? (err as any)?.constructor?.name ?? "unknown";
    const keyOk = !!(process.env.STRIPE_SECRET_KEY);
    const keyPrefix = process.env.STRIPE_SECRET_KEY?.slice(0, 7) ?? "missing";
    return NextResponse.json({ error: msg, debug: { type, keyOk, keyPrefix } }, { status: 500 });
  }
}
