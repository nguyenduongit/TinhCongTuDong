-- ============================================================================
-- ADMIN: Lấy danh sách công đoạn của 1 user bất kỳ
-- ============================================================================
-- Dùng cho modal "Sản lượng" trong tab Admin/User (UserSanLuongModal) khi
-- hiển thị lại từng ngày bằng component SanLuongDayCard (giống trang sản
-- lượng của chính user) -- cần tra tên công đoạn theo mã, vốn chỉ có trong
-- bảng cong_doan của TỪNG user, không nằm trong dữ liệu sản lượng đã lưu.
--
-- Theo đúng pattern đã có sẵn của admin_get_user_daily_entries (cũng
-- SECURITY DEFINER, không tự kiểm tra quyền admin trong thân hàm -- quyền
-- truy cập trang /admin đang được kiểm soát ở phía client).
-- ============================================================================

DROP FUNCTION IF EXISTS admin_get_user_cong_doan(uuid);

CREATE OR REPLACE FUNCTION admin_get_user_cong_doan(p_user_id uuid)
RETURNS TABLE(
  id int,
  ma_cong_doan text,
  ten_cong_doan text,
  dinh_muc numeric,
  quy_cach text,
  "order" bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cd.id, cd.ma_cong_doan, cd.ten_cong_doan, cd.dinh_muc, cd.quy_cach, cd."order"
  FROM cong_doan cd
  WHERE cd.user_id = p_user_id
  ORDER BY cd."order" NULLS LAST, cd.ma_cong_doan;
END;
$$;
