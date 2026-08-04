import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCommerceProduct } from "@/content/commerce";
import { getSqlClient } from "@/db/client";
import { validatePaidLine } from "@/lib/commerce/validation";
import { requireServerEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante." }, { status: 400 });

  let eventId: string | undefined;
  try {
    const payload = await request.text();
    const { STRIPE_WEBHOOK_SECRET } = requireServerEnv("STRIPE_WEBHOOK_SECRET");
    const stripe = getStripe();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, STRIPE_WEBHOOK_SECRET);
    eventId = event.id;
    const sql = getSqlClient();
    const claimed = await sql`
      INSERT INTO stripe_events (stripe_event_id, event_type, status)
      VALUES (${event.id}, ${event.type}, 'processing')
      ON CONFLICT (stripe_event_id) DO UPDATE SET status = 'processing', error_code = NULL
      WHERE stripe_events.status = 'failed'
      RETURNING id
    `;
    if (!claimed.length) return NextResponse.json({ received: true, duplicate: true });

    if (event.type !== "checkout.session.completed") {
      await sql`UPDATE stripe_events SET status = 'ignored', processed_at = now() WHERE stripe_event_id = ${event.id}`;
      return NextResponse.json({ received: true });
    }

    const embedded = event.data.object as Stripe.Checkout.Session;
    if (embedded.payment_status !== "paid") throw new Error("SESSION_NOT_PAID");
    const orderId = embedded.metadata?.order_id;
    const productCode = embedded.metadata?.product_code;
    const product = productCode ? getCommerceProduct(productCode) : null;
    if (!orderId || !product) throw new Error("INVALID_METADATA");

    const configuredPriceId = requireServerEnv(product.stripePriceEnv)[product.stripePriceEnv];
    const session = await stripe.checkout.sessions.retrieve(embedded.id, { expand: ["line_items"] });
    const item = session.line_items?.data[0];
    const valid = item && validatePaidLine(product, {
      priceId: typeof item.price === "string" ? item.price : item.price?.id ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
    }, configuredPriceId);
    if (!valid || session.line_items?.data.length !== 1) throw new Error("PRODUCT_MISMATCH");

    await sql`
      SELECT grant_suns_for_paid_order(
        ${orderId}::uuid, ${session.id}, ${typeof session.payment_intent === "string" ? session.payment_intent : null},
        ${typeof session.customer === "string" ? session.customer : null}, now()
      )
    `;
    await sql`UPDATE stripe_events SET status = 'processed', processed_at = now() WHERE stripe_event_id = ${event.id}`;
    return NextResponse.json({ received: true });
  } catch (error) {
    const name = error instanceof Error ? error.message.slice(0, 80) : "UNKNOWN";
    if (eventId) {
      try {
        const sql = getSqlClient();
        await sql`UPDATE stripe_events SET status='failed', error_code=${name} WHERE stripe_event_id=${eventId} AND status='processing'`;
      } catch { /* La réponse 400 déclenchera aussi une nouvelle livraison Stripe. */ }
    }
    console.error("stripe_webhook_failed", name);
    return NextResponse.json({ error: "Webhook refusé." }, { status: 400 });
  }
}
