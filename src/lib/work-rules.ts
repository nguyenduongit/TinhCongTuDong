/**
 * =============================================================================
 * BỘ QUY TẮC LÀM VIỆC (Work Rules Engine)
 * =============================================================================
 * Đây là nguồn sự thật duy nhất (Single Source of Truth) cho tất cả các quy
 * tắc nghiệp vụ về chấm công. Mọi tính toán trong ứng dụng đều PHẢI lấy giá
 * trị từ đây, không được tự định nghĩa lại.
 *
 * Khi có thay đổi quy định (ví dụ: thứ 7 đổi từ 240 → 300 phút), chỉ cần
 * sửa duy nhất ở file này — toàn bộ ứng dụng sẽ cập nhật tự động.
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// QUY TẮC CHU KỲ KÝ CÔNG
// ---------------------------------------------------------------------------

/**
 * Ngày bắt đầu chu kỳ ký công (ngày 21 tháng trước).
 * VD: Tháng công tháng 7 bắt đầu từ ngày 21/06.
 */
export const CYCLE_START_DAY = 21;

/**
 * Ngày kết thúc chu kỳ ký công (ngày 20 tháng hiện tại).
 * VD: Tháng công tháng 7 kết thúc vào ngày 20/07.
 */
export const CYCLE_END_DAY = 20;

// ---------------------------------------------------------------------------
// QUY TẮC THỜI GIAN HÀNH CHÍNH THEO NGÀY TRONG TUẦN
// ---------------------------------------------------------------------------

/**
 * Số phút hành chính quy định cho từng ngày trong tuần.
 * Key: 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7 (theo chuẩn JS Date.getDay())
 */
export const WORK_MINUTES_BY_DAY: Readonly<Record<number, number>> = {
  0: 0,   // Chủ Nhật  — không tính công
  1: 480, // Thứ Hai   — 8 tiếng hành chính
  2: 480, // Thứ Ba    — 8 tiếng hành chính
  3: 480, // Thứ Tư    — 8 tiếng hành chính
  4: 480, // Thứ Năm   — 8 tiếng hành chính
  5: 480, // Thứ Sáu   — 8 tiếng hành chính
  6: 240, // Thứ Bảy   — 4 tiếng hành chính
} as const;

/**
 * Số phút của một ngày làm việc đầy đủ (Thứ 2 – Thứ 6).
 * Dùng làm mẫu số khi quy đổi: phút → công.
 */
export const FULL_WORKDAY_MINUTES = WORK_MINUTES_BY_DAY[1]; // = 480

// ---------------------------------------------------------------------------
// HÀM TIỆN ÍCH
// ---------------------------------------------------------------------------

/**
 * Lấy số phút hành chính quy định cho một ngày cụ thể trong tuần.
 * @param dayOfWeek Số từ 0–6 theo chuẩn JS (Date.getDay())
 * @returns Số phút hành chính (0 nếu là Chủ Nhật)
 */
export function getWorkMinutesForDay(dayOfWeek: number): number {
  return WORK_MINUTES_BY_DAY[dayOfWeek] ?? 0;
}

/**
 * Quy đổi số phút thực hiện thành công (đơn vị công ngày).
 * Luôn dùng hàm này thay vì tự chia cho 480.
 * @param minutes Số phút cần quy đổi
 * @returns Số công (công ngày)
 */
export function minutesToCong(minutes: number): number {
  if (FULL_WORKDAY_MINUTES === 0) return 0;
  return minutes / FULL_WORKDAY_MINUTES;
}

/**
 * Kiểm tra một ngày có phải ngày làm việc không (có phút hành chính > 0).
 * @param dayOfWeek Số từ 0–6 theo chuẩn JS (Date.getDay())
 */
export function isWorkday(dayOfWeek: number): boolean {
  return getWorkMinutesForDay(dayOfWeek) > 0;
}
