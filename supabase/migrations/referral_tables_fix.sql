-- 1. TẠO BẢNG user_referral_codes
CREATE TABLE IF NOT EXISTS user_referral_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. TẠO BẢNG referrals
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'tracking'
    CHECK (status IN ('tracking', 'completed', 'failed')),
  reward_granted boolean DEFAULT false,
  tracking_start_date date NOT NULL DEFAULT CURRENT_DATE,
  tracking_end_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days')::date,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referee_id)  -- Mỗi người chỉ được mời bởi 1 người duy nhất
);

-- 2b. Enable RLS
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Bỏ qua lỗi policy đã tồn tại (nếu chạy lại nhiều lần)
DO $$ BEGIN
  CREATE POLICY "Users can read own referral code"
    ON user_referral_codes FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- 3. RPC FUNCTIONS
-- ============================================================================

-- Xoá các hàm cũ do AI tạo ra (vì AI đã làm sai khác kiểu trả về)
DROP FUNCTION IF EXISTS get_or_create_referral_code(uuid);
DROP FUNCTION IF EXISTS apply_referral(uuid, text);
DROP FUNCTION IF EXISTS admin_get_referrals();
DROP FUNCTION IF EXISTS admin_get_user_daily_entries(uuid, date, date);
DROP FUNCTION IF EXISTS process_referral_rewards();

-- 3a. Tự tạo hoặc lấy referral code của user
CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_exists boolean;
  v_attempts int := 0;
