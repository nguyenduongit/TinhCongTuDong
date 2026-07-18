/**
 * =============================================================================
 * CẤU HÌNH CÔNG TY (Company Config)
 * =============================================================================
 * Định nghĩa kiểu dữ liệu và giá trị mặc định cho tất cả các quy tắc nghiệp
 * vụ có thể thay đổi theo quyết định của công ty.
 *
 * Nguồn dữ liệu thực tế: Supabase DB (bảng `company_config`).
 * Fallback khi DB chưa sẵn sàng: DEFAULT_COMPANY_CONFIG bên dưới.
 *
 * Nguyên tắc: Các hàm tính toán KHÔNG tự đọc config — chúng NHẬN config
 * như một tham số. Điều này cho phép:
 *   1. Test dễ dàng (truyền config giả vào hàm)
 *   2. Nâng cấp nguồn config không cần sửa logic
 *   3. Admin panel có thể thay đổi không cần deploy lại
 * =============================================================================
 */

/**
 * Toàn bộ cấu hình nghiệp vụ của công ty.
 * Các key phải khớp với cột `key` trong bảng `company_config` trên Supabase.
 */
export interface CompanyConfig {
  // --- PHỤ CẤP ---
  /** Tiền cơm mỗi ngày làm việc (đồng) */
  meal_allowance_per_day: number;
  /** Phụ cấp tuân thủ cố định mỗi tháng (đồng) */
  compliance_allowance: number;

  // --- THƯỞNG THÂM NIÊN & TAY NGHỀ ---
  /** Thưởng thâm niên mỗi năm làm việc (đồng/năm) */
  loyalty_bonus_per_year: number;
  /** Số tháng ký HĐ tối thiểu để nhận thưởng tay nghề */
  skill_bonus_threshold_months: number;
  /** Mức thưởng tay nghề cố định khi đủ điều kiện (đồng) */
  skill_bonus_amount: number;

  // --- HỆ SỐ TĂNG CA ---
  /** Hệ số lương tăng ca ngày thường (VD: 1.5 = 150%) */
  ot_normal_multiplier: number;
  /** Hệ số lương tăng ca ngày nghỉ / cuối tuần (VD: 2.0 = 200%) */
  ot_rest_multiplier: number;

  // --- TỶ LỆ BẢO HIỂM (phần người lao động đóng) ---
  /** Tỷ lệ BHXH người lao động đóng (VD: 0.08 = 8%) */
  insurance_bhxh_rate: number;
  /** Tỷ lệ BHYT người lao động đóng (VD: 0.015 = 1.5%) */
  insurance_bhyt_rate: number;
  /** Tỷ lệ BHTN người lao động đóng (VD: 0.01 = 1%) */
  insurance_bhtn_rate: number;
}

/**
 * Giá trị mặc định — phản ánh quy định hiện tại của công ty.
 * Được dùng làm fallback khi DB chưa load xong hoặc chưa có bảng config.
 *
 * QUAN TRỌNG: Không hardcode các số này ở bất kỳ đâu khác trong codebase.
 * Nếu muốn thay đổi tạm thời mà chưa có admin panel → sửa tại đây.
 */
export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  // Phụ cấp
  meal_allowance_per_day: 35_000,
  compliance_allowance: 400_000,

  // Thưởng thâm niên & tay nghề
  loyalty_bonus_per_year: 100_000,
  skill_bonus_threshold_months: 36,
  skill_bonus_amount: 200_000,

  // Hệ số tăng ca
  ot_normal_multiplier: 1.5,
  ot_rest_multiplier: 2.0,

  // Tỷ lệ bảo hiểm
  insurance_bhxh_rate: 0.08,
  insurance_bhyt_rate: 0.015,
  insurance_bhtn_rate: 0.01,
};

/**
 * Danh sách tất cả keys có trong DB, kèm label tiếng Việt và đơn vị.
 * Dùng để render trang admin quản lý config sau này.
 */
export const COMPANY_CONFIG_META: Record<
  keyof CompanyConfig,
  { label: string; unit: string; description?: string }
> = {
  meal_allowance_per_day:        { label: 'Tiền cơm mỗi ngày',                 unit: 'đ/ngày' },
  compliance_allowance:          { label: 'Phụ cấp tuân thủ',                  unit: 'đ/tháng' },
  loyalty_bonus_per_year:        { label: 'Thưởng thâm niên',                  unit: 'đ/năm' },
  skill_bonus_threshold_months:  { label: 'Số tháng tối thiểu nhận thưởng tay nghề', unit: 'tháng' },
  skill_bonus_amount:            { label: 'Mức thưởng tay nghề',               unit: 'đ' },
  ot_normal_multiplier:          { label: 'Hệ số tăng ca ngày thường',         unit: 'x lương giờ' },
  ot_rest_multiplier:            { label: 'Hệ số tăng ca ngày nghỉ/CN',        unit: 'x lương giờ' },
  insurance_bhxh_rate:           { label: 'Tỷ lệ BHXH (NLĐ)',                  unit: '%', description: 'Phần người lao động đóng' },
  insurance_bhyt_rate:           { label: 'Tỷ lệ BHYT (NLĐ)',                  unit: '%', description: 'Phần người lao động đóng' },
  insurance_bhtn_rate:           { label: 'Tỷ lệ BHTN (NLĐ)',                  unit: '%', description: 'Phần người lao động đóng' },
};

/**
 * Merge config từ DB (có thể thiếu một số key) với defaults.
 * Giúp đảm bảo không bao giờ bị undefined kể cả khi DB thiếu row.
 */
export function mergeWithDefaults(partial: Partial<CompanyConfig>): CompanyConfig {
  return { ...DEFAULT_COMPANY_CONFIG, ...partial };
}
