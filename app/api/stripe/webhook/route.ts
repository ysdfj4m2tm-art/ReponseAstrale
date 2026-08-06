import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCommerceProduct } from "@/content/commerce";
import { getSqlClient } from "@/db/client";
import { validatePaidLine } from "@/lib/commerce/validation";
import { assertCommerceEnvironment, requireServerEnv } from "@/lib/env";
import { assertStripeLivemode, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

type SqlClient = ReturnType<typeof getSqlClient>;

function objectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function grantPaidSession(sql: SqlClient, sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
  assertStripeLivemode(session.livemode);
  if (session.payment_status !== "paid") throw new Error("SESSION_NOT_PAID");

  const orderId = session.metadata?.order_id;
  const productCode = session.metadata?.product_code;
  const product = productCode ? getCommerceProduct(productCode) : null;
  if (!orderId || !product) throw new Error("INVALID_METADATA");

  const configuredPriceId = requireServerEnv(product.stripePriceEnv)[product.stripePriceEnv];
  const item = session.line_items?.data[0];
  const price = item && typeof item.price !== "string" ? item.price : null;
  const valid = item && validatePaidLine(product, {
    priceId: typeof item.price === "string" ? item.price : item.price?.id ?? null,
    amountTotal: session.amount_total,
    currency: session.currency,
  }, configuredPriceId) && (!price || price.livemode === session.livemode);
  if (!valid || session.line_items?.data.length !== 1) throw new Error("PRODUCT_MISMATCH");

  await sql`
    SELECT grant_suns_for_paid_order(
      ${orderId}::uuid, ${session.id}, ${objectId(session.payment_intent)},
      ${objectId(session.customer)}, now()
    )
  `;
}

async function handleEvent(sql: SqlClient, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") await grantPaidSession(sql, session.id);
      return "processed";
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await grantPaidSession(sql, session.id);
      return "processed";
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) return "ignored";
      await sql`SELECT record_order_payment_failure(${orderId}::uuid, ${session.id}, ${objectId(session.payment_intent)}, 'async_payment_failed')`;
      return "processed";
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) return "ignored";
      await sql`SELECT record_checkout_expiration(${orderId}::uuid, ${session.id})`;
      return "processed";
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.order_id;
      if (!orderId) return "ignored";
      await sql`SELECT record_order_payment_failure(${orderId}::uuid, ${null}, ${intent.id}, 'payment_intent_failed')`;
      return "processed";
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = objectId(charge.payment_intent);
      if (!paymentIntentId) return "ignored";
      const rows = await sql`SELECT record_order_refund(${paymentIntentId}, ${charge.id}, ${charge.refunded}, ${charge.amount_refunded}) AS order_id`;
      return rows[0]?.order_id ? "processed" : "ignored";
    }
    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const stripe = getStripe();
      const charge = typeof dispute.charge === "string" ? await stripe.charges.retrieve(dispute.charge) : dispute.charge;
      const paymentIntentId = objectId(charge.payment_intent);
      if (!paymentIntentId) return "ignored";
      const rows = await sql`SELECT record_order_dispute(${paymentIntentId}, ${dispute.id}) AS order_id`;
      return rows[0]?.order_id ? "processed" : "ignored";
    }
    default:
      return "ignored";
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante." }, { status: 400 });

  let eventId: string | undefined;
  try {
    assertCommerceEnvironment();
    const payload = await request.text();
    const { STRIPE_WEBHOOK_SECRET } = requireServerEnv("STRIPE_WEBHOOK_SECRET");
    const stripe = getStripe();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, STRIPE_WEBHOOK_SECRET);
    assertStripeLivemode(event.livemode);
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

    const status = await handleEvent(sql, event);
    await sql`UPDATE stripe_events SET status = ${status}, processed_at = now() WHERE stripe_event_id = ${event.id}`;
    return NextResponse.json({ received: true });
  } catch (error) {
    const name = error instanceof Error ? error.message.slice(0, 80) : "UNKNOWN";
    if (eventId) {
      try {
        const sql = getSqlClient();
        await sql`UPDATE stripe_events SET status='failed', error_code=${name} WHERE stripe_event_id=${eventId} AND status='processing'`;
      } catch { /* Une réponse non-2xx déclenchera aussi une nouvelle livraison Stripe. */ }
    }
    console.error("stripe_webhook_failed", name);
    return NextResponse.json({ error: "Webhook refusé." }, { status: 400 });
  }
}