BEGIN
  SELECT code INTO v_code FROM user_referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      RAISE EXCEPTION 'Không thể tạo mã referral duy nhất sau 20 lần thử';
    END IF;
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    v_code := translate(v_code, 'ABCDEF', 'KLMNPQ');
    SELECT EXISTS(SELECT 1 FROM user_referral_codes WHERE code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      INSERT INTO user_referral_codes(user_id, code) VALUES (p_user_id, v_code);
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;


-- 3b. Áp dụng referral khi user mới đăng ký
CREATE OR REPLACE FUNCTION apply_referral(p_referee_id uuid, p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_existing_ref uuid;
BEGIN
  p_referral_code := upper(trim(p_referral_code));
  SELECT user_id INTO v_referrer_id FROM user_referral_codes WHERE code = p_referral_code;
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;
  IF v_referrer_id = p_referee_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;
  SELECT referee_id INTO v_existing_ref FROM referrals WHERE referee_id = p_referee_id;
  IF v_existing_ref IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;
  INSERT INTO referrals (referrer_id, referee_id, referral_code, status, tracking_start_date, tracking_end_date)
  VALUES (v_referrer_id, p_referee_id, p_referral_code, 'tracking', CURRENT_DATE, (CURRENT_DATE + INTERVAL '7 days')::date);
  RETURN jsonb_build_object('success', true);
END;
$$;


-- 3c. Admin: Lấy danh sách referral kèm thông tin user
CREATE OR REPLACE FUNCTION admin_get_referrals()
RETURNS TABLE(
  referral_id uuid,
  referrer_id uuid,
  referrer_email text,
  referrer_name text,
  referrer_avatar text,
  referee_id uuid,
  referee_email text,
  referee_name text,
  referee_avatar text,
  referral_code text,
  status text,
  reward_granted boolean,
  tracking_start_date date,
  tracking_end_date date,
  created_at timestamptz,
  completed_at timestamptz,
  days_with_entry int,
  total_workdays int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS referral_id,
    r.referrer_id,
    u1.email::text AS referrer_email,
    COALESCE(u1.raw_user_meta_data->>'full_name', split_part(u1.email, '@', 1))::text AS referrer_name,
    COALESCE(u1.raw_user_meta_data->>'avatar_url', u1.raw_user_meta_data->>'picture')::text AS referrer_avatar,
    r.referee_id,
    u2.email::text AS referee_email,
    COALESCE(u2.raw_user_meta_data->>'full_name', split_part(u2.email, '@', 1))::text AS referee_name,
    COALESCE(u2.raw_user_meta_data->>'avatar_url', u2.raw_user_meta_data->>'picture')::text AS referee_avatar,
    r.referral_code,
    r.status,
    r.reward_granted,
    r.tracking_start_date,
    r.tracking_end_date,
    r.created_at,
    r.completed_at,
    (SELECT COUNT(DISTINCT sl.ngay)::int FROM san_luong sl WHERE sl.user_id = r.referee_id AND sl.ngay >= r.tracking_start_date AND sl.ngay <= r.tracking_end_date) AS days_with_entry,
    (SELECT COUNT(*)::int FROM generate_series(r.tracking_start_date, LEAST(r.tracking_end_date, CURRENT_DATE), '1 day'::interval) d WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 6) AS total_workdays
  FROM referrals r
  JOIN auth.users u1 ON u1.id = r.referrer_id
  JOIN auth.users u2 ON u2.id = r.referee_id
  ORDER BY r.created_at DESC;
END;
$$;


-- 3d. Admin: Lấy chi tiết sản lượng hàng ngày của user trong khoảng thời gian
CREATE OR REPLACE FUNCTION admin_get_user_daily_entries(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  ngay date,
  day_of_week int,
  is_workday boolean,
  has_entry boolean,
  total_cong_sp numeric,
  total_time int,
  entries jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.d::date AS ngay,
    EXTRACT(dow FROM d.d)::int AS day_of_week,
    (EXTRACT(dow FROM d.d) BETWEEN 1 AND 6) AS is_workday,
    EXISTS(SELECT 1 FROM san_luong sl WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date) AS has_entry,
    COALESCE((SELECT SUM(COALESCE((sl.thong_ke_ngay->>'tong_cong_sp')::numeric, 0) + COALESCE((sl.thong_ke_ngay->>'tong_cong_ho_tro')::numeric, 0)) FROM san_luong sl WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date), 0) AS total_cong_sp,
    COALESCE((SELECT SUM(sl.thoi_gian_thuc_hien + COALESCE(sl.thoi_gian_ho_tro, 0))::int FROM san_luong sl WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date), 0) AS total_time,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id', sl.id, 'chi_tiet', sl.chi_tiet, 'thong_ke_ngay', sl.thong_ke_ngay, 'thoi_gian_thuc_hien', sl.thoi_gian_thuc_hien, 'thoi_gian_ho_tro', sl.thoi_gian_ho_tro)) FROM san_luong sl WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date), '[]'::jsonb) AS entries
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d(d)
  ORDER BY d.d;
END;
$$;


-- 3e. function: Kiểm tra và tặng reward
CREATE OR REPLACE FUNCTION process_referral_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
  v_missed_days int;
  v_current_expires timestamptz;
  v_new_expires timestamptz;
BEGIN
  FOR v_ref IN
    SELECT r.id, r.referrer_id, r.referee_id, r.tracking_start_date, r.tracking_end_date
    FROM referrals r
    WHERE r.status = 'tracking' AND r.tracking_end_date <= CURRENT_DATE
  LOOP
    SELECT COUNT(*)::int INTO v_missed_days
    FROM generate_series(v_ref.tracking_start_date, v_ref.tracking_end_date, '1 day'::interval) d
    WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 6
      AND NOT EXISTS (SELECT 1 FROM san_luong sl WHERE sl.user_id = v_ref.referee_id AND sl.ngay = d::date);

    IF v_missed_days = 0 THEN
      SELECT COALESCE((raw_user_meta_data->'subscription'->>'expires_at')::timestamptz, (raw_user_meta_data->>'pro_expires_at')::timestamptz, now())
      INTO v_current_expires FROM auth.users WHERE id = v_ref.referrer_id;

      IF v_current_expires < now() THEN v_current_expires := now(); END IF;
      v_new_expires := v_current_expires + INTERVAL '3 months';

      UPDATE auth.users
      SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('plan', 'pro', 'subscription', jsonb_build_object('plan', 'pro', 'expires_at', v_new_expires))
      WHERE id = v_ref.referrer_id;

      UPDATE referrals SET status = 'completed', reward_granted = true, completed_at = now() WHERE id = v_ref.id;
    ELSE
      UPDATE referrals SET status = 'failed', completed_at = now() WHERE id = v_ref.id;
    END IF;
  END LOOP;
END;
$$;

-- 3f. Lấy danh sách referral của user hiện tại
CREATE OR REPLACE FUNCTION get_my_referrals()
RETURNS TABLE(
  referral_id uuid,
  referee_email text,
  referee_name text,
  referee_avatar text,
  status text,
  reward_granted boolean,
  tracking_start_date date,
  tracking_end_date date,
  days_with_entry int,
  total_workdays int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS referral_id,
    -- Ẩn 1 phần email
    CASE
      WHEN strpos(u2.email, '@') > 3 THEN
        substr(u2.email, 1, 3) || '***' || substr(u2.email, strpos(u2.email, '@'))
      ELSE
        substr(u2.email, 1, 1) || '***' || substr(u2.email, strpos(u2.email, '@'))
    END AS referee_email,
    COALESCE(u2.raw_user_meta_data->>'full_name', split_part(u2.email, '@', 1))::text AS referee_name,
    COALESCE(u2.raw_user_meta_data->>'avatar_url', u2.raw_user_meta_data->>'picture')::text AS referee_avatar,
    r.status,
    r.reward_granted,
    r.tracking_start_date,
    r.tracking_end_date,
    (SELECT COUNT(DISTINCT sl.ngay)::int FROM san_luong sl WHERE sl.user_id = r.referee_id AND sl.ngay >= r.tracking_start_date AND sl.ngay <= r.tracking_end_date) AS days_with_entry,
    (SELECT COUNT(*)::int FROM generate_series(r.tracking_start_date, LEAST(r.tracking_end_date, CURRENT_DATE), '1 day'::interval) d WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 6) AS total_workdays
  FROM referrals r
  JOIN auth.users u2 ON u2.id = r.referee_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC;
END;
$$;
