CREATE OR REPLACE FUNCTION get_random_sentences(
  p_user_id uuid,
  p_categories text[],
  p_limit int
)
RETURNS SETOF sentences
LANGUAGE sql
STABLE
AS $$
  SELECT s.*
  FROM sentences s
  WHERE
    (array_length(p_categories, 1) = 0 OR p_categories IS NULL OR s.category = ANY(p_categories))
    AND s.id NOT IN (
      SELECT sentence_id FROM user_progress WHERE user_id = p_user_id
    )
  ORDER BY RANDOM()
  LIMIT p_limit;
$$;
