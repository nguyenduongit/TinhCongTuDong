import { format, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { CYCLE_START_DAY, CYCLE_END_DAY, getWorkMinutesForDay, FULL_WORKDAY_MINUTES } from './work-rules.js';

/**
 * Các hàm hỗ trợ lấy thời gian theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 * Giúp đảm bảo ứng dụng luôn chạy nhất quán múi giờ VN, bất kể thiết bị cài PWA đang ở múi giờ nào.
 */
export function getTodayVNParts(): { year: number, month: number, day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date()).split('/');
  // locale en-US luôn trả về định dạng m/d/yyyy
  return {
    year: parseInt(parts[2], 10),
    month: parseInt(parts[0], 10) - 1, // 0-indexed month
    day: parseInt(parts[1], 10)
  };
}

export function getTodayVNString(): string {
  const { year, month, day } = getTodayVNParts();
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function getNowVNDateLocal(): Date {
  const { year, month, day } = getTodayVNParts();
  // Khởi tạo Date theo múi giờ local của trình duyệt nhưng giữ nguyên ngày tháng của VN.
  // Nhờ đó các hàm getDay(), getDate() sẽ luôn trả về kết quả chuẩn của VN.
  return new Date(year, month, day);
}

/**
 * Lấy Tháng Công (Cycle Month) của một ngày.
 * Tháng công N sẽ bắt đầu từ 21 tháng N-1 đến 20 tháng N.
 * Ví dụ: 2026-06-25 -> thuộc Tháng 7 năm 2026.
 */
export function getCycleMonthFromDate(date: Date): Date {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (day > 20) {
    // Thuộc tháng tiếp theo
    return new Date(year, month + 1, 1);
  }
  // Thuộc tháng hiện tại
  return new Date(year, month, 1);
}

/**
 * Trả về ngày bắt đầu và kết thúc của một Tháng Công.
 * @param cycleMonth Ngày bất kỳ đại diện cho tháng công (thường là ngày mùng 1 của tháng đó)
 * @returns { start: Date, end: Date }
 */
export function getCycleRange(cycleMonth: Date): { start: Date, end: Date } {
  const month = cycleMonth.getMonth();
  const year = cycleMonth.getFullYear();

  const start = new Date(year, month - 1, CYCLE_START_DAY);
  const end = new Date(year, month, CYCLE_END_DAY, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Hàm hỗ trợ lấy chuỗi yyyy-MM-dd để query DB
 */
export function getCycleRangeStrings(cycleMonth: Date): { startStr: string, endStr: string } {
  const { start, end } = getCycleRange(cycleMonth);
  return {
    startStr: format(start, 'yyyy-MM-dd'),
    endStr: format(end, 'yyyy-MM-dd')
  };
}

/**
 * Tính số công chuẩn trong khoảng thời gian.
 * Thứ 2 - Thứ 6: 1.0 công
 * Thứ 7: 0.5 công
 * Chủ Nhật: 0 công
 */
export function calculateRequiredCongForCycle(
  start: Date, 
  end: Date
): number {
  const days = eachDayOfInterval({ start, end });
  
  let required = 0;
  for (const date of days) {
    const dayOfWeek = getDay(date);
    const standardMins = getWorkMinutesForDay(dayOfWeek);
    required += standardMins / FULL_WORKDAY_MINUTES;
  }
  
  return required;
}

/**
 * Trả về chuỗi ngày bắt đầu/kết thúc chu kỳ ký công dạng 'yyyy-MM-dd'.
 * Dùng để query DB mà không cần tạo Date object rồi format lại.
 * @param year  Năm của tháng công (VD: 2026)
 * @param month Tháng công 1-indexed (VD: 7 cho tháng 7)
 */
export function getCycleStringFromYearMonth(
  year: number,
  month: number
): { cycleStartStr: string; cycleEndStr: string } {
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }
  const cycleStartStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${CYCLE_START_DAY}`;
  const cycleEndStr   = `${year}-${month.toString().padStart(2, '0')}-${CYCLE_END_DAY}`;
  return { cycleStartStr, cycleEndStr };
}
