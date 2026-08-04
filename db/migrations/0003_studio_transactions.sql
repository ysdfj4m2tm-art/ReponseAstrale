CREATE OR REPLACE FUNCTION publish_question_answer(
  p_question_id uuid,
  p_answer_text text,
  p_pdf_url text,
  p_prompt_version text,
  p_model text,
  p_generation_cost_cents integer
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE answer_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM questions WHERE id=p_question_id AND status='processing' FOR UPDATE) THEN
    RAISE EXCEPTION 'QUESTION_NOT_PROCESSING';
  END IF;
  INSERT INTO answers (question_id, answer_text, pdf_url, prompt_version, model, generation_cost_cents)
  VALUES (p_question_id, p_answer_text, p_pdf_url, p_prompt_version, p_model, p_generation_cost_cents)
  ON CONFLICT (question_id) DO UPDATE SET
    answer_text=EXCLUDED.answer_text, pdf_url=EXCLUDED.pdf_url,
    prompt_version=EXCLUDED.prompt_version, model=EXCLUDED.model,
    generation_cost_cents=EXCLUDED.generation_cost_cents
  RETURNING id INTO answer_id;
  UPDATE questions SET status='answered', answered_at=now() WHERE id=p_question_id;
  RETURN answer_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_question_failed(p_question_id uuid, p_reason text) RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE questions SET status='failed', failure_reason=left(p_reason, 500)
  WHERE id=p_question_id AND status IN ('submitted','processing');
  RETURN FOUND;
END;
$$;
