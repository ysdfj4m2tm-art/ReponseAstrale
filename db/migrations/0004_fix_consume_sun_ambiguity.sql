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
  SELECT q.* INTO existing_question FROM questions AS q
  WHERE q.idempotency_key = p_idempotency_key AND q.user_id = p_user_id;
  IF FOUND THEN
    RETURN QUERY SELECT existing_question.id, existing_question.entitlement_id, se.quantity_remaining, se.expires_at
      FROM sun_entitlements AS se WHERE se.id = existing_question.entitlement_id;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM charts AS c WHERE c.id = p_chart_id AND c.user_id = p_user_id) THEN
    RAISE EXCEPTION 'CHART_FORBIDDEN';
  END IF;

  UPDATE sun_entitlements AS se SET status = 'expired'
  WHERE se.user_id = p_user_id AND se.status = 'active' AND se.expires_at <= now();

  SELECT se.* INTO chosen FROM sun_entitlements AS se
  WHERE se.user_id = p_user_id
    AND se.status = 'active'
    AND se.quantity_remaining > 0
    AND se.expires_at > now()
    AND (se.chart_id IS NULL OR se.chart_id = p_chart_id)
  ORDER BY se.expires_at ASC, se.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN RAISE EXCEPTION 'NO_ACTIVE_SUN'; END IF;

  UPDATE sun_entitlements AS se SET
    chart_id = COALESCE(se.chart_id, p_chart_id),
    quantity_remaining = se.quantity_remaining - 1,
    status = CASE WHEN se.quantity_remaining - 1 = 0 THEN 'consumed'::entitlement_status ELSE se.status END
  WHERE se.id = chosen.id
  RETURNING se.quantity_remaining, se.expires_at
  INTO chosen.quantity_remaining, chosen.expires_at;

  INSERT INTO questions (user_id, chart_id, entitlement_id, question_text, idempotency_key)
  VALUES (p_user_id, p_chart_id, chosen.id, p_question_text, p_idempotency_key)
  RETURNING questions.id INTO new_question_id;

  INSERT INTO commercial_events (user_id, order_id, kind, metadata)
  SELECT p_user_id, se.order_id, 'sun_consumed', jsonb_build_object('question_id', new_question_id)
  FROM sun_entitlements AS se WHERE se.id = chosen.id;

  RETURN QUERY SELECT new_question_id, chosen.id, chosen.quantity_remaining, chosen.expires_at;
END;
$$;
