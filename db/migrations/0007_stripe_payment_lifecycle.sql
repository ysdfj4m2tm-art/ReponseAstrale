CREATE OR REPLACE FUNCTION record_order_payment_failure(
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_reason text
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE affected integer;
BEGIN
  UPDATE orders SET
    status = 'payment_failed',
    stripe_checkout_session_id = COALESCE(stripe_checkout_session_id, p_checkout_session_id),
    stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, p_payment_intent_id)
  WHERE id = p_order_id AND status IN ('pending', 'checkout_created');
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected > 0 THEN
    INSERT INTO commercial_events (order_id, kind, metadata)
    VALUES (p_order_id, 'payment_failed', jsonb_build_object('reason', left(COALESCE(p_reason, 'unknown'), 80)));
  END IF;
  RETURN affected > 0;
END;
$$;

CREATE OR REPLACE FUNCTION record_checkout_expiration(
  p_order_id uuid,
  p_checkout_session_id text
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE affected integer;
BEGIN
  UPDATE orders SET
    status = 'expired',
    stripe_checkout_session_id = COALESCE(stripe_checkout_session_id, p_checkout_session_id)
  WHERE id = p_order_id AND status IN ('pending', 'checkout_created');
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected > 0 THEN
    INSERT INTO commercial_events (order_id, kind, metadata)
    VALUES (p_order_id, 'checkout_expired', '{}'::jsonb);
  END IF;
  RETURN affected > 0;
END;
$$;

CREATE OR REPLACE FUNCTION record_order_refund(
  p_payment_intent_id text,
  p_charge_id text,
  p_full_refund boolean,
  p_amount_refunded integer
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE target_order orders%ROWTYPE;
BEGIN
  SELECT * INTO target_order FROM orders
  WHERE stripe_payment_intent_id = p_payment_intent_id
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF p_full_refund THEN
    UPDATE orders SET status = 'refunded', refunded_at = COALESCE(refunded_at, now())
    WHERE id = target_order.id AND status IN ('paid', 'disputed', 'refunded');
    UPDATE sun_entitlements SET status = 'refunded', quantity_remaining = 0
    WHERE order_id = target_order.id AND status <> 'refunded';
  END IF;

  INSERT INTO commercial_events (user_id, order_id, kind, metadata)
  VALUES (
    target_order.user_id,
    target_order.id,
    CASE WHEN p_full_refund THEN 'order_refunded' ELSE 'order_partially_refunded' END,
    jsonb_build_object('charge_id', p_charge_id, 'amount_refunded', p_amount_refunded)
  );
  RETURN target_order.id;
END;
$$;

CREATE OR REPLACE FUNCTION record_order_dispute(
  p_payment_intent_id text,
  p_dispute_id text
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE target_order orders%ROWTYPE;
BEGIN
  SELECT * INTO target_order FROM orders
  WHERE stripe_payment_intent_id = p_payment_intent_id
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE orders SET status = 'disputed'
  WHERE id = target_order.id AND status = 'paid';
  UPDATE sun_entitlements SET status = 'suspended'
  WHERE order_id = target_order.id AND status = 'active' AND quantity_remaining > 0;
  INSERT INTO commercial_events (user_id, order_id, kind, metadata)
  VALUES (target_order.user_id, target_order.id, 'charge_disputed', jsonb_build_object('dispute_id', p_dispute_id));
  RETURN target_order.id;
END;
$$;
