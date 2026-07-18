-- ============================================================================
-- REFERRAL SYSTEM - Database Migration
-- ============================================================================
-- Hệ thống mời bạn bè: bảng, RLS, RPC functions, cron job
-- ============================================================================

-- 1. TABLES
-- ============================================================================

-- Bảng lưu mã referral code cố định cho mỗi user (6 ký tự)
CREATE TABLE IF NOT EXISTS user_referral_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Bảng lưu quan hệ referral (người mời → người được mời)
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

-- Index để tìm nhanh referral theo referrer
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON user_referral_codes(code);


-- 2. RLS POLICIES
-- ============================================================================

ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- User chỉ đọc code của chính mình
CREATE POLICY "Users can read own referral code"
  ON user_referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- User chỉ đọc referral mà mình là referrer hoặc referee
CREATE POLICY "Users can read own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);


-- 3. RPC FUNCTIONS
-- ============================================================================

-- 3a. Tự tạo hoặc lấy referral code của user
-- Sinh mã 6 ký tự ngẫu nhiên (chữ + số), đảm bảo unique
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
  -- Kiểm tra đã có code chưa
  SELECT code INTO v_code
  FROM user_referral_codes
  WHERE user_id = p_user_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Sinh code mới, retry nếu trùng
  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      RAISE EXCEPTION 'Không thể tạo mã referral duy nhất sau 20 lần thử';
    END IF;

    -- Sinh 6 ký tự: chữ hoa + số
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    -- Đảm bảo chỉ chứa chữ + số (loại bỏ ký tự đặc biệt từ md5)
    -- md5 chỉ trả hex (0-9, a-f) nên ta thay thế một số ký tự
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
-- Kiểm tra: code hợp lệ, không tự mời chính mình, chưa có referrer
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
  -- Normalize code
  p_referral_code := upper(trim(p_referral_code));

  -- Tìm referrer từ code
  SELECT user_id INTO v_referrer_id
  FROM user_referral_codes
  WHERE code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- Không tự mời chính mình
  IF v_referrer_id = p_referee_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;

  -- Kiểm tra user đã có referrer chưa
  SELECT referee_id INTO v_existing_ref
  FROM referrals
  WHERE referee_id = p_referee_id;

  IF v_existing_ref IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;

  -- Tạo quan hệ referral
  INSERT INTO referrals (referrer_id, referee_id, referral_code, status, tracking_start_date, tracking_end_date)
  VALUES (
    v_referrer_id,
    p_referee_id,
    p_referral_code,
    'tracking',
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '30 days')::date
  );

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
    -- Đếm số ngày referee có nhập sản lượng trong khoảng tracking
    (SELECT COUNT(DISTINCT sl.ngay)::int
     FROM san_luong sl
     WHERE sl.user_id = r.referee_id
       AND sl.ngay >= r.tracking_start_date::text
       AND sl.ngay <= r.tracking_end_date::text
    ) AS days_with_entry,
    -- Đếm tổng ngày làm việc (T2-T7) trong khoảng tracking
    (SELECT COUNT(*)::int
     FROM generate_series(r.tracking_start_date, LEAST(r.tracking_end_date, CURRENT_DATE), '1 day'::interval) d
     WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 6
    ) AS total_workdays
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
    EXISTS(
      SELECT 1 FROM san_luong sl
      WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date::text
    ) AS has_entry,
    COALESCE(
      (SELECT SUM(
        COALESCE((sl.thong_ke_ngay->>'tong_cong_sp')::numeric, 0) +
        COALESCE((sl.thong_ke_ngay->>'tong_cong_ho_tro')::numeric, 0)
      )
       FROM san_luong sl
       WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date::text
      ), 0
    ) AS total_cong_sp,
    COALESCE(
      (SELECT SUM(sl.thoi_gian_thuc_hien + COALESCE(sl.thoi_gian_ho_tro, 0))::int
       FROM san_luong sl
       WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date::text
      ), 0
    ) AS total_time,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', sl.id,
        'chi_tiet', sl.chi_tiet,
        'thong_ke_ngay', sl.thong_ke_ngay,
        'thoi_gian_thuc_hien', sl.thoi_gian_thuc_hien,
        'thoi_gian_ho_tro', sl.thoi_gian_ho_tro
      ))
       FROM san_luong sl
       WHERE sl.user_id = p_user_id AND sl.ngay = d.d::date::text
      ), '[]'::jsonb
    ) AS entries
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d(d)
  ORDER BY d.d;
END;
$$;


-- 3e. Cron function: Kiểm tra và tặng reward
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
  -- Lấy tất cả referral đang tracking và đã qua ngày kết thúc
  FOR v_ref IN
    SELECT r.id, r.referrer_id, r.referee_id, r.tracking_start_date, r.tracking_end_date
    FROM referrals r
    WHERE r.status = 'tracking'
      AND r.tracking_end_date <= CURRENT_DATE
  LOOP
    -- Đếm số ngày làm việc (T2-T7) mà referee KHÔNG nhập sản lượng
    SELECT COUNT(*)::int INTO v_missed_days
    FROM generate_series(v_ref.tracking_start_date, v_ref.tracking_end_date, '1 day'::interval) d
    WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 6  -- Chỉ ngày làm việc
      AND NOT EXISTS (
        SELECT 1 FROM san_luong sl
        WHERE sl.user_id = v_ref.referee_id
          AND sl.ngay = d::date::text
      );

    IF v_missed_days = 0 THEN
      -- THÀNH CÔNG: Referee nhập đủ → tặng 3 tháng Pro cho referrer

      -- Lấy ngày hết hạn Pro hiện tại của referrer
      SELECT
        COALESCE(
          (raw_user_meta_data->'subscription'->>'expires_at')::timestamptz,
          (raw_user_meta_data->>'pro_expires_at')::timestamptz,
          now()
        )
      INTO v_current_expires
      FROM auth.users
      WHERE id = v_ref.referrer_id;

      -- Nếu đã hết hạn, tính từ hiện tại
      IF v_current_expires < now() THEN
        v_current_expires := now();
      END IF;

      -- Cộng 3 tháng
      v_new_expires := v_current_expires + INTERVAL '3 months';

      -- Update user_metadata
      UPDATE auth.users
      SET raw_user_meta_data = raw_user_meta_data
        || jsonb_build_object(
          'plan', 'pro',
          'subscription', jsonb_build_object(
            'plan', 'pro',
            'expires_at', v_new_expires
          )
        )
      WHERE id = v_ref.referrer_id;

      -- Cập nhật trạng thái referral
      UPDATE referrals
      SET status = 'completed',
          reward_granted = true,
          completed_at = now()
      WHERE id = v_ref.id;

    ELSE
      -- THẤT BẠI: Referee không nhập đủ
      UPDATE referrals
      SET status = 'failed',
          completed_at = now()
      WHERE id = v_ref.id;
    END IF;
  END LOOP;
END;
$$;


-- 4. CRON JOB
-- ============================================================================

-- Chạy mỗi ngày lúc 23:30 VN (16:30 UTC)
SELECT cron.schedule(
  'process_referral_rewards_job',
  '30 16 * * *',
  $$ SELECT process_referral_rewards() $$
);
