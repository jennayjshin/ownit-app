-- Fix: array_length on empty array returns NULL (not 0) in PostgreSQL
-- Previous condition `array_length(p_categories, 1) = 0` never matched empty arrays,
-- causing new users with no preferred categories to get 0 sentences returned.
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
    (array_length(p_categories, 1) IS NULL OR s.category = ANY(p_categories))
    AND s.id NOT IN (
      SELECT sentence_id FROM user_progress WHERE user_id = p_user_id
    )
  ORDER BY RANDOM()
  LIMIT p_limit;
$$;
