-- ============================================================================
-- REFERRAL SYSTEM - Đổi quy tắc tracking sang "Tháng Công" (chu kỳ 21 -> 20)
-- ============================================================================
-- Quy tắc cũ: tracking bắt đầu từ ngày đăng ký, kết thúc sau 7 ngày, yêu cầu
--             nhập đủ TẤT CẢ ngày làm việc (T2-T7) trong khoảng đó.
--
-- Quy tắc mới:
--   - Lấy THÁNG khi đăng ký tài khoản làm tham chiếu (Tháng Công, giống quy
--     tắc chấm công: bắt đầu ngày 21 tháng trước, kết thúc ngày 20 tháng đó
--     -- xem src/lib/work-rules.ts CYCLE_START_DAY/CYCLE_END_DAY).
--   - Trong cả Tháng Công đó, chỉ cần referee nhập sản lượng đủ 7 NGÀY BẤT KỲ
--     (không cần liên tiếp, không cần là ngày làm việc, và tính cả những ngày
--     đã nhập TRƯỚC KHI referral được tạo) là đủ điều kiện nhận thưởng.
-- ============================================================================

-- 0. Hàm dùng chung: tính khoảng Tháng Công (21 -> 20) chứa 1 ngày bất kỳ
-- ============================================================================
DROP FUNCTION IF EXISTS get_cycle_period(date);

CREATE OR REPLACE FUNCTION get_cycle_period(p_date date)
RETURNS TABLE(start_date date, end_date date)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_cycle_year int;
  v_cycle_month int;
  v_start_year int;
  v_start_month int;
BEGIN
  -- Tháng Công N: 21/(N-1) -> 20/N. Nếu ngày > 20 thì thuộc tháng công kế tiếp.
  IF EXTRACT(day FROM p_date)::int > 20 THEN
    v_cycle_year := EXTRACT(year FROM (p_date + INTERVAL '1 month'))::int;
    v_cycle_month := EXTRACT(month FROM (p_date + INTERVAL '1 month'))::int;
  ELSE
    v_cycle_year := EXTRACT(year FROM p_date)::int;
    v_cycle_month := EXTRACT(month FROM p_date)::int;
  END IF;

  IF v_cycle_month = 1 THEN
    v_start_year := v_cycle_year - 1;
    v_start_month := 12;
  ELSE
    v_start_year := v_cycle_year;
    v_start_month := v_cycle_month - 1;
  END IF;

  RETURN QUERY SELECT make_date(v_start_year, v_start_month, 21),
                      make_date(v_cycle_year, v_cycle_month, 20);
END;
$$;


-- 1. apply_referral: tracking_start/end lấy theo Tháng Công của ngày đăng ký
-- ============================================================================
DROP FUNCTION IF EXISTS apply_referral(uuid, text);

