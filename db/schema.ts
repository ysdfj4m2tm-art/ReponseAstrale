import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const orderStatusEnum = pgEnum("order_status", [
  "pending", "checkout_created", "paid", "payment_failed", "expired", "refunded", "disputed", "cancelled",
]);
export const entitlementStatusEnum = pgEnum("entitlement_status", ["active", "consumed", "expired", "suspended", "refunded"]);
export const questionStatusEnum = pgEnum("question_status", ["submitted", "processing", "answered", "failed", "cancelled"]);
export const chartCalculationStatusEnum = pgEnum("chart_calculation_status", ["pending_calculation", "calculated", "failed"]);
export const stripeEventStatusEnum = pgEnum("stripe_event_status", ["processing", "processed", "failed", "ignored"]);
export const retractionStatusEnum = pgEnum("retraction_status", ["requested", "email_verification_pending", "under_review", "accepted", "rejected", "refunded"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  emailNormalized: text("email_normalized").notNull().unique(),
  firstName: text("first_name"),
  ...timestamps,
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [check("profiles_email_normalized", sql`${table.emailNormalized} = lower(${table.emailNormalized})`)]);

export const charts = pgTable("charts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  externalCaseId: text("external_case_id"),
  firstName: text("first_name").notNull(),
  birthDate: text("birth_date").notNull(),
  birthTime: text("birth_time"),
  birthTimeKnown: boolean("birth_time_known").default(false).notNull(),
  birthPlace: text("birth_place").notNull(),
  birthCountry: text("birth_country"),
  timezone: text("timezone"),
  chartDataJson: jsonb("chart_data_json"),
  calculationStatus: chartCalculationStatusEnum("calculation_status").default("pending_calculation").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("charts_external_case_id_uq").on(table.externalCaseId), index("charts_user_idx").on(table.userId)]);

export const chartAccessTokens = pgTable("chart_access_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  chartId: uuid("chart_id").notNull().references(() => charts.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("chart_access_tokens_lookup_idx").on(table.tokenHash, table.expiresAt)]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").default("eur").notNull(),
  sunCount: integer("sun_count").notNull(),
  validityDays: integer("validity_days").notNull(),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
}, (table) => [
  check("products_price_positive", sql`${table.priceCents} > 0`),
  check("products_suns_positive", sql`${table.sunCount} > 0`),
  check("products_validity_positive", sql`${table.validityDays} > 0`),
]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  emailNormalized: text("email_normalized").notNull(),
  chartId: uuid("chart_id").references(() => charts.id, { onDelete: "set null" }),
  productCode: text("product_code").notNull().references(() => products.code),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").default("eur").notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  opaqueSessionId: uuid("opaque_session_id").defaultRandom().notNull().unique(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("orders_user_idx").on(table.userId, table.createdAt),
  index("orders_email_unclaimed_idx").on(table.emailNormalized, table.status),
  check("orders_amount_positive", sql`${table.amountCents} > 0`),
  check("orders_email_normalized", sql`${table.emailNormalized} = lower(${table.emailNormalized})`),
]);

export const sunEntitlements = pgTable("sun_entitlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "restrict" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  chartId: uuid("chart_id").references(() => charts.id, { onDelete: "set null" }),
  quantityInitial: integer("quantity_initial").notNull(),
  quantityRemaining: integer("quantity_remaining").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: entitlementStatusEnum("status").default("active").notNull(),
  ...timestamps,
}, (table) => [
  index("sun_entitlements_consume_idx").on(table.userId, table.expiresAt, table.status),
  check("sun_entitlements_initial_positive", sql`${table.quantityInitial} > 0`),
  check("sun_entitlements_remaining_range", sql`${table.quantityRemaining} >= 0 AND ${table.quantityRemaining} <= ${table.quantityInitial}`),
]);

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  chartId: uuid("chart_id").notNull().references(() => charts.id, { onDelete: "restrict" }),
  entitlementId: uuid("entitlement_id").notNull().references(() => sunEntitlements.id, { onDelete: "restrict" }),
  category: text("category").notNull(),
  questionText: text("question_text").notNull(),
  status: questionStatusEnum("status").default("submitted").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  requestFingerprint: text("request_fingerprint").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  sunRestoredAt: timestamp("sun_restored_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("questions_user_idx").on(table.userId, table.submittedAt), index("questions_studio_queue_idx").on(table.status, table.submittedAt)]);

export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().unique().references(() => questions.id, { onDelete: "cascade" }),
  answerText: text("answer_text").notNull(),
  pdfUrl: text("pdf_url"),
  promptVersion: text("prompt_version").notNull(),
  model: text("model").notNull(),
  generationCostCents: integer("generation_cost_cents"),
  ...timestamps,
});

export const stripeEvents = pgTable("stripe_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  status: stripeEventStatusEnum("status").default("processing").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  errorCode: text("error_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("stripe_events_status_idx").on(table.status, table.createdAt)]);

export const legalAcceptances = pgTable("legal_acceptances", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "restrict" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  cgvVersion: text("cgv_version").notNull(),
  privacyVersion: text("privacy_version").notNull(),
  executionConsentVersion: text("execution_consent_version").notNull(),
  cgvAcceptedAt: timestamp("cgv_accepted_at", { withTimezone: true }).notNull(),
  executionConsentedAt: timestamp("execution_consented_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const retractionRequests = pgTable("retraction_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  emailNormalized: text("email_normalized").notNull(),
  status: retractionStatusEnum("status").default("email_verification_pending").notNull(),
  verificationTokenHash: text("verification_token_hash").notNull().unique(),
  verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  resolution: text("resolution"),
  ...timestamps,
}, (table) => [index("retraction_requests_review_idx").on(table.status, table.requestedAt)]);

export const commercialEvents = pgTable("commercial_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("commercial_events_order_idx").on(table.orderId, table.createdAt)]);
