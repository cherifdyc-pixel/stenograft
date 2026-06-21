// Diagnostic temporaire — supprimé après vérification
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const stripeKey  = (process.env.STRIPE_SECRET_KEY       ?? "").trim();
  const webhookSec = (process.env.STRIPE_WEBHOOK_SECRET   ?? "").trim();
  const svcRole    = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  const env = {
    stripe_key_set:              !!stripeKey,
    stripe_key_prefix:           stripeKey.slice(0, 12),
    webhook_secret_set:          !!webhookSec,
    webhook_secret_prefix:       webhookSec.slice(0, 10),
    supabase_svc_role_set:       !!svcRole,
    supabase_svc_role_prefix:    svcRole.slice(0, 12),
  };

  if (!stripeKey) {
    return NextResponse.json({ env, error: "STRIPE_SECRET_KEY manquante" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  // 1. List registered webhook endpoints in Stripe
  const wh = await stripe.webhookEndpoints.list({ limit: 5 });
  const webhooks = wh.data.map(w => ({
    url:    w.url,
    status: w.status,
    events: w.enabled_events,
  }));

  // 2. Send a live signed test event to our own webhook
  let liveTest: Record<string, unknown> = { skipped: "STRIPE_WEBHOOK_SECRET manquante" };

  if (webhookSec) {
    try {
      const payload = JSON.stringify({
        id:   `evt_diag_${Date.now()}`,
        type: "payment_intent.succeeded",
        data: { object: {
          id:       "pi_diag_test_stenograft",
          amount:   500,
          currency: "eur",
          metadata: { roomId: "diag-room", message: "Diagnostic webhook", userId: "diag" },
        }},
      });

      const timestamp = Math.floor(Date.now() / 1000);
      const sig = stripe.webhooks.generateTestHeaderString({
        payload, secret: webhookSec, timestamp,
      });

      const res = await fetch("https://www.stenograft.fr/api/stripe/webhook", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "stripe-signature": sig },
        body:    payload,
      });

      liveTest = { http_status: res.status, body: await res.text() };
    } catch (e: unknown) {
      liveTest = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ env, webhooks, live_test: liveTest });
}