CREATE OR REPLACE FUNCTION apply_referral(p_referee_id uuid, p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_existing_ref uuid;
  v_period record;
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

  -- Tháng Công (21 -> 20) chứa ngày đăng ký hiện tại
  SELECT * INTO v_period FROM get_cycle_period(CURRENT_DATE);

  INSERT INTO referrals (referrer_id, referee_id, referral_code, status, tracking_start_date, tracking_end_date)
  VALUES (v_referrer_id, p_referee_id, p_referral_code, 'tracking', v_period.start_date, v_period.end_date);

  RETURN jsonb_build_object('success', true);
END;
$$;


-- 2. claim_referral_reward: đủ điều kiện khi có >= 7 ngày bất kỳ nhập sản lượng
-- ============================================================================
DROP FUNCTION IF EXISTS claim_referral_reward(uuid);

CREATE OR REPLACE FUNCTION claim_referral_reward(p_referral_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
  v_days_with_entry int;
  v_current_expires timestamptz;
  v_new_expires timestamptz;
  c_required_days CONSTANT int := 7;
BEGIN
  SELECT r.id, r.referrer_id, r.referee_id, r.tracking_start_date, r.tracking_end_date, r.status
  INTO v_ref
  FROM referrals r
  WHERE r.id = p_referral_id AND r.referrer_id = auth.uid()
  LIMIT 1;

  IF v_ref.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'referral_not_found_or_unauthorized');
  END IF;

  IF v_ref.status != 'tracking' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_tracking_status');
  END IF;

  -- Đếm số NGÀY BẤT KỲ (không phân biệt ngày làm việc hay không, kể cả ngày
  -- đã nhập trước khi tạo referral) có sản lượng trong cả Tháng Công
  SELECT COUNT(DISTINCT sl.ngay)::int INTO v_days_with_entry
  FROM san_luong sl
  WHERE sl.user_id = v_ref.referee_id
    AND sl.ngay >= v_ref.tracking_start_date
    AND sl.ngay <= v_ref.tracking_end_date;

  IF v_days_with_entry >= c_required_days THEN
    SELECT COALESCE((raw_user_meta_data->'subscription'->>'expires_at')::timestamptz, (raw_user_meta_data->>'pro_expires_at')::timestamptz, now())
    INTO v_current_expires FROM auth.users WHERE id = v_ref.referrer_id;

    IF v_current_expires < now() THEN v_current_expires := now(); END IF;
    v_new_expires := v_current_expires + INTERVAL '3 months';

    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('plan', 'pro', 'subscription', jsonb_build_object('plan', 'pro', 'expires_at', v_new_expires))
    WHERE id = v_ref.referrer_id;

    UPDATE referrals SET status = 'completed', reward_granted = true, completed_at = now() WHERE id = v_ref.id;

    RETURN jsonb_build_object('success', true);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'conditions_not_met');
  END IF;
END;
$$;


-- 3. process_referral_rewards (cron): cùng điều kiện >= 7 ngày bất kỳ
-- ============================================================================
DROP FUNCTION IF EXISTS process_referral_rewards();

CREATE OR REPLACE FUNCTION process_referral_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
  v_days_with_entry int;
  v_current_expires timestamptz;
  v_new_expires timestamptz;
  c_required_days CONSTANT int := 7;
BEGIN
  -- Chỉ xử lý các referral đang tracking mà Tháng Công đã kết thúc (qua ngày 20)
  FOR v_ref IN
    SELECT r.id, r.referrer_id, r.referee_id, r.tracking_start_date, r.tracking_end_date
    FROM referrals r
    WHERE r.status = 'tracking' AND r.tracking_end_date <= CURRENT_DATE
  LOOP
    SELECT COUNT(DISTINCT sl.ngay)::int INTO v_days_with_entry
    FROM san_luong sl
    WHERE sl.user_id = v_ref.referee_id
      AND sl.ngay >= v_ref.tracking_start_date
      AND sl.ngay <= v_ref.tracking_end_date;

    IF v_days_with_entry >= c_required_days THEN
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


-- 4. get_my_referrals: total_workdays giờ là hằng số 7 (số ngày yêu cầu),
--    days_with_entry giới hạn hiển thị tối đa 7 để thanh tiến độ không vượt 100%
-- ============================================================================
DROP FUNCTION IF EXISTS get_my_referrals();

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
    LEAST(
      (SELECT COUNT(DISTINCT sl.ngay)::int FROM san_luong sl WHERE sl.user_id = r.referee_id AND sl.ngay >= r.tracking_start_date AND sl.ngay <= r.tracking_end_date),
      7
    ) AS days_with_entry,
    7 AS total_workdays
  FROM referrals r
  JOIN auth.users u2 ON u2.id = r.referee_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC;
END;
$$;


-- 5. admin_get_referrals: cùng thay đổi total_workdays = 7, cap days_with_entry
-- ============================================================================
DROP FUNCTION IF EXISTS admin_get_referrals();

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
    LEAST(
      (SELECT COUNT(DISTINCT sl.ngay)::int FROM san_luong sl WHERE sl.user_id = r.referee_id AND sl.ngay >= r.tracking_start_date AND sl.ngay <= r.tracking_end_date),
      7
    ) AS days_with_entry,
    7 AS total_workdays
  FROM referrals r
  JOIN auth.users u1 ON u1.id = r.referrer_id
  JOIN auth.users u2 ON u2.id = r.referee_id
  ORDER BY r.created_at DESC;
END;
$$;
