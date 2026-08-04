CREATE OR REPLACE FUNCTION create_pending_order(
  p_email_normalized text,
  p_product_code text,
  p_chart_id uuid,
  p_cgv_version text,
  p_privacy_version text,
  p_execution_consent_version text
) RETURNS TABLE(order_id uuid, opaque_session_id uuid, amount_cents integer, currency text)
LANGUAGE plpgsql AS $$
DECLARE
  target_product products%ROWTYPE;
  new_order orders%ROWTYPE;
BEGIN
  SELECT * INTO target_product FROM products
  WHERE code = p_product_code AND is_active = true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_ACTIVE'; END IF;

  IF p_chart_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM charts WHERE id = p_chart_id) THEN
    RAISE EXCEPTION 'CHART_NOT_FOUND';
  END IF;

  INSERT INTO orders (email_normalized, chart_id, product_code, amount_cents, currency)
  VALUES (lower(trim(p_email_normalized)), p_chart_id, target_product.code, target_product.price_cents, target_product.currency)
  RETURNING * INTO new_order;

  INSERT INTO legal_acceptances (
    order_id, cgv_version, privacy_version, execution_consent_version,
    cgv_accepted_at, execution_consented_at
  ) VALUES (
    new_order.id, p_cgv_version, p_privacy_version, p_execution_consent_version, now(), now()
  );

  INSERT INTO commercial_events (order_id, kind, metadata)
  VALUES (new_order.id, 'checkout_started', jsonb_build_object('product_code', target_product.code));

  RETURN QUERY SELECT new_order.id, new_order.opaque_session_id, new_order.amount_cents, new_order.currency;
END;
$$;
