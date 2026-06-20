-- Enable RLS on all tables
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "sentences_select_authenticated" ON sentences;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "user_progress_select_own" ON user_progress;
DROP POLICY IF EXISTS "user_progress_insert_own" ON user_progress;
DROP POLICY IF EXISTS "user_progress_update_own" ON user_progress;

-- sentences: 로그인한 유저만 읽기 가능
CREATE POLICY "sentences_select_authenticated"
  ON sentences FOR SELECT
  TO authenticated
  USING (true);

-- users: 본인 행만 읽기/쓰기
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- user_progress: 본인 행만 읽기/쓰기
CREATE POLICY "user_progress_select_own"
  ON user_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_progress_insert_own"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_progress_update_own"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
