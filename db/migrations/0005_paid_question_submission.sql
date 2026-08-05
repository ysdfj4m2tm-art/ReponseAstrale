DO $$ BEGIN
  CREATE TYPE chart_calculation_status AS ENUM ('pending_calculation', 'calculated', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE charts
  ADD COLUMN IF NOT EXISTS birth_country text,
  ADD COLUMN IF NOT EXISTS calculation_status chart_calculation_status;

UPDATE charts SET calculation_status = CASE
  WHEN chart_data_json IS NULL OR chart_data_json = '{}'::jsonb THEN 'pending_calculation'::chart_calculation_status
  ELSE 'calculated'::chart_calculation_status
END
WHERE calculation_status IS NULL;

ALTER TABLE charts
  ALTER COLUMN calculation_status SET DEFAULT 'pending_calculation',
  ALTER COLUMN calculation_status SET NOT NULL,
  ALTER COLUMN timezone DROP NOT NULL,
  ALTER COLUMN chart_data_json DROP DEFAULT,
  ALTER COLUMN chart_data_json DROP NOT NULL;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS request_fingerprint text;

UPDATE questions SET
  category = COALESCE(NULLIF(btrim(category), ''), 'autre'),
  request_fingerprint = COALESCE(request_fingerprint, md5(id::text || ':' || question_text))
WHERE category IS NULL OR request_fingerprint IS NULL;

ALTER TABLE questions
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN request_fingerprint SET NOT NULL;

CREATE OR REPLACE FUNCTION submit_paid_question(
  p_user_id uuid,
  p_existing_chart_id uuid,
  p_first_name text,
  p_birth_date text,
  p_birth_time text,
  p_birth_time_known boolean,
  p_birth_place text,
  p_birth_country text,
  p_category text,
  p_question_text text,
  p_idempotency_key text
) RETURNS TABLE(
  question_id uuid,
  chart_id uuid,
  entitlement_id uuid,
  quantity_remaining integer,
  expires_at timestamptz,
  replayed boolean
) LANGUAGE plpgsql AS $$
DECLARE
  existing_question questions%ROWTYPE;
  chosen sun_entitlements%ROWTYPE;
  target_chart_id uuid;
  new_question_id uuid;
  fingerprint text;
BEGIN
  fingerprint := md5(concat_ws('|',
    COALESCE(p_existing_chart_id::text, ''), COALESCE(btrim(p_first_name), ''),
    COALESCE(p_birth_date, ''), COALESCE(p_birth_time, ''), p_birth_time_known::text,
    COALESCE(btrim(p_birth_place), ''), COALESCE(btrim(p_birth_country), ''),
    p_category, btrim(p_question_text)
  ));

  SELECT q.* INTO existing_question
  FROM questions AS q WHERE q.idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF existing_question.user_id <> p_user_id OR existing_question.request_fingerprint <> fingerprint THEN
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT';
    END IF;
    RETURN QUERY SELECT existing_question.id, existing_question.chart_id,
      existing_question.entitlement_id, se.quantity_remaining, se.expires_at, true
    FROM sun_entitlements AS se WHERE se.id = existing_question.entitlement_id;
    RETURN;
  END IF;

  IF p_existing_chart_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM charts AS c WHERE c.id = p_existing_chart_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'CHART_FORBIDDEN';
  END IF;

  UPDATE sun_entitlements AS se SET status = 'expired'
  WHERE se.user_id = p_user_id AND se.status = 'active' AND se.expires_at <= now();

  SELECT se.* INTO chosen FROM sun_entitlements AS se
  WHERE se.user_id = p_user_id
    AND se.status = 'active'
    AND se.quantity_remaining > 0
    AND se.expires_at > now()
    AND (se.chart_id IS NULL OR se.chart_id = p_existing_chart_id)
  ORDER BY se.expires_at ASC, se.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1 FROM sun_entitlements AS se
      WHERE se.user_id = p_user_id AND se.quantity_remaining > 0
        AND (se.status = 'expired' OR se.expires_at <= now())
    ) THEN RAISE EXCEPTION 'SUN_EXPIRED'; END IF;
    RAISE EXCEPTION 'NO_ACTIVE_SUN';
  END IF;

  IF p_existing_chart_id IS NULL THEN
    IF p_first_name IS NULL OR p_birth_date IS NULL OR p_birth_place IS NULL OR p_birth_country IS NULL THEN
      RAISE EXCEPTION 'INVALID_BIRTH_DATA';
    END IF;
    IF p_birth_time_known AND p_birth_time IS NULL THEN RAISE EXCEPTION 'INVALID_BIRTH_TIME'; END IF;

    INSERT INTO charts (
      user_id, external_case_id, first_name, birth_date, birth_time, birth_time_known,
      birth_place, birth_country, timezone, chart_data_json, calculation_status
    ) VALUES (
      p_user_id, gen_random_uuid()::text, btrim(p_first_name), p_birth_date,
      CASE WHEN p_birth_time_known THEN p_birth_time ELSE NULL END, p_birth_time_known,
      btrim(p_birth_place), btrim(p_birth_country), NULL, NULL, 'pending_calculation'
    ) RETURNING id INTO target_chart_id;
  ELSE
    target_chart_id := p_existing_chart_id;
  END IF;

  UPDATE sun_entitlements AS se SET
    chart_id = COALESCE(se.chart_id, target_chart_id),
    quantity_remaining = se.quantity_remaining - 1,
    status = CASE WHEN se.quantity_remaining - 1 = 0 THEN 'consumed'::entitlement_status ELSE se.status END
  WHERE se.id = chosen.id
  RETURNING se.quantity_remaining, se.expires_at
  INTO chosen.quantity_remaining, chosen.expires_at;

  INSERT INTO questions (
    user_id, chart_id, entitlement_id, category, question_text, status,
    idempotency_key, request_fingerprint, submitted_at
  ) VALUES (
    p_user_id, target_chart_id, chosen.id, p_category, btrim(p_question_text),
    'submitted', p_idempotency_key, fingerprint, now()
  ) RETURNING id INTO new_question_id;

  UPDATE orders SET chart_id = COALESCE(chart_id, target_chart_id)
  WHERE id = chosen.order_id;

  INSERT INTO commercial_events (user_id, order_id, kind, metadata)
  VALUES (p_user_id, chosen.order_id, 'sun_consumed',
    jsonb_build_object('question_id', new_question_id, 'chart_id', target_chart_id));

  RETURN QUERY SELECT new_question_id, target_chart_id, chosen.id,
    chosen.quantity_remaining, chosen.expires_at, false;
END;
$$;

CREATE OR REPLACE FUNCTION consume_sun_for_question(
  p_user_id uuid,
  p_chart_id uuid,
  p_question_text text,
  p_idempotency_key text
) RETURNS TABLE(question_id uuid, entitlement_id uuid, quantity_remaining integer, expires_at timestamptz)
LANGUAGE sql AS $$
  SELECT result.question_id, result.entitlement_id, result.quantity_remaining, result.expires_at
  FROM submit_paid_question(
    p_user_id, p_chart_id, NULL, NULL, NULL, false, NULL, NULL,
    'autre', p_question_text, p_idempotency_key
  ) AS result;
$$;
