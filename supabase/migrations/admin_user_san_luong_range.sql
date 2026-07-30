-- ============================================================================
-- ADMIN: Lấy sản lượng thô của 1 user bất kỳ theo khoảng ngày
-- ============================================================================
-- Dùng cho UserSanLuongModal (tab Admin/User) để tính "Công tuần" (bao gồm
-- dư/thiếu) của user đó -- tái dùng NGUYÊN logic tính toán JS đã có ở
-- useGetCongTuan (gom nhóm theo tuần, tính rổ 32, v.v.) thay vì viết lại
-- bằng SQL. RPC này chỉ đóng vai trò "vượt RLS" để lấy dữ liệu thô, mọi
-- phép tính vẫn nằm ở phía client.
--
-- Theo đúng pattern SECURITY DEFINER sẵn có của admin_get_user_daily_entries
-- / admin_get_user_cong_doan (không tự kiểm tra quyền admin trong thân hàm
-- -- quyền vào trang /admin đang kiểm soát ở phía client).
-- ============================================================================

DROP FUNCTION IF EXISTS admin_get_user_san_luong(uuid, date, date);

CREATE OR REPLACE FUNCTION admin_get_user_san_luong(p_user_id uuid, p_start_date date, p_end_date date)
RETURNS SETOF san_luong
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM san_luong
  WHERE user_id = p_user_id
    AND ngay >= p_start_date
    AND ngay <= p_end_date
  ORDER BY ngay ASC;
$$;
