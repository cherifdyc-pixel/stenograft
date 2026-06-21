import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const VALID_AMOUNTS = new Set([2, 5, 10, 20, 50, 100]);

export async function POST(req: NextRequest) {
  // Trim whitespace/newlines that may have been added when copying the key
  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  const stripe = new Stripe(stripeKey);
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
    const msg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
