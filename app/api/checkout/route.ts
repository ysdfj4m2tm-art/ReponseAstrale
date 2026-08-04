import { NextResponse } from "next/server";
import { legalConfig } from "@/content/legal";
import { getSqlClient } from "@/db/client";
import { resolveChartToken } from "@/lib/commerce/chart-access";
import { validateCheckoutInput, type CheckoutInput } from "@/lib/commerce/validation";
import { ConfigurationError, getAppUrl, normalizeEmail, requireServerEnv } from "@/lib/env";
import { checkRateLimit, requestRateLimitKey } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(requestRateLimitKey(request, "checkout"), 8, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans un instant." }, { status: 429 });

  try {
    const body = (await request.json()) as CheckoutInput;
    const validation = validateCheckoutInput(body);
    if (!validation.ok) return NextResponse.json({ error: validation.code }, { status: 400 });

    const product = validation.product;
    const priceId = requireServerEnv(product.stripePriceEnv)[product.stripePriceEnv];
    const chartId = await resolveChartToken(body.chartToken);
    if (body.chartToken && !chartId) return NextResponse.json({ error: "INVALID_CHART_TOKEN" }, { status: 400 });
    const sql = getSqlClient();
    const created = await sql`
      SELECT * FROM create_pending_order(
        ${normalizeEmail(body.email)}, ${product.code}, ${chartId}::uuid,
        ${legalConfig.cgvVersion}, ${legalConfig.privacyVersion}, ${legalConfig.executionConsentVersion}
      )
    `;
    const order = created[0];

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: normalizeEmail(body.email),
      client_reference_id: String(order.opaque_session_id),
      metadata: { order_id: String(order.order_id), product_code: product.code },
      success_url: `${getAppUrl()}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/paiement/annule`,
      locale: "fr",
      allow_promotion_codes: false,
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
    }, { idempotencyKey: `checkout-${order.order_id}` });

    await sql`
      UPDATE orders SET status = 'checkout_created', stripe_checkout_session_id = ${session.id}
      WHERE id = ${order.order_id}::uuid AND status = 'pending'
    `;
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return NextResponse.json({ error: "Paiement indisponible : configuration de test incomplète." }, { status: 503 });
    }
    console.error("checkout_failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Impossible de préparer le paiement." }, { status: 500 });
  }
}
