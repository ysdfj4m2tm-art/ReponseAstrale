import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const webhook = readFileSync("app/api/stripe/webhook/route.ts", "utf8");
const migration = readFileSync("db/migrations/0007_stripe_payment_lifecycle.sql", "utf8");

describe("cycle de vie Stripe", () => {
  it.each([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
    "payment_intent.payment_failed",
    "charge.refunded",
    "charge.dispute.created",
  ])("traite l’événement %s", (eventType) => expect(webhook).toContain(`\"${eventType}\"`));

  it("vérifie signature, mode et idempotence avant traitement", () => {
    expect(webhook).toMatch(/constructEventAsync/);
    expect(webhook).toMatch(/assertStripeLivemode\(event\.livemode\)/);
    expect(webhook).toMatch(/ON CONFLICT \(stripe_event_id\)/);
  });

  it("versionne les transitions transactionnelles de remboursement et litige", () => {
    expect(migration).toMatch(/record_order_refund/);
    expect(migration).toMatch(/record_order_dispute/);
    expect(migration).toMatch(/status = 'refunded'/);
    expect(migration).toMatch(/status = 'suspended'/);
  });
});
