CREATE TYPE order_status AS ENUM ('pending', 'checkout_created', 'paid', 'payment_failed', 'expired', 'refunded', 'disputed', 'cancelled');
CREATE TYPE entitlement_status AS ENUM ('active', 'consumed', 'expired', 'suspended', 'refunded');
CREATE TYPE question_status AS ENUM ('submitted', 'processing', 'answered', 'failed', 'cancelled');
CREATE TYPE stripe_event_status AS ENUM ('processing', 'processed', 'failed', 'ignored');
CREATE TYPE retraction_status AS ENUM ('requested', 'email_verification_pending', 'under_review', 'accepted', 'rejected', 'refunded');

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text NOT NULL UNIQUE,
  email_normalized text NOT NULL UNIQUE CHECK (email_normalized = lower(email_normalized)),
  first_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  external_case_id text UNIQUE,
  first_name text NOT NULL,
  birth_date text NOT NULL,
  birth_time text,
  birth_time_known boolean NOT NULL DEFAULT false,
  birth_place text NOT NULL,
  timezone text NOT NULL,
  chart_data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX charts_user_idx ON charts(user_id);

CREATE TABLE chart_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES charts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chart_access_tokens_lookup_idx ON chart_access_tokens(token_hash, expires_at);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  currency text NOT NULL DEFAULT 'eur',
  sun_count integer NOT NULL CHECK (sun_count > 0),
  validity_days integer NOT NULL CHECK (validity_days > 0),
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO products (code, name, price_cents, currency, sun_count, validity_days)
VALUES
  ('one_sun', '1 Soleil', 1990, 'eur', 1, 7),
  ('three_suns', '3 Soleils', 4990, 'eur', 3, 30);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  email_normalized text NOT NULL CHECK (email_normalized = lower(email_normalized)),
  chart_id uuid REFERENCES charts(id) ON DELETE SET NULL,
  product_code text NOT NULL REFERENCES products(code),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'eur',
  status order_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  stripe_customer_id text,
  opaque_session_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON orders(user_id, created_at DESC);
CREATE INDEX orders_email_unclaimed_idx ON orders(email_normalized, status) WHERE user_id IS NULL;

CREATE TABLE sun_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  chart_id uuid REFERENCES charts(id) ON DELETE SET NULL,
  quantity_initial integer NOT NULL CHECK (quantity_initial > 0),
  quantity_remaining integer NOT NULL,
  expires_at timestamptz NOT NULL,
  status entitlement_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sun_entitlements_remaining_range CHECK (quantity_remaining >= 0 AND quantity_remaining <= quantity_initial)
);
CREATE INDEX sun_entitlements_consume_idx ON sun_entitlements(user_id, expires_at, status)
  WHERE quantity_remaining > 0;

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  chart_id uuid NOT NULL REFERENCES charts(id) ON DELETE RESTRICT,
  entitlement_id uuid NOT NULL REFERENCES sun_entitlements(id) ON DELETE RESTRICT,
  question_text text NOT NULL CHECK (char_length(question_text) BETWEEN 20 AND 2000),
  status question_status NOT NULL DEFAULT 'submitted',
  idempotency_key text NOT NULL UNIQUE,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  answered_at timestamptz,
  failure_reason text,
  sun_restored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX questions_user_idx ON questions(user_id, submitted_at DESC);
CREATE INDEX questions_studio_queue_idx ON questions(status, submitted_at);

CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  pdf_url text,
  prompt_version text NOT NULL,
  model text NOT NULL,
  generation_cost_cents integer CHECK (generation_cost_cents IS NULL OR generation_cost_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  status stripe_event_status NOT NULL DEFAULT 'processing',
  processed_at timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stripe_events_status_idx ON stripe_events(status, created_at);

CREATE TABLE legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  cgv_version text NOT NULL,
  privacy_version text NOT NULL,
  execution_consent_version text NOT NULL,
  cgv_accepted_at timestamptz NOT NULL,
  execution_consented_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE retraction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  email_normalized text NOT NULL CHECK (email_normalized = lower(email_normalized)),
  status retraction_status NOT NULL DEFAULT 'email_verification_pending',
  verification_token_hash text NOT NULL UNIQUE,
  verification_expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  requested_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX retraction_requests_review_idx ON retraction_requests(status, requested_at);

CREATE TABLE commercial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  kind text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX commercial_events_order_idx ON commercial_events(order_id, created_at);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['profiles','charts','products','orders','sun_entitlements','questions','answers','retraction_requests']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name, table_name);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION grant_suns_for_paid_order(
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_customer_id text,
  p_paid_at timestamptz
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  target_order orders%ROWTYPE;
  target_product products%ROWTYPE;
  linked_user_id uuid;
  entitlement_id uuid;
BEGIN
  SELECT * INTO target_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  SELECT id INTO entitlement_id FROM sun_entitlements WHERE order_id = p_order_id;
  IF entitlement_id IS NOT NULL THEN RETURN entitlement_id; END IF;

  IF target_order.status NOT IN ('pending', 'checkout_created') THEN
    RAISE EXCEPTION 'ORDER_NOT_PAYABLE';
  END IF;

  SELECT * INTO target_product FROM products WHERE code = target_order.product_code AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_ACTIVE'; END IF;
  IF target_order.amount_cents <> target_product.price_cents OR target_order.currency <> target_product.currency THEN
    RAISE EXCEPTION 'ORDER_PRODUCT_MISMATCH';
  END IF;

  SELECT id INTO linked_user_id FROM profiles
    WHERE email_normalized = target_order.email_normalized AND deleted_at IS NULL;

  UPDATE orders SET
    user_id = COALESCE(user_id, linked_user_id),
    status = 'paid',
    stripe_checkout_session_id = p_checkout_session_id,
    stripe_payment_intent_id = p_payment_intent_id,
    stripe_customer_id = p_customer_id,
    paid_at = p_paid_at
  WHERE id = p_order_id;

  INSERT INTO sun_entitlements (
    order_id, user_id, chart_id, quantity_initial, quantity_remaining, expires_at, status
  ) VALUES (
    p_order_id, linked_user_id, target_order.chart_id, target_product.sun_count,
    target_product.sun_count, p_paid_at + make_interval(days => target_product.validity_days), 'active'
  ) RETURNING id INTO entitlement_id;

  INSERT INTO commercial_events (user_id, order_id, kind, metadata)
  VALUES (linked_user_id, p_order_id, 'order_paid', jsonb_build_object('product_code', target_product.code));
  RETURN entitlement_id;
END;
$$;

CREATE OR REPLACE FUNCTION claim_paid_orders_for_profile(p_profile_id uuid) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  target_email text;
  affected integer;
BEGIN
  SELECT email_normalized INTO target_email FROM profiles
    WHERE id = p_profile_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_NOT_FOUND'; END IF;

  UPDATE orders SET user_id = p_profile_id
  WHERE user_id IS NULL AND status = 'paid' AND email_normalized = target_email;
  GET DIAGNOSTICS affected = ROW_COUNT;

  UPDATE sun_entitlements e SET user_id = p_profile_id
  FROM orders o WHERE e.order_id = o.id AND o.user_id = p_profile_id AND e.user_id IS NULL;
  UPDATE charts c SET user_id = p_profile_id
  WHERE c.user_id IS NULL AND EXISTS (SELECT 1 FROM orders o WHERE o.chart_id = c.id AND o.user_id = p_profile_id);
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION consume_sun_for_question(
  p_user_id uuid,
  p_chart_id uuid,
  p_question_text text,
  p_idempotency_key text
) RETURNS TABLE(question_id uuid, entitlement_id uuid, quantity_remaining integer, expires_at timestamptz)
LANGUAGE plpgsql AS $$
DECLARE
  existing_question questions%ROWTYPE;
  chosen sun_entitlements%ROWTYPE;
  new_question_id uuid;
BEGIN
  SELECT * INTO existing_question FROM questions
  WHERE idempotency_key = p_idempotency_key AND user_id = p_user_id;
  IF FOUND THEN
    RETURN QUERY SELECT existing_question.id, existing_question.entitlement_id, e.quantity_remaining, e.expires_at
      FROM sun_entitlements e WHERE e.id = existing_question.entitlement_id;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM charts WHERE id = p_chart_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'CHART_FORBIDDEN';
  END IF;

  UPDATE sun_entitlements SET status = 'expired'
  WHERE user_id = p_user_id AND status = 'active' AND expires_at <= now();

  SELECT * INTO chosen FROM sun_entitlements
  WHERE user_id = p_user_id
    AND status = 'active'
    AND quantity_remaining > 0
    AND expires_at > now()
    AND (chart_id IS NULL OR chart_id = p_chart_id)
  ORDER BY expires_at ASC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN RAISE EXCEPTION 'NO_ACTIVE_SUN'; END IF;

  UPDATE sun_entitlements SET
    chart_id = COALESCE(chart_id, p_chart_id),
    quantity_remaining = quantity_remaining - 1,
    status = CASE WHEN quantity_remaining - 1 = 0 THEN 'consumed'::entitlement_status ELSE status END
  WHERE id = chosen.id
  RETURNING sun_entitlements.quantity_remaining, sun_entitlements.expires_at
  INTO chosen.quantity_remaining, chosen.expires_at;

  INSERT INTO questions (user_id, chart_id, entitlement_id, question_text, idempotency_key)
  VALUES (p_user_id, p_chart_id, chosen.id, p_question_text, p_idempotency_key)
  RETURNING id INTO new_question_id;

  INSERT INTO commercial_events (user_id, order_id, kind, metadata)
  SELECT p_user_id, order_id, 'sun_consumed', jsonb_build_object('question_id', new_question_id)
  FROM sun_entitlements WHERE id = chosen.id;

  RETURN QUERY SELECT new_question_id, chosen.id, chosen.quantity_remaining, chosen.expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION restore_sun_for_question(p_question_id uuid, p_reason text) RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  target_question questions%ROWTYPE;
BEGIN
  SELECT * INTO target_question FROM questions WHERE id = p_question_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUESTION_NOT_FOUND'; END IF;
  IF target_question.sun_restored_at IS NOT NULL THEN RETURN false; END IF;
  IF target_question.status IN ('processing', 'answered') THEN RAISE EXCEPTION 'QUESTION_ALREADY_IN_EXECUTION'; END IF;

  UPDATE sun_entitlements SET
    quantity_remaining = LEAST(quantity_initial, quantity_remaining + 1),
    status = CASE WHEN expires_at > now() THEN 'active'::entitlement_status ELSE 'expired'::entitlement_status END
  WHERE id = target_question.entitlement_id;

  UPDATE questions SET status = 'cancelled', failure_reason = left(p_reason, 160), sun_restored_at = now()
  WHERE id = p_question_id;
  INSERT INTO commercial_events (user_id, kind, metadata)
  VALUES (target_question.user_id, 'sun_restored', jsonb_build_object('question_id', p_question_id));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION expire_sun_entitlements() RETURNS integer LANGUAGE plpgsql AS $$
DECLARE affected integer;
BEGIN
  UPDATE sun_entitlements SET status = 'expired'
  WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
